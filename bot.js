const TelegramBot = require("node-telegram-bot-api");

const { Configuration, OpenAIApi } = require("openai");

const botToken = process.env.botToken;
const openAiToken = process.env.openAiToken;

const config = new Configuration({
  apiKey: openAiToken,
});

const openai = new OpenAIApi(config);

const bot = new TelegramBot(botToken, { polling: true });

let conversationStarted = false; // flag to keep track of whether the conversation has started or not

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const message =
    "Welcome to Telegram ChatBot. Please choose an action:\n\n" +
    "/help - Get help\n" +
    "/menu - Show menu\n" +
    "/website - Get website URL\n";

  const options = {
    reply_markup: {
      keyboard: [
        [{ text: "/help" }, { text: "/menu" }],
        [{ text: "/website" }],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, message, options);
  conversationStarted = true; // set the flag to true when the user sends the "/start" command
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === "/help") {
    bot.sendMessage(chatId, "This is a help message.");
    return;
  }

  if (messageText === "/menu") {
    const message =
      "Please choose an action:\n\n" +
      "/help - Get help\n" +
      "/menu - Show menu\n" +
      "/website - Get website URL\n";

    const options = {
      reply_markup: {
        keyboard: [
          [{ text: "/help" }, { text: "/menu" }],
          [{ text: "/website" }],
        ],
        resize_keyboard: true,
      },
    };

    bot.sendMessage(chatId, message, options);
    return;
  }

  if (messageText === "/website") {
    bot.sendMessage(chatId, "https://www.google.com");
    return;
  }

  // If none of the message commands match, send a response using OpenAI
  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: messageText + " (please keep your answer within 100 words)",
    temperature: 0,
  });

  bot.sendMessage(chatId, reply.data.choices[0].text);
});
