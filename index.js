require('dotenv').config();
const SlackBot = require('slackbots');
const chalk = require('chalk');
const figlet = require('figlet');
const config = require('./config.json');
const getUrls = require('get-urls');
const moment = require('moment');
const log = console.log;

// slack bot
const bot = new SlackBot({
  token: process.env.slack_token,
  name: config.slack.name
});

welcome();

function welcome() {
  console.log(chalk.yellow(figlet.textSync('snkrTwttr v2', { horizontalLayout: 'full' })));

  log(chalk.blue.bgBlack(`-------------------------`));
  log(chalk.blue.bgBlack(`MONITORING THESE ACCOUNTS`));
  log(chalk.blue.bgBlack(`-------------------------`));
  config.data.accountsToTrack.forEach(account => log(`@${account}`));

  if (config.slack.sendDM) {
    log(chalk.blue.bgBlack(`------------------------------`));
    log(chalk.blue.bgBlack(`NOTIFYING THESE SLACK ACCOUNTS`));
    log(chalk.blue.bgBlack(`------------------------------`));
    config.slack.users.forEach(user => log(`${user}`));
  }

  log(chalk.red.bgBlack(`-------------------`));
  log(chalk.red.bgBlack(`FOUND THESE TWEETS:`));
  log(chalk.red.bgBlack(`-------------------`));
}

const keywords = config.data.keywords.join(', ');

if (config.data.useKeywords) {
  log(chalk.red.bgBlack(`Monitoring tweets containing => ${keywords}`));
}

bot.on('start', function() {
  bot.postMessageToChannel(
    config.slack.channelName,
    `🤖 Monitoring => ${config.data.accountsToTrack.map(e => `@${e}`).join(', ')}!`,
    {
      icon_url: config.slack.icon
    }
  );
});

function newSlackMessage(data) {
  updateCount++;
  const { screen_name, tweetLink, text, id, media } = data;
  const now = moment().format('MMMM Do YYYY, h:mm:ss a');
  log(chalk.red.bgBlack.bold(`New update ${updateCount} (${id}) from @${screen_name} on ${now}`));

  const params = {
    icon_url: config.slack.icon,
    attachments: [
      {
        title: `New update from @${screen_name}`,
        title_link: tweetLink,
        author_name: `@${screen_name}`,
        author_link: `https://twitter.com/${screen_name}`,
        color: config.slack.color,
        image_url: media ? media : '',
        ts: Math.floor(Date.now() / 1000),
        fields: [
          {
            value: text,
            short: 'false'
          }
        ],
        footer: config.slack.name,
        footer_icon: config.slack.footer_icon
      }
    ]
  };

  // send to channel
  if (config.slack.sendToChannel) {
    bot.postMessageToChannel(config.slack.channelName, null, params);
  }

  // send DM
  if (config.slack.sendDM) {
    config.slack.users.forEach(user => bot.postMessageToUser(user, null, params));
  }
}
