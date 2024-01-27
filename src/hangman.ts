import {
  getData,
  setData,
} from './dataStore';
import {
  HangmanGame,
  HangmanGameId,
  LOSE,
  MAX_INCORRECT_GUESSES,
  UNDETERMINED,
  WIN,
  Word,
} from './interface';
import fs from 'fs';
import { botSendV1 } from './bot';
import {
  GAME_ALREADY_ACTIVE,
  GAME_NOT_ACTIVE,
  GAME_OVER,
  GAME_WIN,
  GUESSES_LEFT,
  GUESS_ALREADY_GUESSED,
  HANGMAN_END,
  HANGMAN_LOGO,
  HANGMAN_START
} from './botCommands';

/**
 * Starts a game of hangman in the given channel/DM
 * Assumes the token, channel/DM are valid, and that the user is part of
 * the given channel/DM
 *
 * @param {number} channelId - The ID of the channel to start the game in,
 * or -1 if the game is to be started in a DM
 * @param {number} dmId - The ID of the DM to start the game in,
 * or -1 if the game is to be started in a channel
 * ...
 *
 * @returns {Promise<HangmanGameId | void>} - returns the gameId of the game if successful,
 * or void if a game is already active
 */
export async function hangmanStartV1 (channelId: number, dmId: number): Promise<HangmanGameId | void> {
  const data = getData();
  let gameId;

  // Error checking
  if (hangmanActiveV1(channelId, dmId)) {
    botSendV1(channelId, dmId, GAME_ALREADY_ACTIVE);
    return;
  }

  // If game will be in channel
  if (channelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    gameId = data.games.length;
    channel.hangmanActive = true;
    channel.hangmanGameId = gameId;
  }

  // If game will be in DM
  if (dmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    gameId = data.games.length;
    dm.hangmanActive = true;
    dm.hangmanGameId = gameId;
  }

  // generate a random word
  const newWord = await genWord();
  const word = newWord.word;
  const definition = newWord.definition;

  // send start message
  const maskedWord = getMaskedWord(word);
  const hangmanStartMsg = '\n' + HANGMAN_START + '\n' + HANGMAN_LOGO + '\n' + 'Word:  ' +
  maskedWord + '\n\n' + 'Guesses:  ';
  await botSendV1(channelId, dmId, hangmanStartMsg);

  const game: HangmanGame = {
    gameId,
    channelId,
    dmId,
    word,
    definition,
    maskedWord,
    lettersLeft: word.length,
    guessesLeft: MAX_INCORRECT_GUESSES,
    guesses: [],
    outcome: UNDETERMINED,
  };

  // add game to data
  data.games.push(game);

  setData(data);
  return { gameId: game.gameId };
}

/**
 * Checks whether there is an active game of hangman in the given channel/DM.
 * Assumes the token, channel/DM are valid, and that the user is part of
 * the given channel/DM.
 *
 * @param {number} channelId - The ID of the channel to check for a game in,
 * or -1 if a DM will be checked
 * @param {number} dmId - The ID of the DM to check for a game in,
 * or -1 if a channel will be checked
 * ...
 *
 * @returns {boolean} - returns true if there is an active game of hangman in the
 * given channel/DM, or false otherwise
 */
export function hangmanActiveV1(channelId: number, dmId: number): boolean {
  const data = getData();

  // Error checking
  if (channelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    return channel.hangmanActive;
  }
  if (dmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    return dm.hangmanActive;
  }
}

/**
 * Ends a game of hangman in the given channel/DM.
 * Assumes the token, channel/DM are valid, and that the user is part of
 * the given channel/DM.
 *
 * @param {number} channelId - The ID of the channel to end a game in,
 * or -1 if a the game will be ended in a DM
 * @param {number} dmId - The ID of the DM to end a game in,
 * or -1 if a the game will be ended in a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
export function hangmanEndV1(channelId: number, dmId: number): void {
  const data = getData();

  // Error checking
  if (!hangmanActiveV1(channelId, dmId)) {
    botSendV1(channelId, dmId, GAME_NOT_ACTIVE);
    return;
  }

  // If game is in channel
  if (channelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    channel.hangmanActive = false;
    channel.hangmanGameId = -1;

  // If game is in DM
  } else if (dmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    dm.hangmanActive = false;
    dm.hangmanGameId = -1;
  }

  botSendV1(channelId, dmId, HANGMAN_END);
  setData(data);
}

/**
 * Guesses a letter in the current game of hangman
 * Assumes the token, channel/DM are valid, and that the user is part of
 * the given channel/DM
 *
 * @param {number} channelId - The ID of the channel to guess the letter in,
 * or -1 if the letter is to be guessed in a DM
 * @param {number} dmId - The ID of the DM to guess the letter in,
 * or -1 if the letter is to be guessed in a channel
 * @param {string} guess - The letter to be guessed
 * ...
 *
 * @returns {void} - returns nothing
 */
export function hangmanGuessV1(channelId: number, dmId: number, guess: string): void {
  const data = getData();
  let gameId: number;

  // Error checking
  if (!hangmanActiveV1(channelId, dmId)) {
    botSendV1(channelId, dmId, GAME_NOT_ACTIVE);
    return;
  }

  // get game location
  if (channelId !== -1) {
    const channel = data.channels.find(channel => channel.channelId === channelId);
    gameId = channel.hangmanGameId;
  } else if (dmId !== -1) {
    const dm = data.dms.find(dm => dm.dmId === dmId);
    gameId = dm.hangmanGameId;
  }

  const game = data.games[gameId];
  guess = guess.toLowerCase();

  // if guess has already been guessed
  if (guessesHas(gameId, guess)) {
    botSendV1(channelId, dmId, guess + GUESS_ALREADY_GUESSED);
    return;
  }

  // else add guess to list
  guessesAdd(gameId, guess);
  let hangmanMessage;

  // if guess is correct
  if (game.word.includes(guess)) {
    // if there are still no incorrect guesses, do not print the hangman
    if (game.guessesLeft === MAX_INCORRECT_GUESSES) {
      hangmanMessage = HANGMAN_LOGO + '\n' + 'Word:  ' +
      replaceMaskedLetter(gameId, guess) + '\n\n' + getGuesses(gameId);

    // else, print the hangman as well
    } else {
      hangmanMessage = HANGMAN_LOGO + '\n' + GUESSES_LEFT[game.guessesLeft] + '\n\n\n' +
      'Word:  ' + replaceMaskedLetter(gameId, guess) + '\n\n' + getGuesses(gameId);
    }

    updateLettersLeft(gameId, guess);

    // if there are no more letters to guess, end the game
    if (game.lettersLeft === 0) {
      winGame(gameId, channelId, dmId, guess);
      return;
    }

  // if guess is incorrect
  } else {
    game.guessesLeft--;
    hangmanMessage = HANGMAN_LOGO + '\n' + GUESSES_LEFT[game.guessesLeft] + '\n\n\n' +
    'Word:  ' + game.maskedWord + '\n\n' + getGuesses(gameId);

    // if user runs out of guesses, end the game
    if (game.guessesLeft === 0) {
      loseGame(gameId, channelId, dmId);
      return;
    }
  }
  botSendV1(channelId, dmId, hangmanMessage);
  setData(data);
}

/**
 * Helper function which generates a random word and gets its definition
 * ...
 *
 * @returns {Word} - the randomly generated word and definition
 */
async function genWord(): Promise<Word> {
  const words = fs.readFileSync('/usr/share/dict/american-english', 'utf-8').split('\n');
  const filteredWords = words.filter(word => word.length >= 7 && word.length <= 8 && !word.includes("'"));
  let word;
  let definition = null;

  while (!definition) {
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    word = filteredWords[randomIndex].toLowerCase();

    // Call the dictionary API to get the definition of the word
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const json = await response.json();

    if (json.length > 0 && json[0].meanings && json[0].meanings.length > 0 &&
        json[0].meanings[0].definitions && json[0].meanings[0].definitions.length > 0) {
      definition = json[0].meanings[0].definitions[0].definition.toLowerCase();
    }
  }

  return {
    word,
    definition,
  };
}

/**
 * Helper function which generates a string of the 'masked' word
 *
 * @param {string} word - The word which will be masked
 *
 * @returns {string} - The masked word string
 */
function getMaskedWord (word: string) {
  return '_ '.repeat(word.length);
}

/**
 * Helper function which replaces a masked letter if the letter was guessed
 * correctly
 *
 * @param {number} gameId - The ID of the game to replace the letter in
 * @param {string} letter - The letter which will be unmasked
 * ...
 *
 * @returns {string} - the new masked string
 */
function replaceMaskedLetter(gameId: number, letter: string): string {
  const data = getData();
  const game = data.games[gameId];

  for (let i = 0; i < game.word.length; i++) {
    if (game.word[i] === letter) {
      const newMaskedWord = game.maskedWord.substring(0, 2 * i) + letter +
        game.maskedWord.substring(2 * i + 1);
      game.maskedWord = newMaskedWord;
    }
  }
  setData(data);
  return game.maskedWord;
}

/**
 * Helper function which returns all the guesses of a current game
 *
 * @param {number} gameId - The ID of the game to get the guesses from
 *
 * @returns {string} - a string of all the guesses
 */
function getGuesses(gameId: number): string {
  const data = getData();
  const game = data.games[gameId];
  const guesses = 'Guesses:  ' + Array.from(game.guesses).join(' ');

  return guesses;
}

/**
 * Helper function which adds a guess to the list of guesses
 *
 * @param {number} gameId - The ID of the game to add the guess in
 * @param {string} guess - The guessed letter
 * ...
 *
 * @returns {void} - returns nothing
 */
function guessesAdd(gameId: number, guess: string): void {
  const data = getData();
  const game = data.games[gameId];
  if (!game.guesses.includes(guess)) {
    game.guesses.push(guess);
  }
  setData(data);
}

/**
 * Helper function which checks whether a letter has already been guessed
 *
 * @param {number} gameId - The ID of the game whose guesses will be checked
 * @param {string} guess - The guessed letter
 * ...
 *
 * @returns {boolean} - returns true if the letter has already been guessed,
 * false otherwise
 */
function guessesHas(gameId: number, guess: string): boolean {
  const data = getData();
  const game = data.games[gameId];
  return game.guesses.includes(guess);
}

/**
 * Helper function which updates the given game's 'lettersLeft' value
 *
 * @param {number} gameId - The ID of the game whose 'lettersLeft' value will
 * be updated in
 * @param {string} letter - The letter in the word which will be counted so that
 * 'lettersLeft' can be decremented appropriately
 * ...
 *
 * @returns {void} - returns nothing
 */
function updateLettersLeft(gameId: number, letter: string): void {
  const data = getData();
  const game = data.games[gameId];
  const word = game.word;
  let count = 0;

  // decrement lettersLeft depending on how many times the letter occurs
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      count++;
    }
  }
  game.lettersLeft -= count;
  setData(data);
}

/**
 * Helper function which ends a game on a 'win' outcome
 *
 * @param {number} gameId - The ID of the game which will be ended
 * @param {number} channelId - The ID of the channel that the game will be ended in,
 * or -1 if the game will be ended in a DM
 * @param {number} dmId - The ID of the DM that the game will be ended in,
 * or -1 if the game will be ended in a channel
 * @param {string} guess - The correctly guessed letter which will end the game
 * ...
 *
 * @returns {void} - returns nothing
 */
function winGame(gameId: number, channelId: number, dmId: number, guess: string): void {
  const data = getData();
  const game = data.games[gameId];
  let hangmanMessage;
  game.outcome = WIN;
  if (game.guessesLeft === MAX_INCORRECT_GUESSES) {
    hangmanMessage = HANGMAN_LOGO + '\n' + 'Word:  ' +
        replaceMaskedLetter(gameId, guess) + '\n\n' + getGuesses(gameId) +
        '\n\n\n' + GAME_WIN + `↳ ❝ [ ${game.word}: ${game.definition} ] ¡! ❞`;
  } else {
    hangmanMessage = HANGMAN_LOGO + '\n' + GUESSES_LEFT[game.guessesLeft] +
        '\n\n' + 'Word:  ' + replaceMaskedLetter(gameId, guess) + '\n\n' + getGuesses(gameId) +
        '\n\n\n' + GAME_WIN + `↳ ❝ [ ${game.word}: ${game.definition} ] ¡! ❞`;
  }
  setData(data);
  botSendV1(channelId, dmId, hangmanMessage);
  hangmanEndV1(channelId, dmId);
}

/**
 * Helper function which ends a game on a 'lose' outcome
 *
 * @param {number} gameId - The ID of the game which will be ended
 * @param {number} channelId - The ID of the channel that the game will be ended in,
 * or -1 if the game will be ended in a DM
 * @param {number} dmId - The ID of the DM that the game will be ended in,
 * or -1 if the game will be ended in a channel
 * ...
 *
 * @returns {void} - returns nothing
 */
function loseGame(gameId: number, channelId: number, dmId: number): void {
  const data = getData();
  const game = data.games[gameId];
  game.outcome = LOSE;
  const hangmanMessage = HANGMAN_LOGO + '\n' + GUESSES_LEFT[game.guessesLeft] + '\n\n' +
  'Word:  ' + game.maskedWord + '\n\n' + getGuesses(gameId) + '\n\n\n' + GAME_OVER +
  `↳ ❝ [ ${game.word}: ${game.definition} ] ¡! ❞`;
  setData(data);
  botSendV1(channelId, dmId, hangmanMessage);
  hangmanEndV1(channelId, dmId);
}
