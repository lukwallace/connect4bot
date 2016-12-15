if(!process.env.token) {
  console.log('Error: specify bot token in env');
  process.exit(1);
}

const Botkit = require('botkit');
const controller = Botkit.slackbot({
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: process.env.token,
}).startRTM()


const startGame = (bot, message, one, two) => {
  console.log(one, two);
  bot.reply(message, 'Starting match!');
  bot.startPrivateConversation({ user: two }, (err, convo) => {
    convo.say('Starting match!');
  });
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