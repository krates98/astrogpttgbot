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

let conversationStarted = false; // flag to keep track of whether the conversation has started or not
let userRepliesCount = new Map(); // map to keep track of user's reply count

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Telegram ChatBot");
  conversationStarted = true; // set the flag to true when the user sends the "/start" command
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
      "🎨 /generate - Generate image using text\n" +
      "💬 /chat - Start a chat with the bot";

    const options = {
      reply_markup: {
        keyboard: [
          [{ text: "/help" }, { text: "/menu" }],
          [{ text: "/website" }, { text: "/generate" }, { text: "/chat" }],
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

  let isGeneratingImage = false;

  if (msg.text === "/generate") {
    bot.sendMessage(chatId, "Please enter some text to generate an image:");
    isGeneratingImage = true;

    bot.on("message", async (msg) => {
      if (isGeneratingImage && msg.text) {
        const text = msg.text;

        bot.sendMessage(chatId, "Generating image, please wait...");

        try {
          const result = await openai.images.create({
            model: "image-alpha-001",
            prompt: `generate image using text "${text}"`,
            size: "512x512",
          });

          bot.sendPhoto(chatId, result.data.url);
        } catch (error) {
          bot.sendMessage(
            chatId,
            "An error occurred while generating the image"
          );
          console.log(error);
        }

        isGeneratingImage = false;
      }
    });

    return;
  }

  if (msg.text === "/chat") {
    bot.sendMessage(chatId, "Please enter a message:");
    bot.on("message", async (msg) => {
      if (msg.text) {
        const reply = await openai.createCompletion({
          max_tokens: 100,
          model: "text-curie-001",
          prompt: msg.text + " (please keep your answer within 100 words)",
          temperature: 0,
        });

        bot.sendMessage(chatId, reply.data.choices[0].text);
      }
    });
    return;
  }

  let isGeneratingImage = false;

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (isGeneratingImage && msg.text) {
      const text = msg.text;

      bot.sendMessage(chatId, "Generating image, please wait...");

      try {
        const result = await openai.images.create({
          model: "image-alpha-001",
          prompt: `generate image using text "${text}"`,
          size: "512x512",
        });

        bot.sendPhoto(chatId, result.data.url);
      } catch (error) {
        bot.sendMessage(chatId, "An error occurred while generating the image");
        console.log(error);
      }

      isGeneratingImage = false;
    }
  });

  if (msg.text === "/generate") {
    bot.onText(/\/generate/, (msg) => {
      const chatId = msg.chat.id;

      bot.sendMessage(chatId, "Please enter some text to generate an image:");
      isGeneratingImage = true;
    });

    return;
  }

  bot.sendMessage(
    chatId,
    "Invalid command. Please choose a command from the menu."
  );
});

app.get("/", (req, res) => {
  res.send("Telegram ChatBot is running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Telegram ChatBot is listening");
});
