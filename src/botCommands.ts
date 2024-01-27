// ------------------------------------------- HELP --------------------------------------------------
const HELP_CMD = '     - /help: Display all the commands\n';

const HELLO_CMD = '     - /hello: Greet a user\n';
const INVITE_CMD = '     - /invite @<handleStr>\n';
const HANGMAN_START_CMD = '     - /hangman start: Starts a game of hangman\n';
const HANGMAN_GUESS_CMD = '     - /guess <letter>: Guesses a letter in the current game of hangman\n';
const HANGMAN_END_CMD = '     - /hangman end: Ends the current game of hangman\n';

const FOR_CHANNEL_OWNER = '🎲 Channel owner commands: \n\n';
const CHANNEL_OWNER_ADD = '     - /owneradd @<handleStr>: Add a user as a channel owner\n';
const CHANNEL_OWNER_REMOVE = '     - /ownerremove @<handleStr>: Remove a user as a channel owner\n';

const FOR_ADMIN = '👑 Admin commands: \n\n';
const ADMIN_CHANGE_PERMS = '     - /perms @<handleStr> <1|2>: Change a user\'s permissions\n';

export const HELP = HELP_CMD + HELLO_CMD +
  HANGMAN_START_CMD + HANGMAN_END_CMD + HANGMAN_GUESS_CMD + INVITE_CMD + '\n';

export const CHANNEL_OWNER_CMDS = FOR_CHANNEL_OWNER + CHANNEL_OWNER_ADD +
  CHANNEL_OWNER_REMOVE + '\n';
export const CHANNEL_OWNER_HELP = HELP + '\n' + CHANNEL_OWNER_CMDS;

export const ADMIN_CMDS = FOR_ADMIN + ADMIN_CHANGE_PERMS;
export const ADMIN_CHANNEL_HELP = CHANNEL_OWNER_HELP + '\n' + FOR_ADMIN + ADMIN_CHANGE_PERMS;

export const ADMIN_DM_HELP = HELP + '\n' + FOR_ADMIN + ADMIN_CHANGE_PERMS;

// ------------------------------------------- HANGMAN ------------------------------------------------
export const DIVIDER = '─── ･ ｡ﾟ☆: *.☽ .* :☆ﾟ. ───';

export const GAME_ALREADY_ACTIVE = 'A game of hangman is already active!\n\n' +
'Please finish the current game or end the game with /hangman end before starting a new game!';
export const GAME_NOT_ACTIVE = 'There is currently no active game of hangman!';

const START_MSG = 'Starting a game of hangman!\n\n';
const GUESS_MSG = 'You can type /guess <letter> to make a guess!\n\n';
export const HANGMAN_START = START_MSG + GUESS_MSG;

export const HANGMAN_END = 'The game of hangman has ended!';

export const HANGMAN_USAGE = 'Did you mean:\n\n' + HANGMAN_START_CMD + HANGMAN_GUESS_CMD +
  HANGMAN_END_CMD;

export const HANGMAN_LOGO = '-ˏˋ 📃 HANGMAN ✏️ ˊˎ-\n\n';

// ASCII ART
const GUESSES_LEFT_6 = '          + - - - +\n           |        |\n                    |\n' +
  '                    |\n                    |\n                    |\n       =========';
const GUESSES_LEFT_5 = '          + - - - +\n           |        |\n          O       |\n' +
  '                    |\n                    |\n                    |\n       =========';
const GUESSES_LEFT_4 = '          + - - - +\n           |        |\n          O       |\n' +
  '           |        |\n                    |\n                    |\n       =========';
const GUESSES_LEFT_3 = '          + - - - +\n           |        |\n          O       |\n' +
  '          /|        |\n                    |\n                    |\n       =========';
const GUESSES_LEFT_2 = '          + - - - +\n           |        |\n          O       |\n' +
  '          /|\\       |\n                    |\n                    |\n       =========';
const GUESSES_LEFT_1 = '          + - - - +\n           |        |\n          O       |\n' +
  '          /|\\       |\n          /         |\n                    |\n       =========';
const GUESSES_LEFT_0 = '          + - - - +\n           |        |\n          O       |\n' +
  '          /|\\       |\n          / \\       |\n                    |\n       =========';

export const GUESSES_LEFT = [GUESSES_LEFT_0, GUESSES_LEFT_1, GUESSES_LEFT_2,
  GUESSES_LEFT_3, GUESSES_LEFT_4, GUESSES_LEFT_5, GUESSES_LEFT_6];

export const GUESS_ALREADY_GUESSED = ' has already been guessed!';

export const NO_MORE_GUESSES = 'You ran out of guesses 😢\n\n';
export const GAME_OVER = DIVIDER + '\n\n\n' + '❗GAME OVER ❗\n\n' + NO_MORE_GUESSES;
export const GAME_WIN = DIVIDER + '\n\n\n' + 'Nice job! 🥳\n\n';
