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

  const takeTurn = () => {
    getResponse(bot, two, (response, convo) => {
      //update board state
      matchEnd = evaluate(board);
      turn = !turn;
      convo.next();
      takeTurn();
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