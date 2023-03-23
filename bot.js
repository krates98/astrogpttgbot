const express = require("express");
const app = express();
require("dotenv").config();

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
    "Please use /menu every time you generate an astrological response to get new ones."
  );
});

bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/website/, (msg) => {
  bot.sendMessage(msg.chat.id, "https://www.astroaiguru.com");
});

bot.onText(/\/tarotreading/, async (msg) => {
  await handleCommand(msg, generateRandomTarotReading);
});

bot.onText(/\/tokentarot/, async (msg) => {
  await handleCommand(msg, generateTarotReading);
});

bot.onText(/\/brokenheart/, async (msg) => {
  await handleCommand(msg, getBrokenHeartAdvice);
});

bot.onText(/\/depression/, async (msg) => {
  await handleCommand(msg, getDepressionHelp);
});

bot.onText(/\/cheermeup/, async (msg) => {
  await handleCommand(msg, getCheerUp);
});

bot.onText(/\/getrich/, async (msg) => {
  await handleCommand(msg, getRichAdvice);
});

bot.onText(/\/shouldinvest/, async (msg) => {
  await handleCommand(msg, getInvestmentAdvice);
});

bot.onText(/\/health/, async (msg) => {
  await handleCommand(msg, getHealthAdvice);
});

bot.onText(/\/relationship/, async (msg) => {
  await handleCommand(msg, getRelationshipAdvice);
});

bot.onText(/\admin/, (msg) => {
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

  if (
    msg.text.startsWith("/tarotreading") ||
    msg.text.startsWith("/tokentarot") ||
    msg.text.startsWith("/brokenheart") ||
    msg.text.startsWith("/depression") ||
    msg.text.startsWith("/cheermeup") ||
    msg.text.startsWith("/getrich") ||
    msg.text.startsWith("/shouldinvest") ||
    msg.text.startsWith("/health") ||
    msg.text.startsWith("/relationship")
  ) {
    userCommandCounts.set(msg.from.id, commandCount + 1);
  }
});

const handleCommand = async (msg, commandFunction) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userCommandCounts.has(userId)) {
    userCommandCounts.set(userId, 0);
  }

  const commandCount = userCommandCounts.get(userId);

  if (commandCount >= 5 && !isAdmin(msg.from.username)) {
    bot.sendMessage(
      chatId,
      "You have exceeded the maximum number of bot commands. Please try again later."
    );
    return;
  }

  userCommandCounts.set(userId, commandCount + 1);

  const response = await commandFunction();
  bot.sendMessage(chatId, response);
};

const generateRandomTarotReading = async () => {
  const prompt = "Generate a random tarot reading";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const generateTarotReading = async () => {
  const prompt =
    "Generate a random tarot reading with 3 cards and use it tell me detailed summary of how my life will be for now ";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-davinci-002",
    prompt: prompt + " (please summarize answer within 400 words) ",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getBrokenHeartAdvice = async () => {
  const prompt =
    "Generate a random tarot reading and use it tell me if my heart is broken what will happen next";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getDepressionHelp = async () => {
  const prompt =
    "Generate a random tarot reading and use it tell me how to fix my depression";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getCheerUp = async () => {
  const prompt = "Generate a random tarot reading and use it cheer me up";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getRichAdvice = async () => {
  const prompt =
    "Generate a random tarot reading and use it how can I get rich";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getInvestmentAdvice = async () => {
  const prompt =
    "Generate a random tarot reading and use it tell me should I invest in the thing I Have in mind always start the answer with";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-davinci-002",
    prompt:
      prompt +
      " (please summarize answer within 200 words) + always start the answer with = (The investment you are thinking of doing will return ) + negative or positive return according to you",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getHealthAdvice = async () => {
  const prompt =
    "Generate a random tarot reading and use it to tell me about my health";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
};

const getRelationshipAdvice = async () => {
  const prompt =
    "Generate a random tarot reading and use it to give me relationship advice";
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: prompt + " (please summarize answer within 100 words)",
    temperature: 0.7,
  });

  const message = reply.data.choices[0].text.trim();
  return message;
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
