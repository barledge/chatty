import React, { Component } from 'react';
import {
  AsyncStorage,
} from 'react-native';

import { ApolloProvider } from 'react-apollo';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import ApolloClient, { createBatchingNetworkInterface } from 'apollo-client';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import _ from 'lodash';

import AppWithNavigationState, { navigationReducer } from './navigation';
import auth from './reducers/auth.reducer';
import { logout } from './actions/auth.actions';

const networkInterface = createBatchingNetworkInterface({
  uri: 'http://localhost:8080/graphql',
  batchInterval: 10,
  queryDeduplication: true,
});

// middleware for requests
networkInterface.use([{
  applyBatchMiddleware(req, next) {
    if (!req.options.headers) {
      req.options.headers = {};
    }
    // get the authentication token from local storage if it exists
    const jwt = store.getState().auth.jwt;
    if (jwt) {
      req.options.headers.authorization = `Bearer ${jwt}`;
    }
    next();
  },
}]);

// afterware for responses
networkInterface.useAfter([{
  applyBatchAfterware({ responses }, next) {
    let isUnauthorized = false;

    responses.forEach((response) => {
      if (response.errors) {
        console.log('GraphQL Error:', response.errors);
        if (_.some(response.errors, { message: 'Unauthorized' })) {
          isUnauthorized = true;
        }
      }
    });

    if (isUnauthorized) {
      store.dispatch(logout());
    }

    next();
  },
}]);

// Create WebSocket client
export const wsClient = new SubscriptionClient('ws://localhost:8080/subscriptions', {
  reconnect: true,
  connectionParams() {
    // get the authentication token from local storage if it exists
    return { jwt: store.getState().auth.jwt };
  },
  lazy: true,
});

// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient,
);

export const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});

const store = createStore(
  combineReducers({
    apollo: client.reducer(),
    nav: navigationReducer,
    auth,
  }),
  {}, // initial state
  composeWithDevTools(
    applyMiddleware(client.middleware(), thunk),
    autoRehydrate(),
  ),
);

// persistent storage
persistStore(store, {
  storage: AsyncStorage,
  blacklist: ['apollo', 'nav'], // don't persist apollo for now, or nav
});

export default class App extends Component {
  render() {
    return (
      <ApolloProvider store={store} client={client}>
        <AppWithNavigationState />
      </ApolloProvider>
    );
  }
}
