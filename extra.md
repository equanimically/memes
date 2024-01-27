# zID: z5416988

## Chosen bonus feature(s): K-24 (Channel/DM Bot)

### Explanation (~100 words):
A bot that is automatically added into every channel/DM. It can be interacted with via slash commands. 

#### The commands that can be used are:
    - /hello: greets a user
    - /help: displays all commands that a user has permission to use (differs for global owners, channel owners and normal members)
    - /invite @<handleStr>: invites a user to a channel
    - /hangman start: starts a game of hangman in the channel/DM
    - /hangman end: ends the current game of hangman in the channel/DM
    - /guess <letter>: guesses a letter in the current game of hangman
    - /owneradd @<handleStr>: adds a user as a channel owner
    - /ownerremove @<handleStr>: removes a user as a channel owner
    - /perms @<handleStr> <1|2>: changes a user's permissions

K-24 also sends a message when a user joins a channel, and when any of the permission-related commands are successfully executed.

#### Error messages:
Appropriate messages will be sent by K-24 in the channel/DM to handle most error cases, such as incorrect permissions. These errors are the same errors that are thrown as HTTP errors when a user directly tries to perform these actions, but instead they will just get a chat response from K-24 rather than having a red error banner pop up.

Additionally, the channel-specific commands will not work in DMs and an appropriate error message will be sent.

If the user sends the command in the wrong format, for e.g "/owneradd" rather than "/owneradd @<handleStr>", a usage error message will be sent. Sending "/hangman" by itself will give the user a list of possible commands they meant to send (/hangman start, /guess, /hangman end).

The hangman game has its own specific error messages, for e.g guessing a letter that has already been guessed, starting a game in the channel/DM when a game is already active, or guessing a letter/ending a game when there is no game active.

### Link to Flipgrid video:
https://clipchamp.com/watch/w0YahAZqdxJ
