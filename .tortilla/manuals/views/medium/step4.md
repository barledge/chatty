# Step 4: GraphQL Mutations

This is the fourth blog in a multipart series where we will be building Chatty, a WhatsApp clone, using [React Native](https://facebook.github.io/react-native/) and [Apollo](http://dev.apollodata.com/).

Here’s what we will accomplish in this tutorial:
* Design **GraphQL Mutations** and add them to the GraphQL Schemas on our server
* Modify the layout on our React Native client to let users send Messages
* Build GraphQL Mutations on our RN client and connect them to components using `react-apollo`
* Add **Optimistic UI** to our GraphQL Mutations so our RN client updates as soon as the Message is sent — even before the server sends a response!

***YOUR CHALLENGE***
1. Add GraphQL Mutations on our server for creating, modifying, and deleting Groups
2. Add new Screens to our React Native app for creating, modifying, and deleting Groups
3. Build GraphQL Queries and Mutations for our new Screens and connect them using `react-apollo`

# Adding GraphQL Mutations on the Server
While GraphQL Queries let us fetch data from our server, GraphQL Mutations allow us to modify our server held data.

To add a mutation to our GraphQL endpoint, we start by defining the mutation in our GraphQL Schema much like we did with queries. We’ll define a `createMessage` mutation that will enable users to send a new message to a Group:
```
type Mutation {
  # create a new message 
  # text is the message text
  # userId is the id of the user sending the message
  # groupId is the id of the group receiving the message
  createMessage(text: String!, userId: Int!, groupId: Int!): Message
}
```
GraphQL Mutations are written nearly identically like GraphQL Queries. For now, we will require a `userId` parameter to identify who is creating the `Message`, but we won’t need this field once we implement authentication in a future tutorial.

Let’s update our Schema in `server/data/schema.js` to include the mutation:

[{]: <helper> (diffStep 4.1)

#### Step 4.1: Add Mutations to Schema

##### Changed server&#x2F;data&#x2F;schema.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊42┊42┊    group(id: Int!): Group
 ┊43┊43┊  }
 ┊44┊44┊
<b>+┊  ┊45┊  type Mutation {</b>
<b>+┊  ┊46┊    # send a message to a group</b>
<b>+┊  ┊47┊    createMessage(</b>
<b>+┊  ┊48┊      text: String!, userId: Int!, groupId: Int!</b>
<b>+┊  ┊49┊    ): Message</b>
<b>+┊  ┊50┊  }</b>
<b>+┊  ┊51┊  </b>
 ┊45┊52┊  schema {
 ┊46┊53┊    query: Query
<b>+┊  ┊54┊    mutation: Mutation</b>
 ┊47┊55┊  }
 ┊48┊56┊&#x60;];
</pre>

[}]: #

Finally, we need to modify our resolvers to handle our new mutation. We’ll modify `server/data/resolvers.js` as follows:

[{]: <helper> (diffStep 4.2)

#### Step 4.2: Add Mutations to Resolvers

##### Changed server&#x2F;data&#x2F;resolvers.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊18┊18┊      return User.findOne({ where: args });
 ┊19┊19┊    },
 ┊20┊20┊  },
<b>+┊  ┊21┊  Mutation: {</b>
<b>+┊  ┊22┊    createMessage(_, { text, userId, groupId }) {</b>
<b>+┊  ┊23┊      return Message.create({</b>
<b>+┊  ┊24┊        userId,</b>
<b>+┊  ┊25┊        text,</b>
<b>+┊  ┊26┊        groupId,</b>
<b>+┊  ┊27┊      });</b>
<b>+┊  ┊28┊    },</b>
<b>+┊  ┊29┊  },</b>
 ┊21┊30┊  Group: {
 ┊22┊31┊    users(group) {
 ┊23┊32┊      return group.getUsers();
</pre>

[}]: #

That’s it! When a client uses `createMessage`, the resolver will use the `Message `model passed by our connector and call `Message.create` with arguments from the mutation. The `Message.create` function returns a Promise that will resolve with the newly created `Message`.

We can easily test our newly minted `createMessage` mutation in GraphIQL to make sure everything works: ![Create Message Img](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-2.png)

# Designing the Input
Wow, that was way faster than when we added queries! All the heavy lifting we did in the first 3 parts of this series is starting to pay off….

Now that our server allows clients to create messages, we can build that functionality into our React Native client. First, we’ll start by creating a new component `MessageInput` where our users will be able to input their messages.

For this component, let's use **cool icons**. [`react-native-vector-icons`](https://github.com/oblador/react-native-vector-icons) is the goto package for adding icons to React Native. Please follow the instructions in the [`react-native-vector-icons` README](https://github.com/oblador/react-native-vector-icons) before moving onto the next step.

```
# make sure you're adding this package in the client folder!!!
cd client

yarn add react-native-vector-icons
react-native link
# this is not enough to install icons!!! PLEASE FOLLOW THE INSTRUCTIONS IN THE README TO PROPERLY INSTALL ICONS!
```
After completing the steps in the README to install icons, we can start putting together the `MessageInput` component in a new file `client/src/components/message-input.component.js`:

[{]: <helper> (diffStep 4.3 files="client/src/components/message-input.component.js")

#### Step 4.3: Create MessageInput

##### Added client&#x2F;src&#x2F;components&#x2F;message-input.component.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import React, { Component, PropTypes } from &#x27;react&#x27;;</b>
<b>+┊  ┊ 2┊import {</b>
<b>+┊  ┊ 3┊  StyleSheet,</b>
<b>+┊  ┊ 4┊  TextInput,</b>
<b>+┊  ┊ 5┊  View,</b>
<b>+┊  ┊ 6┊} from &#x27;react-native&#x27;;</b>
<b>+┊  ┊ 7┊</b>
<b>+┊  ┊ 8┊import Icon from &#x27;react-native-vector-icons/FontAwesome&#x27;;</b>
<b>+┊  ┊ 9┊</b>
<b>+┊  ┊10┊const styles &#x3D; StyleSheet.create({</b>
<b>+┊  ┊11┊  container: {</b>
<b>+┊  ┊12┊    alignSelf: &#x27;flex-end&#x27;,</b>
<b>+┊  ┊13┊    backgroundColor: &#x27;#f5f1ee&#x27;,</b>
<b>+┊  ┊14┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊  ┊15┊    borderTopWidth: 1,</b>
<b>+┊  ┊16┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊  ┊17┊  },</b>
<b>+┊  ┊18┊  inputContainer: {</b>
<b>+┊  ┊19┊    flex: 1,</b>
<b>+┊  ┊20┊    paddingHorizontal: 12,</b>
<b>+┊  ┊21┊    paddingVertical: 6,</b>
<b>+┊  ┊22┊  },</b>
<b>+┊  ┊23┊  input: {</b>
<b>+┊  ┊24┊    backgroundColor: &#x27;white&#x27;,</b>
<b>+┊  ┊25┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊  ┊26┊    borderRadius: 15,</b>
<b>+┊  ┊27┊    borderWidth: 1,</b>
<b>+┊  ┊28┊    color: &#x27;black&#x27;,</b>
<b>+┊  ┊29┊    height: 32,</b>
<b>+┊  ┊30┊    paddingHorizontal: 8,</b>
<b>+┊  ┊31┊  },</b>
<b>+┊  ┊32┊  sendButtonContainer: {</b>
<b>+┊  ┊33┊    paddingRight: 12,</b>
<b>+┊  ┊34┊    paddingVertical: 6,</b>
<b>+┊  ┊35┊  },</b>
<b>+┊  ┊36┊  sendButton: {</b>
<b>+┊  ┊37┊    height: 32,</b>
<b>+┊  ┊38┊    width: 32,</b>
<b>+┊  ┊39┊  },</b>
<b>+┊  ┊40┊  iconStyle: {</b>
<b>+┊  ┊41┊    marginRight: 0, // default is 12</b>
<b>+┊  ┊42┊  },</b>
<b>+┊  ┊43┊});</b>
<b>+┊  ┊44┊</b>
<b>+┊  ┊45┊const sendButton &#x3D; send &#x3D;&gt; (</b>
<b>+┊  ┊46┊  &lt;Icon.Button</b>
<b>+┊  ┊47┊    backgroundColor&#x3D;{&#x27;blue&#x27;}</b>
<b>+┊  ┊48┊    borderRadius&#x3D;{16}</b>
<b>+┊  ┊49┊    color&#x3D;{&#x27;white&#x27;}</b>
<b>+┊  ┊50┊    iconStyle&#x3D;{styles.iconStyle}</b>
<b>+┊  ┊51┊    name&#x3D;&quot;send&quot;</b>
<b>+┊  ┊52┊    onPress&#x3D;{send}</b>
<b>+┊  ┊53┊    size&#x3D;{16}</b>
<b>+┊  ┊54┊    style&#x3D;{styles.sendButton}</b>
<b>+┊  ┊55┊  /&gt;</b>
<b>+┊  ┊56┊);</b>
<b>+┊  ┊57┊</b>
<b>+┊  ┊58┊class MessageInput extends Component {</b>
<b>+┊  ┊59┊  constructor(props) {</b>
<b>+┊  ┊60┊    super(props);</b>
<b>+┊  ┊61┊    this.state &#x3D; {};</b>
<b>+┊  ┊62┊    this.send &#x3D; this.send.bind(this);</b>
<b>+┊  ┊63┊  }</b>
<b>+┊  ┊64┊</b>
<b>+┊  ┊65┊  send() {</b>
<b>+┊  ┊66┊    this.props.send(this.state.text);</b>
<b>+┊  ┊67┊    this.textInput.clear();</b>
<b>+┊  ┊68┊    this.textInput.blur();</b>
<b>+┊  ┊69┊  }</b>
<b>+┊  ┊70┊</b>
<b>+┊  ┊71┊  render() {</b>
<b>+┊  ┊72┊    return (</b>
<b>+┊  ┊73┊      &lt;View style&#x3D;{styles.container}&gt;</b>
<b>+┊  ┊74┊        &lt;View style&#x3D;{styles.inputContainer}&gt;</b>
<b>+┊  ┊75┊          &lt;TextInput</b>
<b>+┊  ┊76┊            ref&#x3D;{(ref) &#x3D;&gt; { this.textInput &#x3D; ref; }}</b>
<b>+┊  ┊77┊            onChangeText&#x3D;{text &#x3D;&gt; this.setState({ text })}</b>
<b>+┊  ┊78┊            style&#x3D;{styles.input}</b>
<b>+┊  ┊79┊            placeholder&#x3D;&quot;Type your message here!&quot;</b>
<b>+┊  ┊80┊          /&gt;</b>
<b>+┊  ┊81┊        &lt;/View&gt;</b>
<b>+┊  ┊82┊        &lt;View style&#x3D;{styles.sendButtonContainer}&gt;</b>
<b>+┊  ┊83┊          {sendButton(this.send)}</b>
<b>+┊  ┊84┊        &lt;/View&gt;</b>
<b>+┊  ┊85┊      &lt;/View&gt;</b>
<b>+┊  ┊86┊    );</b>
<b>+┊  ┊87┊  }</b>
<b>+┊  ┊88┊}</b>
<b>+┊  ┊89┊</b>
<b>+┊  ┊90┊MessageInput.propTypes &#x3D; {</b>
<b>+┊  ┊91┊  send: PropTypes.func.isRequired,</b>
<b>+┊  ┊92┊};</b>
<b>+┊  ┊93┊</b>
<b>+┊  ┊94┊export default MessageInput;</b>
</pre>

[}]: #

Our `MessageInput` component is a `View` that wraps a controlled `TextInput` and an [`Icon.Button`](https://github.com/oblador/react-native-vector-icons#iconbutton-component). When the button is pressed, `props.send` will be called with the current state of the `TextInput` text and then the `TextInput` will clear. We’ve also added some styling to keep everything looking snazzy.

Let’s add `MessageInput` to the bottom of the `Messages` screen and create a placeholder `send` function:

[{]: <helper> (diffStep 4.4)

#### Step 4.4: Add MessageInput to Messages

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊10┊10┊import { graphql, compose } from &#x27;react-apollo&#x27;;
 ┊11┊11┊
 ┊12┊12┊import Message from &#x27;../components/message.component&#x27;;
<b>+┊  ┊13┊import MessageInput from &#x27;../components/message-input.component&#x27;;</b>
 ┊13┊14┊import GROUP_QUERY from &#x27;../graphql/group.query&#x27;;
 ┊14┊15┊
 ┊15┊16┊const styles &#x3D; StyleSheet.create({
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊37┊38┊    this.state &#x3D; {
 ┊38┊39┊      usernameColors: {},
 ┊39┊40┊    };
<b>+┊  ┊41┊</b>
<b>+┊  ┊42┊    this.send &#x3D; this.send.bind(this);</b>
 ┊40┊43┊  }
 ┊41┊44┊
 ┊42┊45┊  componentWillReceiveProps(nextProps) {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊56┊59┊    }
 ┊57┊60┊  }
 ┊58┊61┊
<b>+┊  ┊62┊  send(text) {</b>
<b>+┊  ┊63┊    // TODO: send the message</b>
<b>+┊  ┊64┊    console.log(&#x60;sending message: ${text}&#x60;);</b>
<b>+┊  ┊65┊  }</b>
<b>+┊  ┊66┊</b>
 ┊59┊67┊  keyExtractor &#x3D; item &#x3D;&gt; item.id;
 ┊60┊68┊
 ┊61┊69┊  renderItem &#x3D; ({ item: message }) &#x3D;&gt; (
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 86┊ 94┊          keyExtractor&#x3D;{this.keyExtractor}
 ┊ 87┊ 95┊          renderItem&#x3D;{this.renderItem}
 ┊ 88┊ 96┊        /&gt;
<b>+┊   ┊ 97┊        &lt;MessageInput send&#x3D;{this.send} /&gt;</b>
 ┊ 89┊ 98┊      &lt;/View&gt;
 ┊ 90┊ 99┊    );
 ┊ 91┊100┊  }
</pre>

[}]: #

It should look like this: ![Message Input Image](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-4.png)

But **don’t be fooled by your simulator!** This UI will break on a phone because of the keyboard: ![Broken Input Image](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-4-2.png)

You are not the first person to groan over this issue. For you and the many groaners out there, the wonderful devs at Facebook have your back. [`KeyboardAvoidingView`](https://facebook.github.io/react-native/docs/keyboardavoidingview.html) to the rescue!

[{]: <helper> (diffStep 4.5)

#### Step 4.5: Add KeyboardAvoidingView

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊1┊1┊import {
 ┊2┊2┊  ActivityIndicator,
 ┊3┊3┊  FlatList,
<b>+┊ ┊4┊  KeyboardAvoidingView,</b>
 ┊4┊5┊  StyleSheet,
 ┊5┊6┊  View,
 ┊6┊7┊} from &#x27;react-native&#x27;;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 88┊ 89┊
 ┊ 89┊ 90┊    // render list of messages for group
 ┊ 90┊ 91┊    return (
<b>+┊   ┊ 92┊      &lt;KeyboardAvoidingView</b>
<b>+┊   ┊ 93┊        behavior&#x3D;{&#x27;position&#x27;}</b>
<b>+┊   ┊ 94┊        contentContainerStyle&#x3D;{styles.container}</b>
<b>+┊   ┊ 95┊        keyboardVerticalOffset&#x3D;{64}</b>
<b>+┊   ┊ 96┊        style&#x3D;{styles.container}</b>
<b>+┊   ┊ 97┊      &gt;</b>
 ┊ 92┊ 98┊        &lt;FlatList
 ┊ 93┊ 99┊          data&#x3D;{group.messages.slice().reverse()}
 ┊ 94┊100┊          keyExtractor&#x3D;{this.keyExtractor}
 ┊ 95┊101┊          renderItem&#x3D;{this.renderItem}
 ┊ 96┊102┊        /&gt;
 ┊ 97┊103┊        &lt;MessageInput send&#x3D;{this.send} /&gt;
<b>+┊   ┊104┊      &lt;/KeyboardAvoidingView&gt;</b>
 ┊ 99┊105┊    );
 ┊100┊106┊  }
 ┊101┊107┊}
</pre>

[}]: #

![Fixed Input Image](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-5.png)

Our layout looks ready. Now let’s make it work!

# Adding GraphQL Mutations on the Client
Let’s start by defining our GraphQL Mutation like we would using GraphIQL:
```
mutation createMessage($text: String!, $userId: Int!, $groupId: Int!) {
  createMessage(text: $text, userId: $userId, groupId: $groupId) {
    id
    from {
      id
      username
    }
    createdAt
    text
  }
}
```
That looks fine, but notice the `Message` fields we want to see returned look exactly like the `Message` fields we are using for `GROUP_QUERY`:
```
query group($groupId: Int!) {
  group(id: $groupId) {
    id
    name
    users {
      id
      username
    }
    messages {
      id
      from {
        id
        username
      }
      createdAt
      text
    }
  }
}
```
GraphQL allows us to reuse pieces of queries and mutations with [**Fragments**](http://graphql.org/learn/queries/#fragments). We can factor out this common set of fields into a `MessageFragment` that looks like this:

[{]: <helper> (diffStep 4.6)

#### Step 4.6: Create MessageFragment

##### Added client&#x2F;src&#x2F;graphql&#x2F;message.fragment.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import gql from &#x27;graphql-tag&#x27;;</b>
<b>+┊  ┊ 2┊</b>
<b>+┊  ┊ 3┊const MESSAGE_FRAGMENT &#x3D; gql&#x60;</b>
<b>+┊  ┊ 4┊  fragment MessageFragment on Message {</b>
<b>+┊  ┊ 5┊    id</b>
<b>+┊  ┊ 6┊    to {</b>
<b>+┊  ┊ 7┊      id</b>
<b>+┊  ┊ 8┊    }</b>
<b>+┊  ┊ 9┊    from {</b>
<b>+┊  ┊10┊      id</b>
<b>+┊  ┊11┊      username</b>
<b>+┊  ┊12┊    }</b>
<b>+┊  ┊13┊    createdAt</b>
<b>+┊  ┊14┊    text</b>
<b>+┊  ┊15┊  }</b>
<b>+┊  ┊16┊&#x60;;</b>
<b>+┊  ┊17┊</b>
<b>+┊  ┊18┊export default MESSAGE_FRAGMENT;</b>
</pre>

[}]: #

Now we can apply `MESSAGE_FRAGMENT` to `GROUP_QUERY` by changing our code as follows:

[{]: <helper> (diffStep 4.7)

#### Step 4.7: Add MessageFragment to Group Query

##### Changed client&#x2F;src&#x2F;graphql&#x2F;group.query.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊1┊1┊import gql from &#x27;graphql-tag&#x27;;
 ┊2┊2┊
<b>+┊ ┊3┊import MESSAGE_FRAGMENT from &#x27;./message.fragment&#x27;;</b>
<b>+┊ ┊4┊</b>
 ┊3┊5┊const GROUP_QUERY &#x3D; gql&#x60;
 ┊4┊6┊  query group($groupId: Int!) {
 ┊5┊7┊    group(id: $groupId) {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊10┊12┊        username
 ┊11┊13┊      }
 ┊12┊14┊      messages {
<b>+┊  ┊15┊        ... MessageFragment</b>
 ┊20┊16┊      }
 ┊21┊17┊    }
 ┊22┊18┊  }
<b>+┊  ┊19┊  ${MESSAGE_FRAGMENT}</b>
 ┊23┊20┊&#x60;;
 ┊24┊21┊
 ┊25┊22┊export default GROUP_QUERY;
</pre>

[}]: #

Let’s also write our `createMessage` mutation using `messageFragment` in a new file `client/src/graphql/createMessage.mutation.js`:

[{]: <helper> (diffStep 4.8)

#### Step 4.8: Create CREATE_MESSAGE_MUTATION

##### Added client&#x2F;src&#x2F;graphql&#x2F;create-message.mutation.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import gql from &#x27;graphql-tag&#x27;;</b>
<b>+┊  ┊ 2┊</b>
<b>+┊  ┊ 3┊import MESSAGE_FRAGMENT from &#x27;./message.fragment&#x27;;</b>
<b>+┊  ┊ 4┊</b>
<b>+┊  ┊ 5┊const CREATE_MESSAGE_MUTATION &#x3D; gql&#x60;</b>
<b>+┊  ┊ 6┊  mutation createMessage($text: String!, $userId: Int!, $groupId: Int!) {</b>
<b>+┊  ┊ 7┊    createMessage(text: $text, userId: $userId, groupId: $groupId) {</b>
<b>+┊  ┊ 8┊      ... MessageFragment</b>
<b>+┊  ┊ 9┊    }</b>
<b>+┊  ┊10┊  }</b>
<b>+┊  ┊11┊  ${MESSAGE_FRAGMENT}</b>
<b>+┊  ┊12┊&#x60;;</b>
<b>+┊  ┊13┊</b>
<b>+┊  ┊14┊export default CREATE_MESSAGE_MUTATION;</b>
</pre>

[}]: #

Now all we have to do is plug our mutation into our `Messages` component using the `graphql` module from `react-apollo`. Before we connect everything, let’s see what a mutation call with the `graphql` module looks like:
```
const createMessage = graphql(CREATE_MESSAGE_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createMessage: ({ text, userId, groupId }) =>
      mutate({
        variables: { text, userId, groupId },
      }),
  }),
});
```
Just like with a GraphQL Query, we first pass our mutation to `graphql`, followed by an Object with configuration params. The `props` param accepts a function with named arguments including `ownProps` (the components current props) and `mutate`. This function should return an Object with the name of the function that we plan to call inside our component, which executes `mutate` with the variables we wish to pass. If that sounds complicated, it’s because it is. Kudos to the Meteor team for putting it together though, because it’s actually some very clever code.

At the end of the day, once you write your first mutation, it’s really mostly a matter of copy/paste and changing the names of the variables.

Okay, so let’s put it all together in `messages.component.js`:

[{]: <helper> (diffStep 4.9)

#### Step 4.9: Add CREATE_MESSAGE_MUTATION to Messages

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊13┊13┊import Message from &#x27;../components/message.component&#x27;;
 ┊14┊14┊import MessageInput from &#x27;../components/message-input.component&#x27;;
 ┊15┊15┊import GROUP_QUERY from &#x27;../graphql/group.query&#x27;;
<b>+┊  ┊16┊import CREATE_MESSAGE_MUTATION from &#x27;../graphql/create-message.mutation&#x27;;</b>
 ┊16┊17┊
 ┊17┊18┊const styles &#x3D; StyleSheet.create({
 ┊18┊19┊  container: {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊61┊62┊  }
 ┊62┊63┊
 ┊63┊64┊  send(text) {
<b>+┊  ┊65┊    this.props.createMessage({</b>
<b>+┊  ┊66┊      groupId: this.props.navigation.state.params.groupId,</b>
<b>+┊  ┊67┊      userId: 1, // faking the user for now</b>
<b>+┊  ┊68┊      text,</b>
<b>+┊  ┊69┊    });</b>
 ┊66┊70┊  }
 ┊67┊71┊
 ┊68┊72┊  keyExtractor &#x3D; item &#x3D;&gt; item.id;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊107┊111┊}
 ┊108┊112┊
 ┊109┊113┊Messages.propTypes &#x3D; {
<b>+┊   ┊114┊  createMessage: PropTypes.func,</b>
<b>+┊   ┊115┊  navigation: PropTypes.shape({</b>
<b>+┊   ┊116┊    state: PropTypes.shape({</b>
<b>+┊   ┊117┊      params: PropTypes.shape({</b>
<b>+┊   ┊118┊        groupId: PropTypes.number,</b>
<b>+┊   ┊119┊      }),</b>
<b>+┊   ┊120┊    }),</b>
<b>+┊   ┊121┊  }),</b>
 ┊110┊122┊  group: PropTypes.shape({
 ┊111┊123┊    messages: PropTypes.array,
 ┊112┊124┊    users: PropTypes.array,
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊125┊137┊  }),
 ┊126┊138┊});
 ┊127┊139┊
<b>+┊   ┊140┊const createMessageMutation &#x3D; graphql(CREATE_MESSAGE_MUTATION, {</b>
<b>+┊   ┊141┊  props: ({ mutate }) &#x3D;&gt; ({</b>
<b>+┊   ┊142┊    createMessage: ({ text, userId, groupId }) &#x3D;&gt;</b>
<b>+┊   ┊143┊      mutate({</b>
<b>+┊   ┊144┊        variables: { text, userId, groupId },</b>
<b>+┊   ┊145┊      }),</b>
<b>+┊   ┊146┊  }),</b>
<b>+┊   ┊147┊});</b>
<b>+┊   ┊148┊</b>
 ┊128┊149┊export default compose(
 ┊129┊150┊  groupQuery,
<b>+┊   ┊151┊  createMessageMutation,</b>
 ┊130┊152┊)(Messages);
</pre>

[}]: #

By attaching `createMessage` with `compose`, we attach a `createMessage` function to the component’s `props`. We call `props.createMessage` in `send` with the required variables (we’ll keep faking the user for now). When the user presses the send button, this method will get called and the mutation should execute.

Let’s run the app and see what happens: ![Send Fail Gif](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-9.gif)

What went wrong? Well technically nothing went wrong. Our mutation successfully executed, but we’re not seeing our message pop up. Why? **Running a mutation doesn’t automatically update our queries with new data!** If we were to refresh the page, we’d actually see our message. This issue only arrises when we are adding or removing data with our mutation.

To overcome this challenge, `react-apollo` lets us declare a property `update` within the argument we pass to mutate. In `update`, we specify which queries should update after the mutation executes and how the data will transform.

Our modified `createMessage` should look like this:

[{]: <helper> (diffStep "4.10")

#### Step 4.10: Add update to mutation

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊27┊27┊  },
 ┊28┊28┊});
 ┊29┊29┊
<b>+┊  ┊30┊function isDuplicateMessage(newMessage, existingMessages) {</b>
<b>+┊  ┊31┊  return newMessage.id !&#x3D;&#x3D; null &amp;&amp;</b>
<b>+┊  ┊32┊    existingMessages.some(message &#x3D;&gt; newMessage.id &#x3D;&#x3D;&#x3D; message.id);</b>
<b>+┊  ┊33┊}</b>
<b>+┊  ┊34┊</b>
 ┊30┊35┊class Messages extends Component {
 ┊31┊36┊  static navigationOptions &#x3D; ({ navigation }) &#x3D;&gt; {
 ┊32┊37┊    const { state } &#x3D; navigation;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊142┊147┊    createMessage: ({ text, userId, groupId }) &#x3D;&gt;
 ┊143┊148┊      mutate({
 ┊144┊149┊        variables: { text, userId, groupId },
<b>+┊   ┊150┊        update: (store, { data: { createMessage } }) &#x3D;&gt; {</b>
<b>+┊   ┊151┊          // Read the data from our cache for this query.</b>
<b>+┊   ┊152┊          const data &#x3D; store.readQuery({</b>
<b>+┊   ┊153┊            query: GROUP_QUERY,</b>
<b>+┊   ┊154┊            variables: {</b>
<b>+┊   ┊155┊              groupId,</b>
<b>+┊   ┊156┊            },</b>
<b>+┊   ┊157┊          });</b>
<b>+┊   ┊158┊</b>
<b>+┊   ┊159┊          if (isDuplicateMessage(createMessage, data.group.messages)) {</b>
<b>+┊   ┊160┊            return data;</b>
<b>+┊   ┊161┊          }</b>
<b>+┊   ┊162┊</b>
<b>+┊   ┊163┊          // Add our message from the mutation to the end.</b>
<b>+┊   ┊164┊          data.group.messages.unshift(createMessage);</b>
<b>+┊   ┊165┊</b>
<b>+┊   ┊166┊          // Write our data back to the cache.</b>
<b>+┊   ┊167┊          store.writeQuery({</b>
<b>+┊   ┊168┊            query: GROUP_QUERY,</b>
<b>+┊   ┊169┊            variables: {</b>
<b>+┊   ┊170┊              groupId,</b>
<b>+┊   ┊171┊            },</b>
<b>+┊   ┊172┊            data,</b>
<b>+┊   ┊173┊          });</b>
<b>+┊   ┊174┊        },</b>
 ┊145┊175┊      }),
<b>+┊   ┊176┊</b>
 ┊146┊177┊  }),
 ┊147┊178┊});
</pre>

[}]: #

In `update`, we first retrieve the existing data for the query we want to update (`GROUP_QUERY`) along with the specific variables we passed to that query. This data comes to us from our Redux store of Apollo data. We check to see if the new `Message` returned from `createMessage` already exists (in case of race conditions down the line), and then update the previous query result by sticking the new message in front. We then use this modified data object and rewrite the results to the Apollo store with `store.writeQuery`, being sure to pass all the variables associated with our query. This will force `props` to change reference and the component to rerender. ![Fixed Send Gif](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-10.gif)

# Optimistic UI
### But wait! There’s more!
`update` will currently only update the query after the mutation succeeds and a response is sent back on the server. But we don’t want to wait till the server returns data  —  we crave instant gratification! If a user with shoddy internet tried to send a message and it didn’t show up right away, they’d probably try and send the message again and again and end up sending the message multiple times… and then they’d yell at customer support!

**Optimistic UI** is our weapon for protecting customer support. We know the shape of the data we expect to receive from the server, so why not fake it until we get a response? `react-apollo` lets us accomplish this by adding an `optimisticResponse` parameter to mutate. In our case it looks like this:

[{]: <helper> (diffStep 4.11)

#### Step 4.11: Add optimisticResponse to mutation

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊147┊147┊    createMessage: ({ text, userId, groupId }) &#x3D;&gt;
 ┊148┊148┊      mutate({
 ┊149┊149┊        variables: { text, userId, groupId },
<b>+┊   ┊150┊        optimisticResponse: {</b>
<b>+┊   ┊151┊          __typename: &#x27;Mutation&#x27;,</b>
<b>+┊   ┊152┊          createMessage: {</b>
<b>+┊   ┊153┊            __typename: &#x27;Message&#x27;,</b>
<b>+┊   ┊154┊            id: -1, // don&#x27;t know id yet, but it doesn&#x27;t matter</b>
<b>+┊   ┊155┊            text, // we know what the text will be</b>
<b>+┊   ┊156┊            createdAt: new Date().toISOString(), // the time is now!</b>
<b>+┊   ┊157┊            from: {</b>
<b>+┊   ┊158┊              __typename: &#x27;User&#x27;,</b>
<b>+┊   ┊159┊              id: 1, // still faking the user</b>
<b>+┊   ┊160┊              username: &#x27;Justyn.Kautzer&#x27;, // still faking the user</b>
<b>+┊   ┊161┊            },</b>
<b>+┊   ┊162┊            to: {</b>
<b>+┊   ┊163┊              __typename: &#x27;Group&#x27;,</b>
<b>+┊   ┊164┊              id: groupId,</b>
<b>+┊   ┊165┊            },</b>
<b>+┊   ┊166┊          },</b>
<b>+┊   ┊167┊        },</b>
 ┊150┊168┊        update: (store, { data: { createMessage } }) &#x3D;&gt; {
 ┊151┊169┊          // Read the data from our cache for this query.
 ┊152┊170┊          const data &#x3D; store.readQuery({
</pre>

[}]: #

The Object returned from `optimisticResponse` is what the data should look like from our server when the mutation succeeds. We need to specify the `__typename` for all  values in our optimistic response just like our server would. Even though we don’t know all values for all fields, we know enough to populate the ones that will show up in the UI, like the text, user, and message creation time. This will essentially be a placeholder until the server responds.

Let’s also modify our UI a bit so that our `FlatList` scrolls to the bottom when we send a message as soon as we receive new data:

[{]: <helper> (diffStep 4.12)

#### Step 4.12: Add scrollToBottom to Messages after send

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊71┊71┊      groupId: this.props.navigation.state.params.groupId,
 ┊72┊72┊      userId: 1, // faking the user for now
 ┊73┊73┊      text,
<b>+┊  ┊74┊    }).then(() &#x3D;&gt; {</b>
<b>+┊  ┊75┊      this.flatList.scrollToEnd({ animated: true });</b>
 ┊74┊76┊    });
 ┊75┊77┊  }
 ┊76┊78┊
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊105┊107┊        style&#x3D;{styles.container}
 ┊106┊108┊      &gt;
 ┊107┊109┊        &lt;FlatList
<b>+┊   ┊110┊          ref&#x3D;{(ref) &#x3D;&gt; { this.flatList &#x3D; ref; }}</b>
 ┊108┊111┊          data&#x3D;{group.messages.slice().reverse()}
 ┊109┊112┊          keyExtractor&#x3D;{this.keyExtractor}
 ┊110┊113┊          renderItem&#x3D;{this.renderItem}
</pre>

[}]: #

![Scroll to Bottom Gif](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-12.gif)

### 🔥🔥🔥!!!

# **YOUR CHALLENGE**
First, let’s take a break. We’ve definitely earned it.

Now that we’re comfortable using GraphQL Queries and Mutations and some tricky stuff in React Native, we can do most of the things we need to do for most basic applications. In fact, there are a number of Chatty features that we can already implement without knowing much else. This post is already plenty long, but there are features left to be built. So with that said, I like to suggest that you try to complete the following features on your own before we move on:

1. Add GraphQL Mutations on our server for creating, modifying, and deleting `Groups`
2. Add new Screens to our React Native app for creating, modifying, and deleting `Groups`
3. Build GraphQL Queries and Mutations for our new Screens and connect them using `react-apollo`
4. Include `update` for these new mutations where necessary

If you want to see some UI or you want a hint or you don’t wanna write any code, that’s cool too! Below is some code with these features added. ![Groups Gif](https://s3-us-west-1.amazonaws.com/tortilla/chatty/step4-13.gif)

[{]: <helper> (diffStep 4.13)

#### Step 4.13: Add Group Mutations and Screens

##### Changed client&#x2F;package.json
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 9┊ 9┊	&quot;dependencies&quot;: {
 ┊10┊10┊		&quot;apollo-client&quot;: &quot;^1.4.0&quot;,
 ┊11┊11┊		&quot;graphql-tag&quot;: &quot;^2.2.1&quot;,
<b>+┊  ┊12┊		&quot;immutability-helper&quot;: &quot;^2.2.2&quot;,</b>
 ┊12┊13┊		&quot;lodash&quot;: &quot;^4.17.4&quot;,
 ┊13┊14┊		&quot;moment&quot;: &quot;^2.18.1&quot;,
 ┊14┊15┊		&quot;prop-types&quot;: &quot;^15.5.10&quot;,
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊16┊17┊		&quot;react&quot;: &quot;16.0.0-alpha.6&quot;,
 ┊17┊18┊		&quot;react-apollo&quot;: &quot;^1.4.2&quot;,
 ┊18┊19┊		&quot;react-native&quot;: &quot;0.44.3&quot;,
<b>+┊  ┊20┊		&quot;react-native-alphabetlistview&quot;: &quot;^0.2.0&quot;,</b>
 ┊19┊21┊		&quot;react-native-vector-icons&quot;: &quot;^4.2.0&quot;,
 ┊20┊22┊		&quot;react-navigation&quot;: &quot;^1.0.0-beta.11&quot;,
 ┊21┊23┊		&quot;react-redux&quot;: &quot;^5.0.5&quot;,
</pre>

##### Added client&#x2F;src&#x2F;components&#x2F;selected-user-list.component.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊   ┊  1┊import React, { Component } from &#x27;react&#x27;;</b>
<b>+┊   ┊  2┊import PropTypes from &#x27;prop-types&#x27;;</b>
<b>+┊   ┊  3┊import {</b>
<b>+┊   ┊  4┊  Image,</b>
<b>+┊   ┊  5┊  ListView,</b>
<b>+┊   ┊  6┊  StyleSheet,</b>
<b>+┊   ┊  7┊  Text,</b>
<b>+┊   ┊  8┊  TouchableOpacity,</b>
<b>+┊   ┊  9┊  View,</b>
<b>+┊   ┊ 10┊} from &#x27;react-native&#x27;;</b>
<b>+┊   ┊ 11┊import Icon from &#x27;react-native-vector-icons/FontAwesome&#x27;;</b>
<b>+┊   ┊ 12┊</b>
<b>+┊   ┊ 13┊const styles &#x3D; StyleSheet.create({</b>
<b>+┊   ┊ 14┊  list: {</b>
<b>+┊   ┊ 15┊    paddingVertical: 8,</b>
<b>+┊   ┊ 16┊  },</b>
<b>+┊   ┊ 17┊  itemContainer: {</b>
<b>+┊   ┊ 18┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 19┊    paddingHorizontal: 12,</b>
<b>+┊   ┊ 20┊  },</b>
<b>+┊   ┊ 21┊  itemIcon: {</b>
<b>+┊   ┊ 22┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 23┊    backgroundColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 24┊    borderColor: &#x27;white&#x27;,</b>
<b>+┊   ┊ 25┊    borderRadius: 10,</b>
<b>+┊   ┊ 26┊    borderWidth: 2,</b>
<b>+┊   ┊ 27┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 28┊    height: 20,</b>
<b>+┊   ┊ 29┊    justifyContent: &#x27;center&#x27;,</b>
<b>+┊   ┊ 30┊    position: &#x27;absolute&#x27;,</b>
<b>+┊   ┊ 31┊    right: -3,</b>
<b>+┊   ┊ 32┊    top: -3,</b>
<b>+┊   ┊ 33┊    width: 20,</b>
<b>+┊   ┊ 34┊  },</b>
<b>+┊   ┊ 35┊  itemImage: {</b>
<b>+┊   ┊ 36┊    borderRadius: 27,</b>
<b>+┊   ┊ 37┊    height: 54,</b>
<b>+┊   ┊ 38┊    width: 54,</b>
<b>+┊   ┊ 39┊  },</b>
<b>+┊   ┊ 40┊});</b>
<b>+┊   ┊ 41┊</b>
<b>+┊   ┊ 42┊export class SelectedUserListItem extends Component {</b>
<b>+┊   ┊ 43┊  constructor(props) {</b>
<b>+┊   ┊ 44┊    super(props);</b>
<b>+┊   ┊ 45┊</b>
<b>+┊   ┊ 46┊    this.remove &#x3D; this.remove.bind(this);</b>
<b>+┊   ┊ 47┊  }</b>
<b>+┊   ┊ 48┊</b>
<b>+┊   ┊ 49┊  remove() {</b>
<b>+┊   ┊ 50┊    this.props.remove(this.props.user);</b>
<b>+┊   ┊ 51┊  }</b>
<b>+┊   ┊ 52┊</b>
<b>+┊   ┊ 53┊  render() {</b>
<b>+┊   ┊ 54┊    const { username } &#x3D; this.props.user;</b>
<b>+┊   ┊ 55┊</b>
<b>+┊   ┊ 56┊    return (</b>
<b>+┊   ┊ 57┊      &lt;View</b>
<b>+┊   ┊ 58┊        style&#x3D;{styles.itemContainer}</b>
<b>+┊   ┊ 59┊      &gt;</b>
<b>+┊   ┊ 60┊        &lt;View&gt;</b>
<b>+┊   ┊ 61┊          &lt;Image</b>
<b>+┊   ┊ 62┊            style&#x3D;{styles.itemImage}</b>
<b>+┊   ┊ 63┊            source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊   ┊ 64┊          /&gt;</b>
<b>+┊   ┊ 65┊          &lt;TouchableOpacity onPress&#x3D;{this.remove} style&#x3D;{styles.itemIcon}&gt;</b>
<b>+┊   ┊ 66┊            &lt;Icon</b>
<b>+┊   ┊ 67┊              color&#x3D;{&#x27;white&#x27;}</b>
<b>+┊   ┊ 68┊              name&#x3D;{&#x27;times&#x27;}</b>
<b>+┊   ┊ 69┊              size&#x3D;{12}</b>
<b>+┊   ┊ 70┊            /&gt;</b>
<b>+┊   ┊ 71┊          &lt;/TouchableOpacity&gt;</b>
<b>+┊   ┊ 72┊        &lt;/View&gt;</b>
<b>+┊   ┊ 73┊        &lt;Text&gt;{username}&lt;/Text&gt;</b>
<b>+┊   ┊ 74┊      &lt;/View&gt;</b>
<b>+┊   ┊ 75┊    );</b>
<b>+┊   ┊ 76┊  }</b>
<b>+┊   ┊ 77┊}</b>
<b>+┊   ┊ 78┊SelectedUserListItem.propTypes &#x3D; {</b>
<b>+┊   ┊ 79┊  user: PropTypes.shape({</b>
<b>+┊   ┊ 80┊    id: PropTypes.number,</b>
<b>+┊   ┊ 81┊    username: PropTypes.string,</b>
<b>+┊   ┊ 82┊  }),</b>
<b>+┊   ┊ 83┊  remove: PropTypes.func,</b>
<b>+┊   ┊ 84┊};</b>
<b>+┊   ┊ 85┊</b>
<b>+┊   ┊ 86┊class SelectedUserList extends Component {</b>
<b>+┊   ┊ 87┊  constructor(props) {</b>
<b>+┊   ┊ 88┊    super(props);</b>
<b>+┊   ┊ 89┊</b>
<b>+┊   ┊ 90┊    this.renderRow &#x3D; this.renderRow.bind(this);</b>
<b>+┊   ┊ 91┊  }</b>
<b>+┊   ┊ 92┊</b>
<b>+┊   ┊ 93┊  renderRow(user) {</b>
<b>+┊   ┊ 94┊    return (</b>
<b>+┊   ┊ 95┊      &lt;SelectedUserListItem user&#x3D;{user} remove&#x3D;{this.props.remove} /&gt;</b>
<b>+┊   ┊ 96┊    );</b>
<b>+┊   ┊ 97┊  }</b>
<b>+┊   ┊ 98┊</b>
<b>+┊   ┊ 99┊  render() {</b>
<b>+┊   ┊100┊    return (</b>
<b>+┊   ┊101┊      &lt;ListView</b>
<b>+┊   ┊102┊        dataSource&#x3D;{this.props.dataSource}</b>
<b>+┊   ┊103┊        renderRow&#x3D;{this.renderRow}</b>
<b>+┊   ┊104┊        horizontal</b>
<b>+┊   ┊105┊        style&#x3D;{styles.list}</b>
<b>+┊   ┊106┊      /&gt;</b>
<b>+┊   ┊107┊    );</b>
<b>+┊   ┊108┊  }</b>
<b>+┊   ┊109┊}</b>
<b>+┊   ┊110┊SelectedUserList.propTypes &#x3D; {</b>
<b>+┊   ┊111┊  dataSource: PropTypes.instanceOf(ListView.DataSource),</b>
<b>+┊   ┊112┊  remove: PropTypes.func,</b>
<b>+┊   ┊113┊};</b>
<b>+┊   ┊114┊</b>
<b>+┊   ┊115┊export default SelectedUserList;</b>
</pre>

##### Added client&#x2F;src&#x2F;graphql&#x2F;create-group.mutation.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import gql from &#x27;graphql-tag&#x27;;</b>
<b>+┊  ┊ 2┊</b>
<b>+┊  ┊ 3┊const CREATE_GROUP_MUTATION &#x3D; gql&#x60;</b>
<b>+┊  ┊ 4┊  mutation createGroup($name: String!, $userIds: [Int!], $userId: Int!) {</b>
<b>+┊  ┊ 5┊    createGroup(name: $name, userIds: $userIds, userId: $userId) {</b>
<b>+┊  ┊ 6┊      id</b>
<b>+┊  ┊ 7┊      name</b>
<b>+┊  ┊ 8┊      users {</b>
<b>+┊  ┊ 9┊        id</b>
<b>+┊  ┊10┊      }</b>
<b>+┊  ┊11┊    }</b>
<b>+┊  ┊12┊  }</b>
<b>+┊  ┊13┊&#x60;;</b>
<b>+┊  ┊14┊</b>
<b>+┊  ┊15┊export default CREATE_GROUP_MUTATION;</b>
</pre>

##### Added client&#x2F;src&#x2F;graphql&#x2F;delete-group.mutation.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import gql from &#x27;graphql-tag&#x27;;</b>
<b>+┊  ┊ 2┊</b>
<b>+┊  ┊ 3┊const DELETE_GROUP_MUTATION &#x3D; gql&#x60;</b>
<b>+┊  ┊ 4┊  mutation deleteGroup($id: Int!) {</b>
<b>+┊  ┊ 5┊    deleteGroup(id: $id) {</b>
<b>+┊  ┊ 6┊      id</b>
<b>+┊  ┊ 7┊    }</b>
<b>+┊  ┊ 8┊  }</b>
<b>+┊  ┊ 9┊&#x60;;</b>
<b>+┊  ┊10┊</b>
<b>+┊  ┊11┊export default DELETE_GROUP_MUTATION;</b>
</pre>

##### Added client&#x2F;src&#x2F;graphql&#x2F;leave-group.mutation.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊  ┊ 1┊import gql from &#x27;graphql-tag&#x27;;</b>
<b>+┊  ┊ 2┊</b>
<b>+┊  ┊ 3┊const LEAVE_GROUP_MUTATION &#x3D; gql&#x60;</b>
<b>+┊  ┊ 4┊  mutation leaveGroup($id: Int!, $userId: Int!) {</b>
<b>+┊  ┊ 5┊    leaveGroup(id: $id, userId: $userId) {</b>
<b>+┊  ┊ 6┊      id</b>
<b>+┊  ┊ 7┊    }</b>
<b>+┊  ┊ 8┊  }</b>
<b>+┊  ┊ 9┊&#x60;;</b>
<b>+┊  ┊10┊</b>
<b>+┊  ┊11┊export default LEAVE_GROUP_MUTATION;</b>
</pre>

##### Changed client&#x2F;src&#x2F;graphql&#x2F;user.query.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊11┊11┊        id
 ┊12┊12┊        name
 ┊13┊13┊      }
<b>+┊  ┊14┊      friends {</b>
<b>+┊  ┊15┊        id</b>
<b>+┊  ┊16┊        username</b>
<b>+┊  ┊17┊      }</b>
 ┊14┊18┊    }
 ┊15┊19┊  }
 ┊16┊20┊&#x60;;
</pre>

##### Changed client&#x2F;src&#x2F;navigation.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 6┊ 6┊
 ┊ 7┊ 7┊import Groups from &#x27;./screens/groups.screen&#x27;;
 ┊ 8┊ 8┊import Messages from &#x27;./screens/messages.screen&#x27;;
<b>+┊  ┊ 9┊import FinalizeGroup from &#x27;./screens/finalize-group.screen&#x27;;</b>
<b>+┊  ┊10┊import GroupDetails from &#x27;./screens/group-details.screen&#x27;;</b>
<b>+┊  ┊11┊import NewGroup from &#x27;./screens/new-group.screen&#x27;;</b>
 ┊ 9┊12┊
 ┊10┊13┊const styles &#x3D; StyleSheet.create({
 ┊11┊14┊  container: {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊41┊44┊const AppNavigator &#x3D; StackNavigator({
 ┊42┊45┊  Main: { screen: MainScreenNavigator },
 ┊43┊46┊  Messages: { screen: Messages },
<b>+┊  ┊47┊  GroupDetails: { screen: GroupDetails },</b>
<b>+┊  ┊48┊  NewGroup: { screen: NewGroup },</b>
<b>+┊  ┊49┊  FinalizeGroup: { screen: FinalizeGroup },</b>
 ┊44┊50┊}, {
 ┊45┊51┊  mode: &#x27;modal&#x27;,
 ┊46┊52┊});
</pre>

##### Added client&#x2F;src&#x2F;screens&#x2F;finalize-group.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊   ┊  1┊import { _ } from &#x27;lodash&#x27;;</b>
<b>+┊   ┊  2┊import React, { Component } from &#x27;react&#x27;;</b>
<b>+┊   ┊  3┊import PropTypes from &#x27;prop-types&#x27;;</b>
<b>+┊   ┊  4┊import {</b>
<b>+┊   ┊  5┊  Alert,</b>
<b>+┊   ┊  6┊  Button,</b>
<b>+┊   ┊  7┊  Image,</b>
<b>+┊   ┊  8┊  ListView,</b>
<b>+┊   ┊  9┊  StyleSheet,</b>
<b>+┊   ┊ 10┊  Text,</b>
<b>+┊   ┊ 11┊  TextInput,</b>
<b>+┊   ┊ 12┊  TouchableOpacity,</b>
<b>+┊   ┊ 13┊  View,</b>
<b>+┊   ┊ 14┊} from &#x27;react-native&#x27;;</b>
<b>+┊   ┊ 15┊import { graphql, compose } from &#x27;react-apollo&#x27;;</b>
<b>+┊   ┊ 16┊import { NavigationActions } from &#x27;react-navigation&#x27;;</b>
<b>+┊   ┊ 17┊import update from &#x27;immutability-helper&#x27;;</b>
<b>+┊   ┊ 18┊</b>
<b>+┊   ┊ 19┊import { USER_QUERY } from &#x27;../graphql/user.query&#x27;;</b>
<b>+┊   ┊ 20┊import CREATE_GROUP_MUTATION from &#x27;../graphql/create-group.mutation&#x27;;</b>
<b>+┊   ┊ 21┊import SelectedUserList from &#x27;../components/selected-user-list.component&#x27;;</b>
<b>+┊   ┊ 22┊</b>
<b>+┊   ┊ 23┊const goToNewGroup &#x3D; group &#x3D;&gt; NavigationActions.reset({</b>
<b>+┊   ┊ 24┊  index: 1,</b>
<b>+┊   ┊ 25┊  actions: [</b>
<b>+┊   ┊ 26┊    NavigationActions.navigate({ routeName: &#x27;Main&#x27; }),</b>
<b>+┊   ┊ 27┊    NavigationActions.navigate({ routeName: &#x27;Messages&#x27;, params: { groupId: group.id, title: group.name } }),</b>
<b>+┊   ┊ 28┊  ],</b>
<b>+┊   ┊ 29┊});</b>
<b>+┊   ┊ 30┊</b>
<b>+┊   ┊ 31┊const styles &#x3D; StyleSheet.create({</b>
<b>+┊   ┊ 32┊  container: {</b>
<b>+┊   ┊ 33┊    flex: 1,</b>
<b>+┊   ┊ 34┊    backgroundColor: &#x27;white&#x27;,</b>
<b>+┊   ┊ 35┊  },</b>
<b>+┊   ┊ 36┊  detailsContainer: {</b>
<b>+┊   ┊ 37┊    padding: 20,</b>
<b>+┊   ┊ 38┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 39┊  },</b>
<b>+┊   ┊ 40┊  imageContainer: {</b>
<b>+┊   ┊ 41┊    paddingRight: 20,</b>
<b>+┊   ┊ 42┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 43┊  },</b>
<b>+┊   ┊ 44┊  inputContainer: {</b>
<b>+┊   ┊ 45┊    flexDirection: &#x27;column&#x27;,</b>
<b>+┊   ┊ 46┊    flex: 1,</b>
<b>+┊   ┊ 47┊  },</b>
<b>+┊   ┊ 48┊  input: {</b>
<b>+┊   ┊ 49┊    color: &#x27;black&#x27;,</b>
<b>+┊   ┊ 50┊    height: 32,</b>
<b>+┊   ┊ 51┊  },</b>
<b>+┊   ┊ 52┊  inputBorder: {</b>
<b>+┊   ┊ 53┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 54┊    borderBottomWidth: 1,</b>
<b>+┊   ┊ 55┊    borderTopWidth: 1,</b>
<b>+┊   ┊ 56┊    paddingVertical: 8,</b>
<b>+┊   ┊ 57┊  },</b>
<b>+┊   ┊ 58┊  inputInstructions: {</b>
<b>+┊   ┊ 59┊    paddingTop: 6,</b>
<b>+┊   ┊ 60┊    color: &#x27;#777&#x27;,</b>
<b>+┊   ┊ 61┊    fontSize: 12,</b>
<b>+┊   ┊ 62┊  },</b>
<b>+┊   ┊ 63┊  groupImage: {</b>
<b>+┊   ┊ 64┊    width: 54,</b>
<b>+┊   ┊ 65┊    height: 54,</b>
<b>+┊   ┊ 66┊    borderRadius: 27,</b>
<b>+┊   ┊ 67┊  },</b>
<b>+┊   ┊ 68┊  selected: {</b>
<b>+┊   ┊ 69┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 70┊  },</b>
<b>+┊   ┊ 71┊  loading: {</b>
<b>+┊   ┊ 72┊    justifyContent: &#x27;center&#x27;,</b>
<b>+┊   ┊ 73┊    flex: 1,</b>
<b>+┊   ┊ 74┊  },</b>
<b>+┊   ┊ 75┊  navIcon: {</b>
<b>+┊   ┊ 76┊    color: &#x27;blue&#x27;,</b>
<b>+┊   ┊ 77┊    fontSize: 18,</b>
<b>+┊   ┊ 78┊    paddingTop: 2,</b>
<b>+┊   ┊ 79┊  },</b>
<b>+┊   ┊ 80┊  participants: {</b>
<b>+┊   ┊ 81┊    paddingHorizontal: 20,</b>
<b>+┊   ┊ 82┊    paddingVertical: 6,</b>
<b>+┊   ┊ 83┊    backgroundColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 84┊    color: &#x27;#777&#x27;,</b>
<b>+┊   ┊ 85┊  },</b>
<b>+┊   ┊ 86┊});</b>
<b>+┊   ┊ 87┊</b>
<b>+┊   ┊ 88┊// helper function checks for duplicate groups, which we receive because we</b>
<b>+┊   ┊ 89┊// get subscription updates for our own groups as well.</b>
<b>+┊   ┊ 90┊// TODO it&#x27;s pretty inefficient to scan all the groups every time.</b>
<b>+┊   ┊ 91┊// maybe only scan the first 10, or up to a certain timestamp</b>
<b>+┊   ┊ 92┊function isDuplicateGroup(newGroup, existingGroups) {</b>
<b>+┊   ┊ 93┊  return newGroup.id !&#x3D;&#x3D; null &amp;&amp; existingGroups.some(group &#x3D;&gt; newGroup.id &#x3D;&#x3D;&#x3D; group.id);</b>
<b>+┊   ┊ 94┊}</b>
<b>+┊   ┊ 95┊</b>
<b>+┊   ┊ 96┊class FinalizeGroup extends Component {</b>
<b>+┊   ┊ 97┊  static navigationOptions &#x3D; ({ navigation }) &#x3D;&gt; {</b>
<b>+┊   ┊ 98┊    const { state } &#x3D; navigation;</b>
<b>+┊   ┊ 99┊    const isReady &#x3D; state.params &amp;&amp; state.params.mode &#x3D;&#x3D;&#x3D; &#x27;ready&#x27;;</b>
<b>+┊   ┊100┊    return {</b>
<b>+┊   ┊101┊      title: &#x27;New Group&#x27;,</b>
<b>+┊   ┊102┊      headerRight: (</b>
<b>+┊   ┊103┊        isReady ? &lt;Button</b>
<b>+┊   ┊104┊          title&#x3D;&quot;Create&quot;</b>
<b>+┊   ┊105┊          onPress&#x3D;{state.params.create}</b>
<b>+┊   ┊106┊        /&gt; : undefined</b>
<b>+┊   ┊107┊      ),</b>
<b>+┊   ┊108┊    };</b>
<b>+┊   ┊109┊  };</b>
<b>+┊   ┊110┊</b>
<b>+┊   ┊111┊  constructor(props) {</b>
<b>+┊   ┊112┊    super(props);</b>
<b>+┊   ┊113┊</b>
<b>+┊   ┊114┊    const { selected } &#x3D; props.navigation.state.params;</b>
<b>+┊   ┊115┊</b>
<b>+┊   ┊116┊    this.state &#x3D; {</b>
<b>+┊   ┊117┊      selected,</b>
<b>+┊   ┊118┊      ds: new ListView.DataSource({</b>
<b>+┊   ┊119┊        rowHasChanged: (r1, r2) &#x3D;&gt; r1 !&#x3D;&#x3D; r2,</b>
<b>+┊   ┊120┊      }).cloneWithRows(selected),</b>
<b>+┊   ┊121┊    };</b>
<b>+┊   ┊122┊</b>
<b>+┊   ┊123┊    this.create &#x3D; this.create.bind(this);</b>
<b>+┊   ┊124┊    this.pop &#x3D; this.pop.bind(this);</b>
<b>+┊   ┊125┊    this.remove &#x3D; this.remove.bind(this);</b>
<b>+┊   ┊126┊  }</b>
<b>+┊   ┊127┊</b>
<b>+┊   ┊128┊  componentDidMount() {</b>
<b>+┊   ┊129┊    this.refreshNavigation(this.state.selected.length &amp;&amp; this.state.name);</b>
<b>+┊   ┊130┊  }</b>
<b>+┊   ┊131┊</b>
<b>+┊   ┊132┊  componentWillUpdate(nextProps, nextState) {</b>
<b>+┊   ┊133┊    if ((nextState.selected.length &amp;&amp; nextState.name) !&#x3D;&#x3D;</b>
<b>+┊   ┊134┊      (this.state.selected.length &amp;&amp; this.state.name)) {</b>
<b>+┊   ┊135┊      this.refreshNavigation(nextState.selected.length &amp;&amp; nextState.name);</b>
<b>+┊   ┊136┊    }</b>
<b>+┊   ┊137┊  }</b>
<b>+┊   ┊138┊</b>
<b>+┊   ┊139┊  pop() {</b>
<b>+┊   ┊140┊    this.props.navigation.goBack();</b>
<b>+┊   ┊141┊  }</b>
<b>+┊   ┊142┊</b>
<b>+┊   ┊143┊  remove(user) {</b>
<b>+┊   ┊144┊    const index &#x3D; this.state.selected.indexOf(user);</b>
<b>+┊   ┊145┊    if (~index) {</b>
<b>+┊   ┊146┊      const selected &#x3D; update(this.state.selected, { $splice: [[index, 1]] });</b>
<b>+┊   ┊147┊      this.setState({</b>
<b>+┊   ┊148┊        selected,</b>
<b>+┊   ┊149┊        ds: this.state.ds.cloneWithRows(selected),</b>
<b>+┊   ┊150┊      });</b>
<b>+┊   ┊151┊    }</b>
<b>+┊   ┊152┊  }</b>
<b>+┊   ┊153┊</b>
<b>+┊   ┊154┊  create() {</b>
<b>+┊   ┊155┊    const { createGroup } &#x3D; this.props;</b>
<b>+┊   ┊156┊</b>
<b>+┊   ┊157┊    createGroup({</b>
<b>+┊   ┊158┊      name: this.state.name,</b>
<b>+┊   ┊159┊      userId: 1, // fake user for now</b>
<b>+┊   ┊160┊      userIds: _.map(this.state.selected, &#x27;id&#x27;),</b>
<b>+┊   ┊161┊    }).then((res) &#x3D;&gt; {</b>
<b>+┊   ┊162┊      this.props.navigation.dispatch(goToNewGroup(res.data.createGroup));</b>
<b>+┊   ┊163┊    }).catch((error) &#x3D;&gt; {</b>
<b>+┊   ┊164┊      Alert.alert(</b>
<b>+┊   ┊165┊        &#x27;Error Creating New Group&#x27;,</b>
<b>+┊   ┊166┊        error.message,</b>
<b>+┊   ┊167┊        [</b>
<b>+┊   ┊168┊          { text: &#x27;OK&#x27;, onPress: () &#x3D;&gt; {} },</b>
<b>+┊   ┊169┊        ],</b>
<b>+┊   ┊170┊      );</b>
<b>+┊   ┊171┊    });</b>
<b>+┊   ┊172┊  }</b>
<b>+┊   ┊173┊</b>
<b>+┊   ┊174┊  refreshNavigation(ready) {</b>
<b>+┊   ┊175┊    const { navigation } &#x3D; this.props;</b>
<b>+┊   ┊176┊    navigation.setParams({</b>
<b>+┊   ┊177┊      mode: ready ? &#x27;ready&#x27; : undefined,</b>
<b>+┊   ┊178┊      create: this.create,</b>
<b>+┊   ┊179┊    });</b>
<b>+┊   ┊180┊  }</b>
<b>+┊   ┊181┊</b>
<b>+┊   ┊182┊  render() {</b>
<b>+┊   ┊183┊    const { friendCount } &#x3D; this.props.navigation.state.params;</b>
<b>+┊   ┊184┊</b>
<b>+┊   ┊185┊    return (</b>
<b>+┊   ┊186┊      &lt;View style&#x3D;{styles.container}&gt;</b>
<b>+┊   ┊187┊        &lt;View style&#x3D;{styles.detailsContainer}&gt;</b>
<b>+┊   ┊188┊          &lt;TouchableOpacity style&#x3D;{styles.imageContainer}&gt;</b>
<b>+┊   ┊189┊            &lt;Image</b>
<b>+┊   ┊190┊              style&#x3D;{styles.groupImage}</b>
<b>+┊   ┊191┊              source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊   ┊192┊            /&gt;</b>
<b>+┊   ┊193┊            &lt;Text&gt;edit&lt;/Text&gt;</b>
<b>+┊   ┊194┊          &lt;/TouchableOpacity&gt;</b>
<b>+┊   ┊195┊          &lt;View style&#x3D;{styles.inputContainer}&gt;</b>
<b>+┊   ┊196┊            &lt;View style&#x3D;{styles.inputBorder}&gt;</b>
<b>+┊   ┊197┊              &lt;TextInput</b>
<b>+┊   ┊198┊                autoFocus</b>
<b>+┊   ┊199┊                onChangeText&#x3D;{name &#x3D;&gt; this.setState({ name })}</b>
<b>+┊   ┊200┊                placeholder&#x3D;&quot;Group Subject&quot;</b>
<b>+┊   ┊201┊                style&#x3D;{styles.input}</b>
<b>+┊   ┊202┊              /&gt;</b>
<b>+┊   ┊203┊            &lt;/View&gt;</b>
<b>+┊   ┊204┊            &lt;Text style&#x3D;{styles.inputInstructions}&gt;</b>
<b>+┊   ┊205┊              {&#x27;Please provide a group subject and optional group icon&#x27;}</b>
<b>+┊   ┊206┊            &lt;/Text&gt;</b>
<b>+┊   ┊207┊          &lt;/View&gt;</b>
<b>+┊   ┊208┊        &lt;/View&gt;</b>
<b>+┊   ┊209┊        &lt;Text style&#x3D;{styles.participants}&gt;</b>
<b>+┊   ┊210┊          {&#x60;participants: ${this.state.selected.length} of ${friendCount}&#x60;.toUpperCase()}</b>
<b>+┊   ┊211┊        &lt;/Text&gt;</b>
<b>+┊   ┊212┊        &lt;View style&#x3D;{styles.selected}&gt;</b>
<b>+┊   ┊213┊          {this.state.selected.length ?</b>
<b>+┊   ┊214┊            &lt;SelectedUserList</b>
<b>+┊   ┊215┊              dataSource&#x3D;{this.state.ds}</b>
<b>+┊   ┊216┊              remove&#x3D;{this.remove}</b>
<b>+┊   ┊217┊            /&gt; : undefined}</b>
<b>+┊   ┊218┊        &lt;/View&gt;</b>
<b>+┊   ┊219┊      &lt;/View&gt;</b>
<b>+┊   ┊220┊    );</b>
<b>+┊   ┊221┊  }</b>
<b>+┊   ┊222┊}</b>
<b>+┊   ┊223┊</b>
<b>+┊   ┊224┊FinalizeGroup.propTypes &#x3D; {</b>
<b>+┊   ┊225┊  createGroup: PropTypes.func.isRequired,</b>
<b>+┊   ┊226┊  navigation: PropTypes.shape({</b>
<b>+┊   ┊227┊    dispatch: PropTypes.func,</b>
<b>+┊   ┊228┊    goBack: PropTypes.func,</b>
<b>+┊   ┊229┊    state: PropTypes.shape({</b>
<b>+┊   ┊230┊      params: PropTypes.shape({</b>
<b>+┊   ┊231┊        friendCount: PropTypes.number.isRequired,</b>
<b>+┊   ┊232┊      }),</b>
<b>+┊   ┊233┊    }),</b>
<b>+┊   ┊234┊  }),</b>
<b>+┊   ┊235┊};</b>
<b>+┊   ┊236┊</b>
<b>+┊   ┊237┊const createGroupMutation &#x3D; graphql(CREATE_GROUP_MUTATION, {</b>
<b>+┊   ┊238┊  props: ({ mutate }) &#x3D;&gt; ({</b>
<b>+┊   ┊239┊    createGroup: ({ name, userIds, userId }) &#x3D;&gt;</b>
<b>+┊   ┊240┊      mutate({</b>
<b>+┊   ┊241┊        variables: { name, userIds, userId },</b>
<b>+┊   ┊242┊        update: (store, { data: { createGroup } }) &#x3D;&gt; {</b>
<b>+┊   ┊243┊          // Read the data from our cache for this query.</b>
<b>+┊   ┊244┊          const data &#x3D; store.readQuery({ query: USER_QUERY, variables: { id: userId } });</b>
<b>+┊   ┊245┊</b>
<b>+┊   ┊246┊          if (isDuplicateGroup(createGroup, data.user.groups)) {</b>
<b>+┊   ┊247┊            return;</b>
<b>+┊   ┊248┊          }</b>
<b>+┊   ┊249┊</b>
<b>+┊   ┊250┊          // Add our message from the mutation to the end.</b>
<b>+┊   ┊251┊          data.user.groups.push(createGroup);</b>
<b>+┊   ┊252┊</b>
<b>+┊   ┊253┊          // Write our data back to the cache.</b>
<b>+┊   ┊254┊          store.writeQuery({</b>
<b>+┊   ┊255┊            query: USER_QUERY,</b>
<b>+┊   ┊256┊            variables: { id: userId },</b>
<b>+┊   ┊257┊            data,</b>
<b>+┊   ┊258┊          });</b>
<b>+┊   ┊259┊        },</b>
<b>+┊   ┊260┊      }),</b>
<b>+┊   ┊261┊  }),</b>
<b>+┊   ┊262┊});</b>
<b>+┊   ┊263┊</b>
<b>+┊   ┊264┊const userQuery &#x3D; graphql(USER_QUERY, {</b>
<b>+┊   ┊265┊  options: ownProps &#x3D;&gt; ({</b>
<b>+┊   ┊266┊    variables: {</b>
<b>+┊   ┊267┊      id: ownProps.navigation.state.params.userId,</b>
<b>+┊   ┊268┊    },</b>
<b>+┊   ┊269┊  }),</b>
<b>+┊   ┊270┊  props: ({ data: { loading, user } }) &#x3D;&gt; ({</b>
<b>+┊   ┊271┊    loading, user,</b>
<b>+┊   ┊272┊  }),</b>
<b>+┊   ┊273┊});</b>
<b>+┊   ┊274┊</b>
<b>+┊   ┊275┊export default compose(</b>
<b>+┊   ┊276┊  userQuery,</b>
<b>+┊   ┊277┊  createGroupMutation,</b>
<b>+┊   ┊278┊)(FinalizeGroup);</b>
</pre>

##### Added client&#x2F;src&#x2F;screens&#x2F;group-details.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊   ┊  1┊// TODO: update group functionality</b>
<b>+┊   ┊  2┊import React, { Component } from &#x27;react&#x27;;</b>
<b>+┊   ┊  3┊import PropTypes from &#x27;prop-types&#x27;;</b>
<b>+┊   ┊  4┊import {</b>
<b>+┊   ┊  5┊  ActivityIndicator,</b>
<b>+┊   ┊  6┊  Button,</b>
<b>+┊   ┊  7┊  Image,</b>
<b>+┊   ┊  8┊  ListView,</b>
<b>+┊   ┊  9┊  StyleSheet,</b>
<b>+┊   ┊ 10┊  Text,</b>
<b>+┊   ┊ 11┊  TouchableOpacity,</b>
<b>+┊   ┊ 12┊  View,</b>
<b>+┊   ┊ 13┊} from &#x27;react-native&#x27;;</b>
<b>+┊   ┊ 14┊import { graphql, compose } from &#x27;react-apollo&#x27;;</b>
<b>+┊   ┊ 15┊import { NavigationActions } from &#x27;react-navigation&#x27;;</b>
<b>+┊   ┊ 16┊</b>
<b>+┊   ┊ 17┊import GROUP_QUERY from &#x27;../graphql/group.query&#x27;;</b>
<b>+┊   ┊ 18┊import USER_QUERY from &#x27;../graphql/user.query&#x27;;</b>
<b>+┊   ┊ 19┊import DELETE_GROUP_MUTATION from &#x27;../graphql/delete-group.mutation&#x27;;</b>
<b>+┊   ┊ 20┊import LEAVE_GROUP_MUTATION from &#x27;../graphql/leave-group.mutation&#x27;;</b>
<b>+┊   ┊ 21┊</b>
<b>+┊   ┊ 22┊const resetAction &#x3D; NavigationActions.reset({</b>
<b>+┊   ┊ 23┊  index: 0,</b>
<b>+┊   ┊ 24┊  actions: [</b>
<b>+┊   ┊ 25┊    NavigationActions.navigate({ routeName: &#x27;Main&#x27; }),</b>
<b>+┊   ┊ 26┊  ],</b>
<b>+┊   ┊ 27┊});</b>
<b>+┊   ┊ 28┊</b>
<b>+┊   ┊ 29┊const styles &#x3D; StyleSheet.create({</b>
<b>+┊   ┊ 30┊  container: {</b>
<b>+┊   ┊ 31┊    flex: 1,</b>
<b>+┊   ┊ 32┊  },</b>
<b>+┊   ┊ 33┊  avatar: {</b>
<b>+┊   ┊ 34┊    width: 32,</b>
<b>+┊   ┊ 35┊    height: 32,</b>
<b>+┊   ┊ 36┊    borderRadius: 16,</b>
<b>+┊   ┊ 37┊  },</b>
<b>+┊   ┊ 38┊  detailsContainer: {</b>
<b>+┊   ┊ 39┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 40┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 41┊  },</b>
<b>+┊   ┊ 42┊  listView: {</b>
<b>+┊   ┊ 43┊</b>
<b>+┊   ┊ 44┊  },</b>
<b>+┊   ┊ 45┊  groupImageContainer: {</b>
<b>+┊   ┊ 46┊    paddingTop: 20,</b>
<b>+┊   ┊ 47┊    paddingHorizontal: 20,</b>
<b>+┊   ┊ 48┊    paddingBottom: 6,</b>
<b>+┊   ┊ 49┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 50┊  },</b>
<b>+┊   ┊ 51┊  groupName: {</b>
<b>+┊   ┊ 52┊    color: &#x27;black&#x27;,</b>
<b>+┊   ┊ 53┊  },</b>
<b>+┊   ┊ 54┊  groupNameBorder: {</b>
<b>+┊   ┊ 55┊    borderBottomWidth: 1,</b>
<b>+┊   ┊ 56┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 57┊    borderTopWidth: 1,</b>
<b>+┊   ┊ 58┊    flex: 1,</b>
<b>+┊   ┊ 59┊    paddingVertical: 8,</b>
<b>+┊   ┊ 60┊  },</b>
<b>+┊   ┊ 61┊  groupImage: {</b>
<b>+┊   ┊ 62┊    width: 54,</b>
<b>+┊   ┊ 63┊    height: 54,</b>
<b>+┊   ┊ 64┊    borderRadius: 27,</b>
<b>+┊   ┊ 65┊  },</b>
<b>+┊   ┊ 66┊  participants: {</b>
<b>+┊   ┊ 67┊    borderBottomWidth: 1,</b>
<b>+┊   ┊ 68┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 69┊    borderTopWidth: 1,</b>
<b>+┊   ┊ 70┊    paddingHorizontal: 20,</b>
<b>+┊   ┊ 71┊    paddingVertical: 6,</b>
<b>+┊   ┊ 72┊    backgroundColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 73┊    color: &#x27;#777&#x27;,</b>
<b>+┊   ┊ 74┊  },</b>
<b>+┊   ┊ 75┊  user: {</b>
<b>+┊   ┊ 76┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 77┊    borderBottomWidth: 1,</b>
<b>+┊   ┊ 78┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 79┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 80┊    padding: 10,</b>
<b>+┊   ┊ 81┊  },</b>
<b>+┊   ┊ 82┊  username: {</b>
<b>+┊   ┊ 83┊    flex: 1,</b>
<b>+┊   ┊ 84┊    fontSize: 16,</b>
<b>+┊   ┊ 85┊    paddingHorizontal: 12,</b>
<b>+┊   ┊ 86┊    paddingVertical: 8,</b>
<b>+┊   ┊ 87┊  },</b>
<b>+┊   ┊ 88┊});</b>
<b>+┊   ┊ 89┊</b>
<b>+┊   ┊ 90┊class GroupDetails extends Component {</b>
<b>+┊   ┊ 91┊  static navigationOptions &#x3D; ({ navigation }) &#x3D;&gt; ({</b>
<b>+┊   ┊ 92┊    title: &#x60;${navigation.state.params.title}&#x60;,</b>
<b>+┊   ┊ 93┊  });</b>
<b>+┊   ┊ 94┊</b>
<b>+┊   ┊ 95┊  constructor(props) {</b>
<b>+┊   ┊ 96┊    super(props);</b>
<b>+┊   ┊ 97┊</b>
<b>+┊   ┊ 98┊    this.state &#x3D; {</b>
<b>+┊   ┊ 99┊      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) &#x3D;&gt; r1 !&#x3D;&#x3D; r2 })</b>
<b>+┊   ┊100┊        .cloneWithRows(props.loading ? [] : props.group.users),</b>
<b>+┊   ┊101┊    };</b>
<b>+┊   ┊102┊</b>
<b>+┊   ┊103┊    this.deleteGroup &#x3D; this.deleteGroup.bind(this);</b>
<b>+┊   ┊104┊    this.leaveGroup &#x3D; this.leaveGroup.bind(this);</b>
<b>+┊   ┊105┊  }</b>
<b>+┊   ┊106┊</b>
<b>+┊   ┊107┊  componentWillReceiveProps(nextProps) {</b>
<b>+┊   ┊108┊    if (nextProps.group &amp;&amp; nextProps.group.users &amp;&amp; nextProps.group !&#x3D;&#x3D; this.props.group) {</b>
<b>+┊   ┊109┊      this.setState({</b>
<b>+┊   ┊110┊        ds: this.state.ds.cloneWithRows(nextProps.group.users),</b>
<b>+┊   ┊111┊      });</b>
<b>+┊   ┊112┊    }</b>
<b>+┊   ┊113┊  }</b>
<b>+┊   ┊114┊</b>
<b>+┊   ┊115┊  deleteGroup() {</b>
<b>+┊   ┊116┊    this.props.deleteGroup(this.props.navigation.state.params.id)</b>
<b>+┊   ┊117┊      .then(() &#x3D;&gt; {</b>
<b>+┊   ┊118┊        this.props.navigation.dispatch(resetAction);</b>
<b>+┊   ┊119┊      })</b>
<b>+┊   ┊120┊      .catch((e) &#x3D;&gt; {</b>
<b>+┊   ┊121┊        console.log(e);   // eslint-disable-line no-console</b>
<b>+┊   ┊122┊      });</b>
<b>+┊   ┊123┊  }</b>
<b>+┊   ┊124┊</b>
<b>+┊   ┊125┊  leaveGroup() {</b>
<b>+┊   ┊126┊    this.props.leaveGroup({</b>
<b>+┊   ┊127┊      id: this.props.navigation.state.params.id,</b>
<b>+┊   ┊128┊      userId: 1,</b>
<b>+┊   ┊129┊    }) // fake user for now</b>
<b>+┊   ┊130┊      .then(() &#x3D;&gt; {</b>
<b>+┊   ┊131┊        this.props.navigation.dispatch(resetAction);</b>
<b>+┊   ┊132┊      })</b>
<b>+┊   ┊133┊      .catch((e) &#x3D;&gt; {</b>
<b>+┊   ┊134┊        console.log(e);   // eslint-disable-line no-console</b>
<b>+┊   ┊135┊      });</b>
<b>+┊   ┊136┊  }</b>
<b>+┊   ┊137┊</b>
<b>+┊   ┊138┊  render() {</b>
<b>+┊   ┊139┊    const { group, loading } &#x3D; this.props;</b>
<b>+┊   ┊140┊</b>
<b>+┊   ┊141┊    // render loading placeholder while we fetch messages</b>
<b>+┊   ┊142┊    if (!group || loading) {</b>
<b>+┊   ┊143┊      return (</b>
<b>+┊   ┊144┊        &lt;View style&#x3D;{[styles.loading, styles.container]}&gt;</b>
<b>+┊   ┊145┊          &lt;ActivityIndicator /&gt;</b>
<b>+┊   ┊146┊        &lt;/View&gt;</b>
<b>+┊   ┊147┊      );</b>
<b>+┊   ┊148┊    }</b>
<b>+┊   ┊149┊</b>
<b>+┊   ┊150┊    return (</b>
<b>+┊   ┊151┊      &lt;View style&#x3D;{styles.container}&gt;</b>
<b>+┊   ┊152┊        &lt;ListView</b>
<b>+┊   ┊153┊          style&#x3D;{styles.listView}</b>
<b>+┊   ┊154┊          enableEmptySections</b>
<b>+┊   ┊155┊          dataSource&#x3D;{this.state.ds}</b>
<b>+┊   ┊156┊          renderHeader&#x3D;{() &#x3D;&gt; (</b>
<b>+┊   ┊157┊            &lt;View&gt;</b>
<b>+┊   ┊158┊              &lt;View style&#x3D;{styles.detailsContainer}&gt;</b>
<b>+┊   ┊159┊                &lt;TouchableOpacity style&#x3D;{styles.groupImageContainer} onPress&#x3D;{this.pickGroupImage}&gt;</b>
<b>+┊   ┊160┊                  &lt;Image</b>
<b>+┊   ┊161┊                    style&#x3D;{styles.groupImage}</b>
<b>+┊   ┊162┊                    source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊   ┊163┊                  /&gt;</b>
<b>+┊   ┊164┊                  &lt;Text&gt;edit&lt;/Text&gt;</b>
<b>+┊   ┊165┊                &lt;/TouchableOpacity&gt;</b>
<b>+┊   ┊166┊                &lt;View style&#x3D;{styles.groupNameBorder}&gt;</b>
<b>+┊   ┊167┊                  &lt;Text style&#x3D;{styles.groupName}&gt;{group.name}&lt;/Text&gt;</b>
<b>+┊   ┊168┊                &lt;/View&gt;</b>
<b>+┊   ┊169┊              &lt;/View&gt;</b>
<b>+┊   ┊170┊              &lt;Text style&#x3D;{styles.participants}&gt;</b>
<b>+┊   ┊171┊                {&#x60;participants: ${group.users.length}&#x60;.toUpperCase()}</b>
<b>+┊   ┊172┊              &lt;/Text&gt;</b>
<b>+┊   ┊173┊            &lt;/View&gt;</b>
<b>+┊   ┊174┊          )}</b>
<b>+┊   ┊175┊          renderFooter&#x3D;{() &#x3D;&gt; (</b>
<b>+┊   ┊176┊            &lt;View&gt;</b>
<b>+┊   ┊177┊              &lt;Button title&#x3D;{&#x27;Leave Group&#x27;} onPress&#x3D;{this.leaveGroup} /&gt;</b>
<b>+┊   ┊178┊              &lt;Button title&#x3D;{&#x27;Delete Group&#x27;} onPress&#x3D;{this.deleteGroup} /&gt;</b>
<b>+┊   ┊179┊            &lt;/View&gt;</b>
<b>+┊   ┊180┊          )}</b>
<b>+┊   ┊181┊          renderRow&#x3D;{user &#x3D;&gt; (</b>
<b>+┊   ┊182┊            &lt;View style&#x3D;{styles.user}&gt;</b>
<b>+┊   ┊183┊              &lt;Image</b>
<b>+┊   ┊184┊                style&#x3D;{styles.avatar}</b>
<b>+┊   ┊185┊                source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊   ┊186┊              /&gt;</b>
<b>+┊   ┊187┊              &lt;Text style&#x3D;{styles.username}&gt;{user.username}&lt;/Text&gt;</b>
<b>+┊   ┊188┊            &lt;/View&gt;</b>
<b>+┊   ┊189┊          )}</b>
<b>+┊   ┊190┊        /&gt;</b>
<b>+┊   ┊191┊      &lt;/View&gt;</b>
<b>+┊   ┊192┊    );</b>
<b>+┊   ┊193┊  }</b>
<b>+┊   ┊194┊}</b>
<b>+┊   ┊195┊</b>
<b>+┊   ┊196┊GroupDetails.propTypes &#x3D; {</b>
<b>+┊   ┊197┊  loading: PropTypes.bool,</b>
<b>+┊   ┊198┊  group: PropTypes.shape({</b>
<b>+┊   ┊199┊    id: PropTypes.number,</b>
<b>+┊   ┊200┊    name: PropTypes.string,</b>
<b>+┊   ┊201┊    users: PropTypes.arrayOf(PropTypes.shape({</b>
<b>+┊   ┊202┊      id: PropTypes.number,</b>
<b>+┊   ┊203┊      username: PropTypes.string,</b>
<b>+┊   ┊204┊    })),</b>
<b>+┊   ┊205┊  }),</b>
<b>+┊   ┊206┊  navigation: PropTypes.shape({</b>
<b>+┊   ┊207┊    dispatch: PropTypes.func,</b>
<b>+┊   ┊208┊    state: PropTypes.shape({</b>
<b>+┊   ┊209┊      params: PropTypes.shape({</b>
<b>+┊   ┊210┊        title: PropTypes.string,</b>
<b>+┊   ┊211┊        id: PropTypes.number,</b>
<b>+┊   ┊212┊      }),</b>
<b>+┊   ┊213┊    }),</b>
<b>+┊   ┊214┊  }),</b>
<b>+┊   ┊215┊  deleteGroup: PropTypes.func.isRequired,</b>
<b>+┊   ┊216┊  leaveGroup: PropTypes.func.isRequired,</b>
<b>+┊   ┊217┊};</b>
<b>+┊   ┊218┊</b>
<b>+┊   ┊219┊const groupQuery &#x3D; graphql(GROUP_QUERY, {</b>
<b>+┊   ┊220┊  options: ownProps &#x3D;&gt; ({ variables: { groupId: ownProps.navigation.state.params.id } }),</b>
<b>+┊   ┊221┊  props: ({ data: { loading, group } }) &#x3D;&gt; ({</b>
<b>+┊   ┊222┊    loading,</b>
<b>+┊   ┊223┊    group,</b>
<b>+┊   ┊224┊  }),</b>
<b>+┊   ┊225┊});</b>
<b>+┊   ┊226┊</b>
<b>+┊   ┊227┊const deleteGroupMutation &#x3D; graphql(DELETE_GROUP_MUTATION, {</b>
<b>+┊   ┊228┊  props: ({ ownProps, mutate }) &#x3D;&gt; ({</b>
<b>+┊   ┊229┊    deleteGroup: id &#x3D;&gt;</b>
<b>+┊   ┊230┊      mutate({</b>
<b>+┊   ┊231┊        variables: { id },</b>
<b>+┊   ┊232┊        update: (store, { data: { deleteGroup } }) &#x3D;&gt; {</b>
<b>+┊   ┊233┊          // Read the data from our cache for this query.</b>
<b>+┊   ┊234┊          const data &#x3D; store.readQuery({ query: USER_QUERY, variables: { id: 1 } }); // fake for now</b>
<b>+┊   ┊235┊</b>
<b>+┊   ┊236┊          // Add our message from the mutation to the end.</b>
<b>+┊   ┊237┊          data.user.groups &#x3D; data.user.groups.filter(g &#x3D;&gt; deleteGroup.id !&#x3D;&#x3D; g.id);</b>
<b>+┊   ┊238┊</b>
<b>+┊   ┊239┊          // Write our data back to the cache.</b>
<b>+┊   ┊240┊          store.writeQuery({</b>
<b>+┊   ┊241┊            query: USER_QUERY,</b>
<b>+┊   ┊242┊            variables: { id: 1 }, // fake for now</b>
<b>+┊   ┊243┊            data,</b>
<b>+┊   ┊244┊          });</b>
<b>+┊   ┊245┊        },</b>
<b>+┊   ┊246┊      }),</b>
<b>+┊   ┊247┊  }),</b>
<b>+┊   ┊248┊});</b>
<b>+┊   ┊249┊</b>
<b>+┊   ┊250┊const leaveGroupMutation &#x3D; graphql(LEAVE_GROUP_MUTATION, {</b>
<b>+┊   ┊251┊  props: ({ ownProps, mutate }) &#x3D;&gt; ({</b>
<b>+┊   ┊252┊    leaveGroup: ({ id, userId }) &#x3D;&gt;</b>
<b>+┊   ┊253┊      mutate({</b>
<b>+┊   ┊254┊        variables: { id, userId },</b>
<b>+┊   ┊255┊        update: (store, { data: { leaveGroup } }) &#x3D;&gt; {</b>
<b>+┊   ┊256┊          // Read the data from our cache for this query.</b>
<b>+┊   ┊257┊          const data &#x3D; store.readQuery({ query: USER_QUERY, variables: { id: 1 } }); // fake for now</b>
<b>+┊   ┊258┊</b>
<b>+┊   ┊259┊          // Add our message from the mutation to the end.</b>
<b>+┊   ┊260┊          data.user.groups &#x3D; data.user.groups.filter(g &#x3D;&gt; leaveGroup.id !&#x3D;&#x3D; g.id);</b>
<b>+┊   ┊261┊</b>
<b>+┊   ┊262┊          // Write our data back to the cache.</b>
<b>+┊   ┊263┊          store.writeQuery({</b>
<b>+┊   ┊264┊            query: USER_QUERY,</b>
<b>+┊   ┊265┊            variables: { id: 1 }, // fake for now</b>
<b>+┊   ┊266┊            data,</b>
<b>+┊   ┊267┊          });</b>
<b>+┊   ┊268┊        },</b>
<b>+┊   ┊269┊      }),</b>
<b>+┊   ┊270┊  }),</b>
<b>+┊   ┊271┊});</b>
<b>+┊   ┊272┊</b>
<b>+┊   ┊273┊export default compose(</b>
<b>+┊   ┊274┊  groupQuery,</b>
<b>+┊   ┊275┊  deleteGroupMutation,</b>
<b>+┊   ┊276┊  leaveGroupMutation,</b>
<b>+┊   ┊277┊)(GroupDetails);</b>
</pre>

##### Changed client&#x2F;src&#x2F;screens&#x2F;groups.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊3┊3┊import {
 ┊4┊4┊  FlatList,
 ┊5┊5┊  ActivityIndicator,
<b>+┊ ┊6┊  Button,</b>
 ┊6┊7┊  StyleSheet,
 ┊7┊8┊  Text,
 ┊8┊9┊  TouchableHighlight,
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊35┊36┊    fontWeight: &#x27;bold&#x27;,
 ┊36┊37┊    flex: 0.7,
 ┊37┊38┊  },
<b>+┊  ┊39┊  header: {</b>
<b>+┊  ┊40┊    alignItems: &#x27;flex-end&#x27;,</b>
<b>+┊  ┊41┊    padding: 6,</b>
<b>+┊  ┊42┊    borderColor: &#x27;#eee&#x27;,</b>
<b>+┊  ┊43┊    borderBottomWidth: 1,</b>
<b>+┊  ┊44┊  },</b>
<b>+┊  ┊45┊  warning: {</b>
<b>+┊  ┊46┊    textAlign: &#x27;center&#x27;,</b>
<b>+┊  ┊47┊    padding: 12,</b>
<b>+┊  ┊48┊  },</b>
 ┊38┊49┊});
 ┊39┊50┊
<b>+┊  ┊51┊const Header &#x3D; ({ onPress }) &#x3D;&gt; (</b>
<b>+┊  ┊52┊  &lt;View style&#x3D;{styles.header}&gt;</b>
<b>+┊  ┊53┊    &lt;Button title&#x3D;{&#x27;New Group&#x27;} onPress&#x3D;{onPress} /&gt;</b>
<b>+┊  ┊54┊  &lt;/View&gt;</b>
<b>+┊  ┊55┊);</b>
<b>+┊  ┊56┊Header.propTypes &#x3D; {</b>
<b>+┊  ┊57┊  onPress: PropTypes.func.isRequired,</b>
<b>+┊  ┊58┊};</b>
<b>+┊  ┊59┊</b>
 ┊40┊60┊class Group extends Component {
 ┊41┊61┊  constructor(props) {
 ┊42┊62┊    super(props);
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 75┊ 95┊  constructor(props) {
 ┊ 76┊ 96┊    super(props);
 ┊ 77┊ 97┊    this.goToMessages &#x3D; this.goToMessages.bind(this);
<b>+┊   ┊ 98┊    this.goToNewGroup &#x3D; this.goToNewGroup.bind(this);</b>
 ┊ 78┊ 99┊  }
 ┊ 79┊100┊
 ┊ 80┊101┊  keyExtractor &#x3D; item &#x3D;&gt; item.id;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 84┊105┊    navigate(&#x27;Messages&#x27;, { groupId: group.id, title: group.name });
 ┊ 85┊106┊  }
 ┊ 86┊107┊
<b>+┊   ┊108┊  goToNewGroup() {</b>
<b>+┊   ┊109┊    const { navigate } &#x3D; this.props.navigation;</b>
<b>+┊   ┊110┊    navigate(&#x27;NewGroup&#x27;);</b>
<b>+┊   ┊111┊  }</b>
<b>+┊   ┊112┊</b>
 ┊ 87┊113┊  renderItem &#x3D; ({ item }) &#x3D;&gt; &lt;Group group&#x3D;{item} goToMessages&#x3D;{this.goToMessages} /&gt;;
 ┊ 88┊114┊
 ┊ 89┊115┊  render() {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 98┊124┊      );
 ┊ 99┊125┊    }
 ┊100┊126┊
<b>+┊   ┊127┊    if (user &amp;&amp; !user.groups.length) {</b>
<b>+┊   ┊128┊      return (</b>
<b>+┊   ┊129┊        &lt;View style&#x3D;{styles.container}&gt;</b>
<b>+┊   ┊130┊          &lt;Header onPress&#x3D;{this.goToNewGroup} /&gt;</b>
<b>+┊   ┊131┊          &lt;Text style&#x3D;{styles.warning}&gt;{&#x27;You do not have any groups.&#x27;}&lt;/Text&gt;</b>
<b>+┊   ┊132┊        &lt;/View&gt;</b>
<b>+┊   ┊133┊      );</b>
<b>+┊   ┊134┊    }</b>
<b>+┊   ┊135┊</b>
 ┊101┊136┊    // render list of groups for user
 ┊102┊137┊    return (
 ┊103┊138┊      &lt;View style&#x3D;{styles.container}&gt;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊105┊140┊          data&#x3D;{user.groups}
 ┊106┊141┊          keyExtractor&#x3D;{this.keyExtractor}
 ┊107┊142┊          renderItem&#x3D;{this.renderItem}
<b>+┊   ┊143┊          ListHeaderComponent&#x3D;{() &#x3D;&gt; &lt;Header onPress&#x3D;{this.goToNewGroup} /&gt;}</b>
 ┊108┊144┊        /&gt;
 ┊109┊145┊      &lt;/View&gt;
 ┊110┊146┊    );
</pre>

##### Changed client&#x2F;src&#x2F;screens&#x2F;messages.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊ 1┊ 1┊import {
 ┊ 2┊ 2┊  ActivityIndicator,
 ┊ 3┊ 3┊  FlatList,
<b>+┊  ┊ 4┊  Image,</b>
 ┊ 4┊ 5┊  KeyboardAvoidingView,
 ┊ 5┊ 6┊  StyleSheet,
<b>+┊  ┊ 7┊  Text,</b>
<b>+┊  ┊ 8┊  TouchableOpacity,</b>
 ┊ 6┊ 9┊  View,
 ┊ 7┊10┊} from &#x27;react-native&#x27;;
 ┊ 8┊11┊import PropTypes from &#x27;prop-types&#x27;;
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊25┊28┊  loading: {
 ┊26┊29┊    justifyContent: &#x27;center&#x27;,
 ┊27┊30┊  },
<b>+┊  ┊31┊  titleWrapper: {</b>
<b>+┊  ┊32┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊  ┊33┊    position: &#x27;absolute&#x27;,</b>
<b>+┊  ┊34┊    left: 0,</b>
<b>+┊  ┊35┊    right: 0,</b>
<b>+┊  ┊36┊  },</b>
<b>+┊  ┊37┊  title: {</b>
<b>+┊  ┊38┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊  ┊39┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊  ┊40┊  },</b>
<b>+┊  ┊41┊  titleImage: {</b>
<b>+┊  ┊42┊    marginRight: 6,</b>
<b>+┊  ┊43┊    width: 32,</b>
<b>+┊  ┊44┊    height: 32,</b>
<b>+┊  ┊45┊    borderRadius: 16,</b>
<b>+┊  ┊46┊  },</b>
 ┊28┊47┊});
 ┊29┊48┊
 ┊30┊49┊function isDuplicateMessage(newMessage, existingMessages) {
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊34┊53┊
 ┊35┊54┊class Messages extends Component {
 ┊36┊55┊  static navigationOptions &#x3D; ({ navigation }) &#x3D;&gt; {
<b>+┊  ┊56┊    const { state, navigate } &#x3D; navigation;</b>
<b>+┊  ┊57┊</b>
<b>+┊  ┊58┊    const goToGroupDetails &#x3D; navigate.bind(this, &#x27;GroupDetails&#x27;, {</b>
<b>+┊  ┊59┊      id: state.params.groupId,</b>
 ┊39┊60┊      title: state.params.title,
<b>+┊  ┊61┊    });</b>
<b>+┊  ┊62┊</b>
<b>+┊  ┊63┊    return {</b>
<b>+┊  ┊64┊      headerTitle: (</b>
<b>+┊  ┊65┊        &lt;TouchableOpacity</b>
<b>+┊  ┊66┊          style&#x3D;{styles.titleWrapper}</b>
<b>+┊  ┊67┊          onPress&#x3D;{goToGroupDetails}</b>
<b>+┊  ┊68┊        &gt;</b>
<b>+┊  ┊69┊          &lt;View style&#x3D;{styles.title}&gt;</b>
<b>+┊  ┊70┊            &lt;Image</b>
<b>+┊  ┊71┊              style&#x3D;{styles.titleImage}</b>
<b>+┊  ┊72┊              source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊  ┊73┊            /&gt;</b>
<b>+┊  ┊74┊            &lt;Text&gt;{state.params.title}&lt;/Text&gt;</b>
<b>+┊  ┊75┊          &lt;/View&gt;</b>
<b>+┊  ┊76┊        &lt;/TouchableOpacity&gt;</b>
<b>+┊  ┊77┊      ),</b>
 ┊40┊78┊    };
 ┊41┊79┊  };
 ┊42┊80┊
</pre>
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊121┊159┊Messages.propTypes &#x3D; {
 ┊122┊160┊  createMessage: PropTypes.func,
 ┊123┊161┊  navigation: PropTypes.shape({
<b>+┊   ┊162┊    navigate: PropTypes.func,</b>
 ┊124┊163┊    state: PropTypes.shape({
 ┊125┊164┊      params: PropTypes.shape({
 ┊126┊165┊        groupId: PropTypes.number,
</pre>

##### Added client&#x2F;src&#x2F;screens&#x2F;new-group.screen.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
<b>+┊   ┊  1┊import { _ } from &#x27;lodash&#x27;;</b>
<b>+┊   ┊  2┊import React, { Component } from &#x27;react&#x27;;</b>
<b>+┊   ┊  3┊import PropTypes from &#x27;prop-types&#x27;;</b>
<b>+┊   ┊  4┊import {</b>
<b>+┊   ┊  5┊  ActivityIndicator,</b>
<b>+┊   ┊  6┊  Button,</b>
<b>+┊   ┊  7┊  Image,</b>
<b>+┊   ┊  8┊  ListView,</b>
<b>+┊   ┊  9┊  StyleSheet,</b>
<b>+┊   ┊ 10┊  Text,</b>
<b>+┊   ┊ 11┊  View,</b>
<b>+┊   ┊ 12┊} from &#x27;react-native&#x27;;</b>
<b>+┊   ┊ 13┊import { graphql, compose } from &#x27;react-apollo&#x27;;</b>
<b>+┊   ┊ 14┊import AlphabetListView from &#x27;react-native-alphabetlistview&#x27;;</b>
<b>+┊   ┊ 15┊import update from &#x27;immutability-helper&#x27;;</b>
<b>+┊   ┊ 16┊import Icon from &#x27;react-native-vector-icons/FontAwesome&#x27;;</b>
<b>+┊   ┊ 17┊</b>
<b>+┊   ┊ 18┊import SelectedUserList from &#x27;../components/selected-user-list.component&#x27;;</b>
<b>+┊   ┊ 19┊import USER_QUERY from &#x27;../graphql/user.query&#x27;;</b>
<b>+┊   ┊ 20┊</b>
<b>+┊   ┊ 21┊// eslint-disable-next-line</b>
<b>+┊   ┊ 22┊const sortObject &#x3D; o &#x3D;&gt; Object.keys(o).sort().reduce((r, k) &#x3D;&gt; (r[k] &#x3D; o[k], r), {});</b>
<b>+┊   ┊ 23┊</b>
<b>+┊   ┊ 24┊const styles &#x3D; StyleSheet.create({</b>
<b>+┊   ┊ 25┊  container: {</b>
<b>+┊   ┊ 26┊    flex: 1,</b>
<b>+┊   ┊ 27┊    backgroundColor: &#x27;white&#x27;,</b>
<b>+┊   ┊ 28┊  },</b>
<b>+┊   ┊ 29┊  cellContainer: {</b>
<b>+┊   ┊ 30┊    alignItems: &#x27;center&#x27;,</b>
<b>+┊   ┊ 31┊    flex: 1,</b>
<b>+┊   ┊ 32┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 33┊    flexWrap: &#x27;wrap&#x27;,</b>
<b>+┊   ┊ 34┊    paddingHorizontal: 12,</b>
<b>+┊   ┊ 35┊    paddingVertical: 6,</b>
<b>+┊   ┊ 36┊  },</b>
<b>+┊   ┊ 37┊  cellImage: {</b>
<b>+┊   ┊ 38┊    width: 32,</b>
<b>+┊   ┊ 39┊    height: 32,</b>
<b>+┊   ┊ 40┊    borderRadius: 16,</b>
<b>+┊   ┊ 41┊  },</b>
<b>+┊   ┊ 42┊  cellLabel: {</b>
<b>+┊   ┊ 43┊    flex: 1,</b>
<b>+┊   ┊ 44┊    fontSize: 16,</b>
<b>+┊   ┊ 45┊    paddingHorizontal: 12,</b>
<b>+┊   ┊ 46┊    paddingVertical: 8,</b>
<b>+┊   ┊ 47┊  },</b>
<b>+┊   ┊ 48┊  selected: {</b>
<b>+┊   ┊ 49┊    flexDirection: &#x27;row&#x27;,</b>
<b>+┊   ┊ 50┊  },</b>
<b>+┊   ┊ 51┊  loading: {</b>
<b>+┊   ┊ 52┊    justifyContent: &#x27;center&#x27;,</b>
<b>+┊   ┊ 53┊    flex: 1,</b>
<b>+┊   ┊ 54┊  },</b>
<b>+┊   ┊ 55┊  navIcon: {</b>
<b>+┊   ┊ 56┊    color: &#x27;blue&#x27;,</b>
<b>+┊   ┊ 57┊    fontSize: 18,</b>
<b>+┊   ┊ 58┊    paddingTop: 2,</b>
<b>+┊   ┊ 59┊  },</b>
<b>+┊   ┊ 60┊  checkButtonContainer: {</b>
<b>+┊   ┊ 61┊    paddingRight: 12,</b>
<b>+┊   ┊ 62┊    paddingVertical: 6,</b>
<b>+┊   ┊ 63┊  },</b>
<b>+┊   ┊ 64┊  checkButton: {</b>
<b>+┊   ┊ 65┊    borderWidth: 1,</b>
<b>+┊   ┊ 66┊    borderColor: &#x27;#dbdbdb&#x27;,</b>
<b>+┊   ┊ 67┊    padding: 4,</b>
<b>+┊   ┊ 68┊    height: 24,</b>
<b>+┊   ┊ 69┊    width: 24,</b>
<b>+┊   ┊ 70┊  },</b>
<b>+┊   ┊ 71┊  checkButtonIcon: {</b>
<b>+┊   ┊ 72┊    marginRight: -4, // default is 12</b>
<b>+┊   ┊ 73┊  },</b>
<b>+┊   ┊ 74┊});</b>
<b>+┊   ┊ 75┊</b>
<b>+┊   ┊ 76┊const SectionHeader &#x3D; ({ title }) &#x3D;&gt; {</b>
<b>+┊   ┊ 77┊  // inline styles used for brevity, use a stylesheet when possible</b>
<b>+┊   ┊ 78┊  const textStyle &#x3D; {</b>
<b>+┊   ┊ 79┊    textAlign: &#x27;center&#x27;,</b>
<b>+┊   ┊ 80┊    color: &#x27;#fff&#x27;,</b>
<b>+┊   ┊ 81┊    fontWeight: &#x27;700&#x27;,</b>
<b>+┊   ┊ 82┊    fontSize: 16,</b>
<b>+┊   ┊ 83┊  };</b>
<b>+┊   ┊ 84┊</b>
<b>+┊   ┊ 85┊  const viewStyle &#x3D; {</b>
<b>+┊   ┊ 86┊    backgroundColor: &#x27;#ccc&#x27;,</b>
<b>+┊   ┊ 87┊  };</b>
<b>+┊   ┊ 88┊  return (</b>
<b>+┊   ┊ 89┊    &lt;View style&#x3D;{viewStyle}&gt;</b>
<b>+┊   ┊ 90┊      &lt;Text style&#x3D;{textStyle}&gt;{title}&lt;/Text&gt;</b>
<b>+┊   ┊ 91┊    &lt;/View&gt;</b>
<b>+┊   ┊ 92┊  );</b>
<b>+┊   ┊ 93┊};</b>
<b>+┊   ┊ 94┊SectionHeader.propTypes &#x3D; {</b>
<b>+┊   ┊ 95┊  title: PropTypes.string,</b>
<b>+┊   ┊ 96┊};</b>
<b>+┊   ┊ 97┊</b>
<b>+┊   ┊ 98┊const SectionItem &#x3D; ({ title }) &#x3D;&gt; (</b>
<b>+┊   ┊ 99┊  &lt;Text style&#x3D;{{ color: &#x27;blue&#x27; }}&gt;{title}&lt;/Text&gt;</b>
<b>+┊   ┊100┊);</b>
<b>+┊   ┊101┊SectionItem.propTypes &#x3D; {</b>
<b>+┊   ┊102┊  title: PropTypes.string,</b>
<b>+┊   ┊103┊};</b>
<b>+┊   ┊104┊</b>
<b>+┊   ┊105┊class Cell extends Component {</b>
<b>+┊   ┊106┊  constructor(props) {</b>
<b>+┊   ┊107┊    super(props);</b>
<b>+┊   ┊108┊    this.toggle &#x3D; this.toggle.bind(this);</b>
<b>+┊   ┊109┊    this.state &#x3D; {</b>
<b>+┊   ┊110┊      isSelected: props.isSelected(props.item),</b>
<b>+┊   ┊111┊    };</b>
<b>+┊   ┊112┊  }</b>
<b>+┊   ┊113┊</b>
<b>+┊   ┊114┊  componentWillReceiveProps(nextProps) {</b>
<b>+┊   ┊115┊    this.setState({</b>
<b>+┊   ┊116┊      isSelected: nextProps.isSelected(nextProps.item),</b>
<b>+┊   ┊117┊    });</b>
<b>+┊   ┊118┊  }</b>
<b>+┊   ┊119┊</b>
<b>+┊   ┊120┊  toggle() {</b>
<b>+┊   ┊121┊    this.props.toggle(this.props.item);</b>
<b>+┊   ┊122┊  }</b>
<b>+┊   ┊123┊</b>
<b>+┊   ┊124┊  render() {</b>
<b>+┊   ┊125┊    return (</b>
<b>+┊   ┊126┊      &lt;View style&#x3D;{styles.cellContainer}&gt;</b>
<b>+┊   ┊127┊        &lt;Image</b>
<b>+┊   ┊128┊          style&#x3D;{styles.cellImage}</b>
<b>+┊   ┊129┊          source&#x3D;{{ uri: &#x27;https://facebook.github.io/react/img/logo_og.png&#x27; }}</b>
<b>+┊   ┊130┊        /&gt;</b>
<b>+┊   ┊131┊        &lt;Text style&#x3D;{styles.cellLabel}&gt;{this.props.item.username}&lt;/Text&gt;</b>
<b>+┊   ┊132┊        &lt;View style&#x3D;{styles.checkButtonContainer}&gt;</b>
<b>+┊   ┊133┊          &lt;Icon.Button</b>
<b>+┊   ┊134┊            backgroundColor&#x3D;{this.state.isSelected ? &#x27;blue&#x27; : &#x27;white&#x27;}</b>
<b>+┊   ┊135┊            borderRadius&#x3D;{12}</b>
<b>+┊   ┊136┊            color&#x3D;{&#x27;white&#x27;}</b>
<b>+┊   ┊137┊            iconStyle&#x3D;{styles.checkButtonIcon}</b>
<b>+┊   ┊138┊            name&#x3D;{&#x27;check&#x27;}</b>
<b>+┊   ┊139┊            onPress&#x3D;{this.toggle}</b>
<b>+┊   ┊140┊            size&#x3D;{16}</b>
<b>+┊   ┊141┊            style&#x3D;{styles.checkButton}</b>
<b>+┊   ┊142┊          /&gt;</b>
<b>+┊   ┊143┊        &lt;/View&gt;</b>
<b>+┊   ┊144┊      &lt;/View&gt;</b>
<b>+┊   ┊145┊    );</b>
<b>+┊   ┊146┊  }</b>
<b>+┊   ┊147┊}</b>
<b>+┊   ┊148┊Cell.propTypes &#x3D; {</b>
<b>+┊   ┊149┊  isSelected: PropTypes.func,</b>
<b>+┊   ┊150┊  item: PropTypes.shape({</b>
<b>+┊   ┊151┊    username: PropTypes.string.isRequired,</b>
<b>+┊   ┊152┊  }).isRequired,</b>
<b>+┊   ┊153┊  toggle: PropTypes.func.isRequired,</b>
<b>+┊   ┊154┊};</b>
<b>+┊   ┊155┊</b>
<b>+┊   ┊156┊class NewGroup extends Component {</b>
<b>+┊   ┊157┊  static navigationOptions &#x3D; ({ navigation }) &#x3D;&gt; {</b>
<b>+┊   ┊158┊    const { state } &#x3D; navigation;</b>
<b>+┊   ┊159┊    const isReady &#x3D; state.params &amp;&amp; state.params.mode &#x3D;&#x3D;&#x3D; &#x27;ready&#x27;;</b>
<b>+┊   ┊160┊    return {</b>
<b>+┊   ┊161┊      title: &#x27;New Group&#x27;,</b>
<b>+┊   ┊162┊      headerRight: (</b>
<b>+┊   ┊163┊        isReady ? &lt;Button</b>
<b>+┊   ┊164┊          title&#x3D;&quot;Next&quot;</b>
<b>+┊   ┊165┊          onPress&#x3D;{state.params.finalizeGroup}</b>
<b>+┊   ┊166┊        /&gt; : undefined</b>
<b>+┊   ┊167┊      ),</b>
<b>+┊   ┊168┊    };</b>
<b>+┊   ┊169┊  };</b>
<b>+┊   ┊170┊</b>
<b>+┊   ┊171┊  constructor(props) {</b>
<b>+┊   ┊172┊    super(props);</b>
<b>+┊   ┊173┊</b>
<b>+┊   ┊174┊    let selected &#x3D; [];</b>
<b>+┊   ┊175┊    if (this.props.navigation.state.params) {</b>
<b>+┊   ┊176┊      selected &#x3D; this.props.navigation.state.params.selected;</b>
<b>+┊   ┊177┊    }</b>
<b>+┊   ┊178┊</b>
<b>+┊   ┊179┊    this.state &#x3D; {</b>
<b>+┊   ┊180┊      selected: selected || [],</b>
<b>+┊   ┊181┊      friends: props.user ?</b>
<b>+┊   ┊182┊        _.groupBy(props.user.friends, friend &#x3D;&gt; friend.username.charAt(0).toUpperCase()) : [],</b>
<b>+┊   ┊183┊      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) &#x3D;&gt; r1 !&#x3D;&#x3D; r2 }),</b>
<b>+┊   ┊184┊    };</b>
<b>+┊   ┊185┊</b>
<b>+┊   ┊186┊    this.finalizeGroup &#x3D; this.finalizeGroup.bind(this);</b>
<b>+┊   ┊187┊    this.isSelected &#x3D; this.isSelected.bind(this);</b>
<b>+┊   ┊188┊    this.toggle &#x3D; this.toggle.bind(this);</b>
<b>+┊   ┊189┊  }</b>
<b>+┊   ┊190┊</b>
<b>+┊   ┊191┊  componentDidMount() {</b>
<b>+┊   ┊192┊    this.refreshNavigation(this.state.selected);</b>
<b>+┊   ┊193┊  }</b>
<b>+┊   ┊194┊</b>
<b>+┊   ┊195┊  componentWillReceiveProps(nextProps) {</b>
<b>+┊   ┊196┊    const state &#x3D; {};</b>
<b>+┊   ┊197┊    if (nextProps.user &amp;&amp; nextProps.user.friends &amp;&amp; nextProps.user !&#x3D;&#x3D; this.props.user) {</b>
<b>+┊   ┊198┊      state.friends &#x3D; sortObject(</b>
<b>+┊   ┊199┊        _.groupBy(nextProps.user.friends, friend &#x3D;&gt; friend.username.charAt(0).toUpperCase()),</b>
<b>+┊   ┊200┊      );</b>
<b>+┊   ┊201┊    }</b>
<b>+┊   ┊202┊</b>
<b>+┊   ┊203┊    if (nextProps.selected) {</b>
<b>+┊   ┊204┊      Object.assign(state, {</b>
<b>+┊   ┊205┊        selected: nextProps.selected,</b>
<b>+┊   ┊206┊        ds: this.state.ds.cloneWithRows(nextProps.selected),</b>
<b>+┊   ┊207┊      });</b>
<b>+┊   ┊208┊    }</b>
<b>+┊   ┊209┊</b>
<b>+┊   ┊210┊    this.setState(state);</b>
<b>+┊   ┊211┊  }</b>
<b>+┊   ┊212┊</b>
<b>+┊   ┊213┊  componentWillUpdate(nextProps, nextState) {</b>
<b>+┊   ┊214┊    if (!!this.state.selected.length !&#x3D;&#x3D; !!nextState.selected.length) {</b>
<b>+┊   ┊215┊      this.refreshNavigation(nextState.selected);</b>
<b>+┊   ┊216┊    }</b>
<b>+┊   ┊217┊  }</b>
<b>+┊   ┊218┊</b>
<b>+┊   ┊219┊  refreshNavigation(selected) {</b>
<b>+┊   ┊220┊    const { navigation } &#x3D; this.props;</b>
<b>+┊   ┊221┊    navigation.setParams({</b>
<b>+┊   ┊222┊      mode: selected &amp;&amp; selected.length ? &#x27;ready&#x27; : undefined,</b>
<b>+┊   ┊223┊      finalizeGroup: this.finalizeGroup,</b>
<b>+┊   ┊224┊    });</b>
<b>+┊   ┊225┊  }</b>
<b>+┊   ┊226┊</b>
<b>+┊   ┊227┊  finalizeGroup() {</b>
<b>+┊   ┊228┊    const { navigate } &#x3D; this.props.navigation;</b>
<b>+┊   ┊229┊    navigate(&#x27;FinalizeGroup&#x27;, {</b>
<b>+┊   ┊230┊      selected: this.state.selected,</b>
<b>+┊   ┊231┊      friendCount: this.props.user.friends.length,</b>
<b>+┊   ┊232┊      userId: this.props.user.id,</b>
<b>+┊   ┊233┊    });</b>
<b>+┊   ┊234┊  }</b>
<b>+┊   ┊235┊</b>
<b>+┊   ┊236┊  isSelected(user) {</b>
<b>+┊   ┊237┊    return ~this.state.selected.indexOf(user);</b>
<b>+┊   ┊238┊  }</b>
<b>+┊   ┊239┊</b>
<b>+┊   ┊240┊  toggle(user) {</b>
<b>+┊   ┊241┊    const index &#x3D; this.state.selected.indexOf(user);</b>
<b>+┊   ┊242┊    if (~index) {</b>
<b>+┊   ┊243┊      const selected &#x3D; update(this.state.selected, { $splice: [[index, 1]] });</b>
<b>+┊   ┊244┊</b>
<b>+┊   ┊245┊      return this.setState({</b>
<b>+┊   ┊246┊        selected,</b>
<b>+┊   ┊247┊        ds: this.state.ds.cloneWithRows(selected),</b>
<b>+┊   ┊248┊      });</b>
<b>+┊   ┊249┊    }</b>
<b>+┊   ┊250┊</b>
<b>+┊   ┊251┊    const selected &#x3D; [...this.state.selected, user];</b>
<b>+┊   ┊252┊</b>
<b>+┊   ┊253┊    return this.setState({</b>
<b>+┊   ┊254┊      selected,</b>
<b>+┊   ┊255┊      ds: this.state.ds.cloneWithRows(selected),</b>
<b>+┊   ┊256┊    });</b>
<b>+┊   ┊257┊  }</b>
<b>+┊   ┊258┊</b>
<b>+┊   ┊259┊  render() {</b>
<b>+┊   ┊260┊    const { user, loading } &#x3D; this.props;</b>
<b>+┊   ┊261┊</b>
<b>+┊   ┊262┊    // render loading placeholder while we fetch messages</b>
<b>+┊   ┊263┊    if (loading || !user) {</b>
<b>+┊   ┊264┊      return (</b>
<b>+┊   ┊265┊        &lt;View style&#x3D;{[styles.loading, styles.container]}&gt;</b>
<b>+┊   ┊266┊          &lt;ActivityIndicator /&gt;</b>
<b>+┊   ┊267┊        &lt;/View&gt;</b>
<b>+┊   ┊268┊      );</b>
<b>+┊   ┊269┊    }</b>
<b>+┊   ┊270┊</b>
<b>+┊   ┊271┊    return (</b>
<b>+┊   ┊272┊      &lt;View style&#x3D;{styles.container}&gt;</b>
<b>+┊   ┊273┊        {this.state.selected.length ? &lt;View style&#x3D;{styles.selected}&gt;</b>
<b>+┊   ┊274┊          &lt;SelectedUserList</b>
<b>+┊   ┊275┊            dataSource&#x3D;{this.state.ds}</b>
<b>+┊   ┊276┊            remove&#x3D;{this.toggle}</b>
<b>+┊   ┊277┊          /&gt;</b>
<b>+┊   ┊278┊        &lt;/View&gt; : undefined}</b>
<b>+┊   ┊279┊        {_.keys(this.state.friends).length ? &lt;AlphabetListView</b>
<b>+┊   ┊280┊          style&#x3D;{{ flex: 1 }}</b>
<b>+┊   ┊281┊          data&#x3D;{this.state.friends}</b>
<b>+┊   ┊282┊          cell&#x3D;{Cell}</b>
<b>+┊   ┊283┊          cellHeight&#x3D;{30}</b>
<b>+┊   ┊284┊          cellProps&#x3D;{{</b>
<b>+┊   ┊285┊            isSelected: this.isSelected,</b>
<b>+┊   ┊286┊            toggle: this.toggle,</b>
<b>+┊   ┊287┊          }}</b>
<b>+┊   ┊288┊          sectionListItem&#x3D;{SectionItem}</b>
<b>+┊   ┊289┊          sectionHeader&#x3D;{SectionHeader}</b>
<b>+┊   ┊290┊          sectionHeaderHeight&#x3D;{22.5}</b>
<b>+┊   ┊291┊        /&gt; : undefined}</b>
<b>+┊   ┊292┊      &lt;/View&gt;</b>
<b>+┊   ┊293┊    );</b>
<b>+┊   ┊294┊  }</b>
<b>+┊   ┊295┊}</b>
<b>+┊   ┊296┊</b>
<b>+┊   ┊297┊NewGroup.propTypes &#x3D; {</b>
<b>+┊   ┊298┊  loading: PropTypes.bool.isRequired,</b>
<b>+┊   ┊299┊  navigation: PropTypes.shape({</b>
<b>+┊   ┊300┊    navigate: PropTypes.func,</b>
<b>+┊   ┊301┊    setParams: PropTypes.func,</b>
<b>+┊   ┊302┊    state: PropTypes.shape({</b>
<b>+┊   ┊303┊      params: PropTypes.object,</b>
<b>+┊   ┊304┊    }),</b>
<b>+┊   ┊305┊  }),</b>
<b>+┊   ┊306┊  user: PropTypes.shape({</b>
<b>+┊   ┊307┊    id: PropTypes.number,</b>
<b>+┊   ┊308┊    friends: PropTypes.arrayOf(PropTypes.shape({</b>
<b>+┊   ┊309┊      id: PropTypes.number,</b>
<b>+┊   ┊310┊      username: PropTypes.string,</b>
<b>+┊   ┊311┊    })),</b>
<b>+┊   ┊312┊  }),</b>
<b>+┊   ┊313┊  selected: PropTypes.arrayOf(PropTypes.object),</b>
<b>+┊   ┊314┊};</b>
<b>+┊   ┊315┊</b>
<b>+┊   ┊316┊const userQuery &#x3D; graphql(USER_QUERY, {</b>
<b>+┊   ┊317┊  options: (ownProps) &#x3D;&gt; ({ variables: { id: 1 } }), // fake for now</b>
<b>+┊   ┊318┊  props: ({ data: { loading, user } }) &#x3D;&gt; ({</b>
<b>+┊   ┊319┊    loading, user,</b>
<b>+┊   ┊320┊  }),</b>
<b>+┊   ┊321┊});</b>
<b>+┊   ┊322┊</b>
<b>+┊   ┊323┊export default compose(</b>
<b>+┊   ┊324┊  userQuery,</b>
<b>+┊   ┊325┊)(NewGroup);</b>
</pre>

##### Changed server&#x2F;data&#x2F;resolvers.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊26┊26┊        groupId,
 ┊27┊27┊      });
 ┊28┊28┊    },
<b>+┊  ┊29┊    createGroup(_, { name, userIds, userId }) {</b>
<b>+┊  ┊30┊      return User.findOne({ where: { id: userId } })</b>
<b>+┊  ┊31┊        .then(user &#x3D;&gt; user.getFriends({ where: { id: { $in: userIds } } })</b>
<b>+┊  ┊32┊          .then(friends &#x3D;&gt; Group.create({</b>
<b>+┊  ┊33┊            name,</b>
<b>+┊  ┊34┊            users: [user, ...friends],</b>
<b>+┊  ┊35┊          })</b>
<b>+┊  ┊36┊            .then(group &#x3D;&gt; group.addUsers([user, ...friends])</b>
<b>+┊  ┊37┊              .then(() &#x3D;&gt; group),</b>
<b>+┊  ┊38┊            ),</b>
<b>+┊  ┊39┊          ),</b>
<b>+┊  ┊40┊        );</b>
<b>+┊  ┊41┊    },</b>
<b>+┊  ┊42┊    deleteGroup(_, { id }) {</b>
<b>+┊  ┊43┊      return Group.find({ where: id })</b>
<b>+┊  ┊44┊        .then(group &#x3D;&gt; group.getUsers()</b>
<b>+┊  ┊45┊          .then(users &#x3D;&gt; group.removeUsers(users))</b>
<b>+┊  ┊46┊          .then(() &#x3D;&gt; Message.destroy({ where: { groupId: group.id } }))</b>
<b>+┊  ┊47┊          .then(() &#x3D;&gt; group.destroy()),</b>
<b>+┊  ┊48┊        );</b>
<b>+┊  ┊49┊    },</b>
<b>+┊  ┊50┊    leaveGroup(_, { id, userId }) {</b>
<b>+┊  ┊51┊      return Group.findOne({ where: { id } })</b>
<b>+┊  ┊52┊        .then((group) &#x3D;&gt; {</b>
<b>+┊  ┊53┊          group.removeUser(userId);</b>
<b>+┊  ┊54┊          return { id };</b>
<b>+┊  ┊55┊        });</b>
<b>+┊  ┊56┊    },</b>
<b>+┊  ┊57┊    updateGroup(_, { id, name }) {</b>
<b>+┊  ┊58┊      return Group.findOne({ where: { id } })</b>
<b>+┊  ┊59┊        .then(group &#x3D;&gt; group.update({ name }));</b>
<b>+┊  ┊60┊    },</b>
 ┊29┊61┊  },
 ┊30┊62┊  Group: {
 ┊31┊63┊    users(group) {
</pre>

##### Changed server&#x2F;data&#x2F;schema.js
<pre>
<i>╔══════╗</i>
<i>║ diff ║</i>
<i>╚══════╝</i>
 ┊47┊47┊    createMessage(
 ┊48┊48┊      text: String!, userId: Int!, groupId: Int!
 ┊49┊49┊    ): Message
<b>+┊  ┊50┊    createGroup(name: String!, userIds: [Int], userId: Int!): Group</b>
<b>+┊  ┊51┊    deleteGroup(id: Int!): Group</b>
<b>+┊  ┊52┊    leaveGroup(id: Int!, userId: Int!): Group # let user leave group</b>
<b>+┊  ┊53┊    updateGroup(id: Int!, name: String): Group</b>
 ┊50┊54┊  }
 ┊51┊55┊  
 ┊52┊56┊  schema {
</pre>

[}]: #
[{]: <helper> (navStep)

⟸ <a href="step3.md">PREVIOUS STEP</a> <b>║</b> <a href="step5.md">NEXT STEP</a> ⟹

[}]: #
