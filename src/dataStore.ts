import { DataStore } from './interface'; // import interfaces
import fs from 'fs';
import { getTime } from './other';

// YOU SHOULD MODIFY THIS OBJECT BELOW
let data: DataStore = {
  users: [],
  channels: [],
  dms: [],
  messageId: 0,
  bots: [],
  games: [],
  workspaceStats: {
    channelsExist: [{ numChannelsExist: 0, timeStamp: getTime() }],
    dmsExist: [{ numDmsExist: 0, timeStamp: getTime() }],
    messagesExist: [{ numMessagesExist: 0, timeStamp: getTime() }],
    utilizationRate: 0
  }
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use getData() to access the data
function getData(): typeof data {
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
// - Only needs to be used if you replace the data store entirely
// - Javascript uses pass-by-reference for objects... read more here: https://stackoverflow.com/questions/13104494/does-javascript-pass-by-reference
// Hint: this function might be useful to edit in iteration 2
function setData(newData: typeof data): void {
  data = newData;
  const jsonStr = JSON.stringify(data);
  fs.writeFileSync('src/database.json', jsonStr);
}
export { getData, setData };
