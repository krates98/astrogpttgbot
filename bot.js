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
      "💬 /chat - Start a chat";

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
    bot.sendMessage(chatId, "Please enter some text to generate an image:");

    bot.on("message", async (msg) => {
      if (msg.text) {
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
      }
    });

    return;
  }

  if (msg.text === "/chat") {
    bot.sendMessage(
      chatId,
      "Please write something to get a response. Type /menu to go back to the main menu."
    );

    bot.on("message", async (msg) => {
      if (msg.text) {
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
      }
    });

    return;
  }

  if (msg.text === "/generate") {
    bot.sendMessage(chatId, "Please enter a description to generate an image:");

    bot.on("message", async (msg) => {
      if (msg.text) {
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
      }
    });

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
