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
      row.push(0);
    }
    res.push(row);
  }
  return res;
}

//Asks player for a move. If the message object is passed
//to it, that means the it's from player one
const getResponse = (bot, id, cb, message) => {
  if(message) {
    bot.startConversation(message, (err, convo) => {
      convo.ask('Make your move! [1-7]', (response, convo) => {
        cb(response, convo);
      });
    });
  } else {
    bot.startPrivateConversation({ user: id }, (err, convo) => {
      convo.ask('Make your move! [1-7]', (response, convo) => {
        cb(response, convo);
      });
    });
  }
};

//Updates the board
//Returns 1 on success
//Returns 0 if the column is full
const update = (board, num, turn) => {
  for(let i = 0; i < board.length; i++) {
    if(board[i][num] === 0) {
      board[i][num] = turn ? 1 : -1;
      return 1;
    }
  };
  return 0;
};

//Checks the board to see if there is a connect 4 or a tie
//Returns -1 if game is not over
//Returns 0 if game is a tie
//Returns 1 if player one wins
//Returns 2 if player two wins
const evaluate = (board) => {
  return -1;
};

const startGame = (bot, message, one, two) => {
  let board = makeBoard();
  let matchEnd = -1;
  let turn = true;

  //Game loop
  const takeTurn = () => {
    getResponse(bot, two, (response, convo) => {
      //update board state
      const res = response.text;
      if(isNaN(res)){
        convo.repeat();
        convo.next();
      } else if (+res > 7 || +res < 1){
        console.log('Bad input!');
        convo.repeat();
        convo.next();
      } else {
        const didUpdate = update(board, +res - 1, turn);
        console.log(board, didUpdate);
        if(!didUpdate) {
          convo.repeat();
          convo.next();
        } else {
          matchEnd = evaluate(board);
          turn = !turn;
          convo.next();
          takeTurn();
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
