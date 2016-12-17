if(!process.env.token) {
  console.log('Error: specify bot token in env');
  process.exit(1);
}

const Botkit = require('botkit');
const controller = Botkit.slackbot({
  debug: false
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.token,
}).startRTM();

const makeBoard = () => {
  const res = [];
  for(var i = 0; i < 7; i++) {
    const row = [];
    for(var j = 0; j < 7; j++) {
      row.push('E');
    }
    res.push(row);
  }
  return res;
}

const render = (board) => {
  let res = '';
  for(let i = 0; i < board.length; i++) {
    for(let j = 0; j < board.length; j++) {
      if(board[i][j] === 'E') {
        res = res + ':white_medium_square:';
      }
      if(board[i][j] === 'R'){
        res = res + ':red_circle:';
      }
      if(board[i][j] === 'B'){
        res = res + ':black_circle:';
      }
    }
    res = res + '\n';
  }
  return res;
};

//Asks player for a move. If the message object is passed
//to it, that means the it's from player one
const getResponse = (board, bot, id, cb, message) => {
  const theBoard = render(board);
  if(message) {
    bot.startConversation(message, (err, convo) => {
      convo.ask(theBoard + '\nMake your move! [1-7]', cb);
    });
  } else {
    bot.startPrivateConversation({ user: id }, (err, convo) => {
      convo.ask(theBoard + '\nMake your move! [1-7]', cb);
    });
  }
};

//Updates the board with user input
//Returns 1 on success
//Returns 0 if the column is full
const update = (board, num, turn) => {
  for(let i = board.length-1; i >= 0; i--) {
    if(board[i][num] === 'E') {
      board[i][num] = turn ? 'R' : 'B';
      return 1;
    }
  };
  return 0;
};


//Checks the board to see if there is a connect 4 or a tie
//Returns -1 if game is not over
//Returns 0 if game is a tie (NOOP)
//Returns 1 if player one wins
//Returns 2 if player two wins
const evaluate = (board) => {
  console.log(board);
  //check rows
  console.log('Checking rows');
  for(let i = 0; i < board.length; i++) {
    const row = board[i].join('');
    if(row.indexOf('RRRR') !== -1) {
      return 1;
    }
    if(row.indexOf('BBBB') !== -1) {
      return 2;
    }
  }
  //check columns
  console.log('Checking columns');
  for(let i = 0; i < board.length; i++) {
    const arr = [];
    for(let j = 0; j < board.length; j++) {
      arr.push(board[j][i]);
    }
    const col = arr.join('');
    if(col.indexOf('RRRR') !== -1) {
      return 1;
    }
    if(col.indexOf('BBBB') !== -1) {
      return 2;
    }
  }

  //check diagonals
  console.log('Checking diagonals');
  const leftward = {};
  const rightward = {};
  for(let i = 0; i < board.length; i++) {
    for(let j = 0; j < board.length; j ++) {
      leftward[i-j] = leftward[i-j] ? leftward[i-j] + board[i][j] : board[i][j];
      rightward[i+j] = rightward[i+j] ? rightward[i+j] + board[i][j]:  board[i][j];
    }
  }

  const leftKeys = Object.keys(leftward);
  const rightKeys = Object.keys(rightward);
  for(let i = 0; i < leftKeys.length; i++) {
    if(leftward[leftKeys[i]].indexOf('RRRR') !== -1) {
      return 1;
    }
    if(leftward[leftKeys[i]].indexOf('BBBB') !== -1) {
      return 2;
    }
    if(rightward[rightKeys[i]].indexOf('RRRR') !== -1) {
      return 1;
    }
    if(rightward[rightKeys[i]].indexOf('BBBB') !== -1) {
      return 2;
    }
  }

  return -1;
};

const startGame = (bot, message, one, two) => {
  let board = makeBoard();
  let matchEnd = -1;
  let turn = true;

  console.log('Starting game!');
  //Game loop
  const takeTurn = () => {
    getResponse(board, bot, two, (response, convo) => {
      //update board state
      const res = response.text;
      if(isNaN(res)){
        convo.repeat();
        convo.next();
      } else if (+res > 7 || +res < 1){
        convo.repeat();
        convo.next();
      } else {
        const didUpdate = update(board, +res - 1, turn);
        if(!didUpdate) {
          convo.repeat();
          convo.next();
        } else {
          convo.say(render(board));
          convo.say('Thanks!');
          matchEnd = evaluate(board);
          if(matchEnd !== -1) {
            convo.say('GG');
            convo.next();
          } else {
            turn = !turn;
            convo.next();
            takeTurn();
          }
        }
      }
    }, turn ? message : null);      
  }
  takeTurn();
};


controller.hears('play',['direct_message'], (bot, message) => {
  const data = message.text.match(/<@([A-Z0-9]{9})>/);
  if(data) {
    const one = message.user;
    const two = data[1];
    startGame(bot, message, one, two);
  } else {
    bot.reply(message, 'Couldn\'t find that user');
  }
});
