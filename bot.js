const express = require("express");
const app = express();

const TelegramBot = require("node-telegram-bot-api");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

const botToken = process.env.botToken;
const openAiToken = process.env.openAiToken;
const port = process.env.PORT || 3000; // Use the port provided by Heroku or use 3000 as a default

const config = new Configuration({
  apiKey: openAiToken,
});

const openai = new OpenAIApi(config);

const bot = new TelegramBot(botToken, { polling: true });

let conversationStarted = false; // flag to keep track of whether the conversation has started or not
let userRepliesCount = new Map(); // map to keep track of user's reply count

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Telegram ChatBot");
  conversationStarted = true; // set the flag to true when the user sends the "/start" command
});

bot.onText(/\/generate/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Please enter a prompt to generate a DALL-E image:"
  );
});

bot.onText(/\/chat/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please enter your message:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!conversationStarted) {
    bot.sendMessage(
      chatId,
      "Please start the conversation by sending the /start command"
    );
    return;
  }

  // Check if user's reply limit is reached
  const user = msg.from.id;
  if (!userRepliesCount.has(user)) {
    userRepliesCount.set(user, 1);
  } else {
    if (userRepliesCount.get(user) >= 5) {
      bot.sendMessage(
        chatId,
        "Sorry, you have exceeded your daily reply limit."
      );
      return;
    }
    userRepliesCount.set(user, userRepliesCount.get(user) + 1);
  }

  if (msg.text === "/help") {
    bot.sendMessage(chatId, "This is a help message.");
    return;
  }

  if (msg.text === "/menu") {
    const message =
      "🃏 Please choose an action:\n\n" +
      "💁🏻 /help - Get help\n" +
      "🥪 /menu - Show menu\n" +
      "🌐 /website - Get website URL\n" +
      "🖼 /generate - Generate a DALL-E image\n" +
      "💬 /chat - Start a regular chat\n";

    const options = {
      reply_markup: {
        keyboard: [
          [{ text: "/help" }, { text: "/menu" }],
          [{ text: "/website" }, { text: "/generate" }],
          [{ text: "/chat" }],
        ],
        resize_keyboard: true,
      },
    };

    bot.sendMessage(chatId, message, options);
    return;
  }

  if (msg.text === "/website") {
    bot.sendMessage(chatId, "https://www.google.com");
    return;
  }

  if (msg.text === "/generate") {
    return; // We already prompted the user to enter a DALL-E prompt
  }

  if (msg.text === "/chat") {
    return; // We already prompted the user to enter a chat message
  }

  if (msg.photo) {
    bot.sendMessage(chatId, "Thanks for the photo!");
    return;
  }

  // If none of the message commands match, send a response using OpenAI
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: msg.text + " (please keep your answer within 100 words)",
    temperature: 0,
  });

  // Send typing action to indicate that the bot is typing
  bot.sendChatAction(chatId, "typing");

  // Delay the response by 2 seconds to simulate "typing" time
  setTimeout(() => {
    bot.sendMessage(chatId, reply.data.choices[0].text);
  }, 2000);
});

bot.onText(/\/generate/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please enter a text to generate an image");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === "/generate") {
    bot.sendMessage(chatId, "Please enter a text to generate an image");
    return;
  }

  if (msg.photo) {
    bot.sendMessage(chatId, "Thanks for the photo!");
    return;
  }

  if (
    msg.reply_to_message &&
    msg.reply_to_message.text === "Please enter a text to generate an image"
  ) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          model: "image-alpha-001",
          prompt: msg.text,
          api_key: openAiToken,
          num_images: 1,
          size: "256x256",
        }
      );

      const { data } = response;
      const { data: imageData } = data;

      bot.sendChatAction(chatId, "upload_photo");

      setTimeout(() => {
        bot.sendPhoto(chatId, imageData[0].url);
      }, 2000);
    } catch (error) {
      bot.sendMessage(chatId, "An error occurred while generating the image");
      console.log(error);
    }
    return;
  }

  // If none of the message commands match, send a response using OpenAI
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: msg.text + " (please keep your answer within 100 words)",
    temperature: 0,
  });

  // Send typing action to indicate that the bot is typing
  bot.sendChatAction(chatId, "typing");

  // Delay the response by 2 seconds to simulate "typing" time
  setTimeout(() => {
    bot.sendMessage(chatId, reply.data.choices[0].text);
  }, 2000);
});

app.get("/", (req, res) => {
  res.send("Telegram ChatBot is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Telegram ChatBot is listening");
});
