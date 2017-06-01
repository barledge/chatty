import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { addNavigationHelpers, StackNavigator, TabNavigator } from 'react-navigation';
import { Text, View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import { map } from 'lodash';

import Groups from './screens/groups.screen';
import Messages from './screens/messages.screen';
import FinalizeGroup from './screens/finalize-group.screen';
import GroupDetails from './screens/group-details.screen';
import NewGroup from './screens/new-group.screen';
import Signin from './screens/signin.screen';

import { USER_QUERY } from './graphql/user.query';
import MESSAGE_ADDED_SUBSCRIPTION from './graphql/message-added.subscription';
import GROUP_ADDED_SUBSCRIPTION from './graphql/group-added.subscription';

// helper function checks for duplicate documents
// TODO: it's pretty inefficient to scan all the documents every time.
// maybe only scan the first 10, or up to a certain timestamp
function isDuplicateDocument(newDocument, existingDocuments) {
  return newDocument.id !== null && existingDocuments.some(doc => newDocument.id === doc.id);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  tabText: {
    color: '#777',
    fontSize: 10,
    justifyContent: 'center',
  },
  selected: {
    color: 'blue',
  },
});

const TestScreen = title => () => (
  <View style={styles.container}>
    <Text>
      {title}
    </Text>
  </View>
);

// tabs in main screen
const MainScreenNavigator = TabNavigator({
  Chats: { screen: Groups },
  Settings: { screen: TestScreen('Settings') },
});

const AppNavigator = StackNavigator({
  Main: { screen: MainScreenNavigator },
  Signin: { screen: Signin },
  Messages: { screen: Messages },
  GroupDetails: { screen: GroupDetails },
  NewGroup: { screen: NewGroup },
  FinalizeGroup: { screen: FinalizeGroup },
}, {
  mode: 'modal',
});

// reducer initialization code
const firstAction = AppNavigator.router.getActionForPathAndParams('Main');
const tempNavState = AppNavigator.router.getStateForAction(firstAction);
const initialNavState = AppNavigator.router.getStateForAction(
  tempNavState,
);

// reducer code
export const navigationReducer = (state = initialNavState, action) => {
  let nextState;
  switch (action.type) {
    default:
      nextState = AppNavigator.router.getStateForAction(action, state);
      break;
  }

  // Simply return the original `state` if `nextState` is null or undefined.
  return nextState || state;
};

class AppWithNavigationState extends Component {
  componentWillReceiveProps(nextProps) {
    if (!nextProps.user) {
      if (this.groupSubscription) {
        this.groupSubscription();
      }

      if (this.messagesSubscription) {
        this.messagesSubscription();
      }
    }

    if (nextProps.user &&
      (!this.props.user || nextProps.user.groups.length !== this.props.user.groups.length)) {
      // unsubscribe from old

      if (typeof this.messagesSubscription === 'function') {
        this.messagesSubscription();
      }
      // subscribe to new
      if (nextProps.user.groups.length) {
        this.messagesSubscription = nextProps.subscribeToMessages();
      }
    }

    if (!this.groupSubscription && nextProps.user) {
      this.groupSubscription = nextProps.subscribeToGroups();
    }
  }

  render() {
    const { dispatch, nav } = this.props;
    return <AppNavigator navigation={addNavigationHelpers({ dispatch, state: nav })} />;
  }
}

AppWithNavigationState.propTypes = {
  dispatch: PropTypes.func.isRequired,
  nav: PropTypes.object.isRequired,
  subscribeToGroups: PropTypes.func,
  subscribeToMessages: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

const mapStateToProps = state => ({
  nav: state.nav,
});

const userQuery = graphql(USER_QUERY, {
  skip: ownProps => true, // fake it -- we'll use ownProps with auth
  options: () => ({ variables: { id: 1 } }), // fake the user for now
  props: ({ data: { loading, user, subscribeToMore } }) => ({
    loading,
    user,
    subscribeToMessages() {
      return subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { groupIds: map(user.groups, 'id') },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newMessage = subscriptionData.data.messageAdded;

          const groupIndex = map(previousGroups, 'id').indexOf(newMessage.to.id);

          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.
          if (isDuplicateDocument(newMessage, previousGroups[groupIndex].messages)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              groups: {
                [groupIndex]: {
                  messages: { $set: [newMessage] },
                },
              },
            },
          });
        },
      });
    },
    subscribeToGroups() {
      return subscribeToMore({
        document: GROUP_ADDED_SUBSCRIPTION,
        variables: { userId: user.id },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.user.groups;
          const newGroup = subscriptionData.data.groupAdded;

          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.
          if (isDuplicateDocument(newGroup, previousGroups)) {
            return previousResult;
          }

          return update(previousResult, {
            user: {
              groups: { $push: [newGroup] },
            },
          });
        },
      });
    },
  }),
});

export default compose(
  connect(mapStateToProps),
  userQuery,
)(AppWithNavigationState);
