const express = require("express");
const app = express();

const TelegramBot = require("node-telegram-bot-api");
const { Configuration, OpenAIApi } = require("openai");

const botToken = process.env.botToken;
const openAiToken = process.env.openAiToken;
const port = process.env.PORT || 3000; // Use the port provided by Heroku or use 3000 as a default

const config = new Configuration({
  apiKey: openAiToken,
});

const openai = new OpenAIApi(config);

const bot = new TelegramBot(botToken, { polling: true });

const menuMessage =
  "🃏 Please choose an action:\n\n" +
  "🎴 /tarotreading - Get a random tarot reading\n" +
  "📜 /tokentarot - Get a specific tarot reading\n" +
  "💔 /brokenheart - Get advice for a broken heart\n" +
  "😭 /depression - Get help with depression\n" +
  "😊 /cheermeup - Get cheered up\n" +
  "💰 /getrich - Get advice on how to get rich\n" +
  "💼 /shouldinvest - Get investment advice\n" +
  "💪 /health - Get health advice\n" +
  "💜 /relationship - Get advice on relationships\n" +
  "🌐 /website - Get website URL\n" +
  "🥪 /menu - Show menu\n" +
  "💁🏻 /help - Get help\n";

const adminUsernames = ["astrogpt", "krates98"]; // Replace with the usernames of your admin users

const userCommandCounts = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Please use /menu everytime you generate an astrological response to get new ones."
  );
});

bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/website/, (msg) => {
  bot.sendMessage(msg.chat.id, "https://www.astroaiguru.com");
});

bot.onText(/\/tarotreading/, async (msg) => {
  const reading = await generateRandomTarotReading();
  bot.sendMessage(msg.chat.id, reading);
});

bot.onText(/\/tokentarot (.+)/, async (msg, match) => {
  const cardName = match[1];
  const reading = await generateTarotReading(cardName);
  bot.sendMessage(msg.chat.id, reading);
});

bot.onText(/\/brokenheart/, async (msg) => {
  const advice = await getBrokenHeartAdvice();
  bot.sendMessage(msg.chat.id, advice);
});

bot.onText(/\/depression/, async (msg) => {
  const help = await getDepressionHelp();
  bot.sendMessage(msg.chat.id, help);
});

bot.onText(/\/cheermeup/, async (msg) => {
  const cheerup = await getCheerUp();
  bot.sendMessage(msg.chat.id, cheerup);
});

bot.onText(/\/getrich/, async (msg) => {
  const advice = await getRichAdvice();
  bot.sendMessage(msg.chat.id, advice);
});

bot.onText(/\/shouldinvest/, async (msg) => {
  const advice = await getInvestmentAdvice();
  bot.sendMessage(msg.chat.id, advice);
});

bot.onText(/\/health/, async (msg) => {
  const advice = await getHealthAdvice();
  bot.sendMessage(msg.chat.id, advice);
});

bot.onText(/\/relationship/, async (msg) => {
  const advice = await getRelationshipAdvice();
  bot.sendMessage(msg.chat.id, advice);
});

bot.onText(/\/admin/, (msg) => {
  if (!isAdmin(msg.from.username)) {
    bot.sendMessage(
      msg.chat.id,
      "You do not have permission to use admin commands."
    );
    return;
  }

  // Handle admin commands here
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!userCommandCounts.has(msg.from.id)) {
    userCommandCounts.set(msg.from.id, 0);
  }

  const commandCount = userCommandCounts.get(msg.from.id);
  if (commandCount >= 5 && !isAdmin(msg.from.username)) {
    bot.sendMessage(
      chatId,
      "You have exceeded the maximum number of bot commands. Please try again later."
    );
    return;
  }

  userCommandCounts.set(msg.from.id, commandCount + 1);
});

const generateRandomTarotReading = async () => {
  const prompt =
    "Generate a random tarot reading & tell me how will be my day according to it under 100 words";
  const completions = await openai.createCompletion({
    engine: "text-davinci-002",
    prompt,
    maxTokens: 500,
    n: 1,
    stop: "\n\n",
    temperature: 0.7,
  });
  const message = completions.choices[0].text.trim();
  return message;
};

const generateTarotReading = async (cardName) => {
  // Code to generate a specific tarot reading goes here
};

const getBrokenHeartAdvice = async () => {
  // Code to get advice for a broken heart goes here
};

const getDepressionHelp = async () => {
  // Code to get help with depression
};

const getCheerUp = async () => {
  // Code to get cheered up goes here
};

const getRichAdvice = async () => {
  // Code to get advice on how to get rich goes here
};

const getInvestmentAdvice = async () => {
  // Code to get investment advice goes here
};

const getHealthAdvice = async () => {
  // Code to get health advice goes here
};

const getRelationshipAdvice = async () => {
  // Code to get advice on relationships goes here
};

const isAdmin = (username) => {
  return adminUsernames.includes(username);
};

app.get("/", (req, res) => {
  res.send("Telegram ChatBot is running");
});

app.listen(port, () => {
  console.log("Telegram ChatBot is listening");
});
