
Assumption 1: assume that we will only need to deal with strings that contain ASCII characters. We have implemented our functions based on this assumption, and non-ASCII characters will cause our functions to not behave correctly. 

Assumption 2: assume that the user who created a channel will automatically be assigned as the channel owner. This assumption is based off of our knowledge of the creation of channels in existing communications applications, where the channel creator is automatically assigned the role of owner/admin. 

Assumption 3: assume that (although the spec does not mention anything about messageId at this point in time), messageId is likely required to be unique across channels. This assumption is based off of our knowledge of message IDs in existing communications platforms such as Discord.

Assumption 4: assume that emails are not treated as case-sensitive. We assume this based on how emails such as 'ABC@gmail.com' and 'abc@gmail.com' are typically treated as identical. We have implemented authRegisterV1 to deal with emails in this way. 

Assumption 5: assume that userId is unique as it is important we should be identified the users with one unique properties as name could be duplicated.

Assumption 6: assume that the data stored in the dataStore is not too big, as this is a simple implementation of the dataStore, and we are not using any database to store the data.