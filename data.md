```javascript
let data = {
  // TODO: insert your data structure that contains
  // users + channels here
  users: [
    {
      authUserId: 1,
      uId: 1,
      nameFirst: "John",
      nameLast: "Smith",
      email: "johnnyboy123@hotmail.com",
      password: "12345678",
      handleStr: "johnnyboy123",
      userPermissions: 1,
      token: ['16343', '13647']
    },
  ],
  channels: [
    {
      channelId: 1,
      channelName: "General",
      ownerMembers: [ { uId: 1 } ],
      allMembers: [ { uId: 1 } ],
      isPublic: true,
      messages: [
        {
          messageId: 1,
          uId: 1,
          message: "Hello world",
          timeSent: 1582426789,
        },
      ],
    },
  ],
};

```


[Optional] short description:
The data object contains two arrays, users and channels.
The users array contains an object with properties that represent a user's information such as their unique authUserId, 
uId, their first and last name, email, password, their handles, and their user permission. 
The channels array contains an object that represents a chat channel with properties such as channelId, channelName, 
channelOwner, channelMembers, isPublic, and messages. 
The channelOwner and channelMembers properties contain an array of objects representing the users who own or are members of the channel. 
The userPermission ditctates the user's controls to the channels.
The messages element contains an array of objects representing the messages sent in the channel, 
with each message object having a messageId, uId (the user who sent the message), message, and timeSent properties.
