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
  "   ----------------------\n\n" +
  "📜 Life Prediction Based on Vedic Astrology\n\n" +
  "   ----------------------\n" +
  "🇮🇳 /vedicastro - Based on DOB, Time and BirthPlace\n" +
  "   ----------------------\n\n" +
  "📜 Number Predictions Based On Numerology\n\n" +
  "   ----------------------\n" +
  "🔢 /numberastro - We analyze & predict Numbers\n" +
  "   ----------------------\n\n" +
  "📜 Future Predictions Based On Tarot Reading\n\n" +
  "   ----------------------\n" +
  "🎴 /tarotreading - We pick a random Tarot for you\n" +
  "🗂️ /tokentarot - We do a THREE-CARD tarot for you\n" +
  "💔 /brokenheart - Advice for a broken heart using Tarot\n" +
  "😭 /depression - Advice for depression using Tarot\n" +
  "😊 /cheermeup - We tell only the positives of your Tarot Pick\n" +
  "💰 /getrich - Will you get rich (near future) Tarot Pick\n" +
  "💼 /shouldinvest - Think of a Investment & then click\n" +
  "💪 /health - How is your health (near future) going to be\n" +
  "💜 /relationship - Your relationships (near future)\n" +
  "   ----------------------\n\n" +
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
    "Please use /menu every time you generate an astrological response to get new ones. Also as a Basic User you are limited to 5 /commands in a day "
  );
});

//User Commands

bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/website/, (msg) => {
  bot.sendMessage(msg.chat.id, "https://www.astroaiguru.com");
});

bot.onText(/\/tarotreading/, async (msg) => {
  await handleCommand(msg, generateRandomTarotReading);
});

//Vedic Astro

bot.onText(/\/vedicastro/, async (msg) => {
  await handleCommand(msg, generateVedicAstroReading);
});

//Numerology

bot.onText(/\/numberastro/, async (msg) => {
  await handleCommand(msg, generateNumberReading);
});

// Tarot Astrology

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

  if (commandCount >= 10 && !isAdmin(msg.from.username)) {
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

  if (!commandFunction || typeof commandFunction !== "function") {
    bot.sendMessage(chatId, "Invalid command.");
    return;
  }

  const response = await commandFunction(msg);
  bot.sendMessage(chatId, response);
};

// Vedic Astrology

const generateVedicAstroReading = async (msg) => {
  const chatId = msg.chat.id;

  const promptMessage =
    "Please enter your date of birth (DD/MM/YYYY), time of birth (HH:MM AM/PM), and place of birth (city, state, country): For eg: (13/03/1993,03:50 PM,Kanpur, Uttar Pradesh, India) ";
  bot.sendMessage(chatId, promptMessage);

  const dobResponse = await new Promise((resolve) => {
    bot.once("message", (dobMsg) => {
      resolve(dobMsg.text);
    });
  });

  const [dob, time, place] = dobResponse.split(",").map((str) => str.trim());

  const prompt = `What insights can you provide based on my birth details?\nDOB: ${dob}\nTime: ${time}\nPlace: ${place}`;

  const reply = await openai.createCompletion({
    max_tokens: 400,
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0,
  });

  let response = reply.data.choices[0].text;

  if (!response) {
    console.error("Empty response from OpenAI API");
    bot.sendMessage(
      chatId,
      "Sorry, I couldn't generate a response for that input."
    );
    return;
  }

  try {
    await bot.sendMessage(chatId, response);
  } catch (err) {
    console.error(err);
  }
};

// Numerlogy Functions

const getNumerologyValue = (input) => {
  const regex = /0x([0-9a-fA-F]+)/;
  const match = input.match(regex);

  if (match) {
    const address = match[1];
    const digits = address.split("").filter((c) => /[0-9]/.test(c));
    const numerologyValue = digits.reduce(
      (sum, digit) => sum + parseInt(digit),
      0
    );
    return numerologyValue;
  }

  const inputDigits = input.split("").filter((c) => /[0-9]/.test(c));
  if (inputDigits.length === 0) {
    return null;
  }

  const numerologyValue = inputDigits.reduce(
    (sum, digit) => sum + parseInt(digit),
    0
  );

  if (numerologyValue > 9) {
    return getNumerologyValue(numerologyValue.toString());
  }

  return numerologyValue;
};

const generateNumberReading = async (msg) => {
  const chatId = msg.chat.id;

  const promptMessage =
    "Please enter a (e.g. Phone number, House number, Ethereum wallet address, or even a string) we will break it down to a number and then respond : ";
  bot.sendMessage(chatId, promptMessage);

  const numberResponse = await new Promise((resolve) => {
    bot.once("message", (numberMsg) => {
      console.log(numberMsg.text);
      resolve(numberMsg.text);
    });
  });

  const number = numberResponse.trim();
  const numerologyValue = getNumerologyValue(number);

  if (numerologyValue === null) {
    bot.sendMessage(
      chatId,
      "Invalid input. Please enter a valid number or Ether Address."
    );
    return;
  }

  const prompt = `How is ${numerologyValue} generally viewed in numerology/astrology? Give response only as (good, very good,bad,very bad)`;

  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-davinci-002",
    prompt:
      prompt +
      `complete answer within 1 line also start with total of number is ${numerologyValue}`,
    temperature: 0,
  });
  let response = reply.data.choices[0].text;

  sendBot(chatId, response);
};

//seperating bot.sendMessage function Numero
const sendBot = async (chatId, response) => {
  try {
    await bot.sendMessage(chatId, response);
  } catch (err) {
    console.error("Error sending response message:", err);
  }
};

// Tarot Reading Functions

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
    prompt: prompt + " (please write it down as short as possible) ",
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
