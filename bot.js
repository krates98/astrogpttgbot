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

const placeholderImage =
  "https://via.placeholder.com/512x512.png?text=Generating+image%2C+please+wait...";

let conversationStarted = false; // flag to keep track of whether the conversation has started or not
let userRepliesCount = new Map(); // map to keep track of user's reply count

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Telegram ChatBot");
  conversationStarted = true; // set the flag to true when the user sends the "/start" command
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

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

  if (!conversationStarted) {
    bot.sendMessage(chatId, message);
    return;
  }

  if (msg.text === "/help") {
    bot.sendMessage(chatId, "This is a help message.");
    return;
  }

  if (msg.text === "/menu") {
    bot.sendMessage(chatId, message, options);
    return;
  }

  if (msg.text === "/website") {
    bot.sendMessage(chatId, "https://www.telegramgpt.com");
    return;
  }

  let isGeneratingImage = false;

  if (msg.text === "/generate") {
    bot.sendMessage(chatId, "Please enter some text to generate an image:");
    isGeneratingImage = true;

    bot.on("message", async (msg) => {
      if (isGeneratingImage && msg.text) {
        const text = msg.text;

        bot.sendPhoto(chatId, placeholderImage).then(async (sentMessage) => {
          try {
            const response = await openai.createImage({
              prompt: "a white siamese cat",
              n: 1,
              size: "1024x1024",
            });

            await delay(5000); // add a delay of 5 seconds before sending the actual image
            await bot.deleteMessage(chatId, sentMessage.message_id);
            await bot.sendPhoto(chatId, response.data.data[0].url);
          } catch (error) {
            bot.sendMessage(
              chatId,
              "An error occurred while generating the image"
            );
            console.log(error);
          }
        });

        function delay(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        isGeneratingImage = false;
      }
    });

    return;
  }

  if (msg.text === "/chat") {
    bot.sendMessage(chatId, "Please enter a message:");

    bot.on("message", async (msg) => {
      if (
        msg.text != /\/help/ ||
        msg.text != /\/generate/ ||
        msg.text != /\/menu/ ||
        msg.text != /\/start/ ||
        msg.text != /\/website/ ||
        msg.text != /\/chat/
      ) {
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

  // bot.sendMessage(
  //   chatId,
  //   "Please choose from the menu options dont randomly rable! " + message
  // );
});

app.get("/", (req, res) => {
  res.send("Telegram ChatBot is running");
});

app.listen(port, () => {
  console.log("Telegram ChatBot is listening");
});
