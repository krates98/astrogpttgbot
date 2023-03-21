const TelegramBot = require("node-telegram-bot-api");

const { Configuration, OpenAIApi } = require("openai");

const botToken = "6141126049:AAF9owgkLVsNZibZZzx-u2GvIkIkY4LuuEA";

const openaiToken = "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";

const config = new Configuration({
  apiKey: openaiToken,
});

const openai = new OpenAIApi(config);

const bot = new TelegramBot(botToken, { polling: true });

let conversationStarted = false; // flag to keep track of whether the conversation has started or not

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

  const reply = await openai.createCompletion({
    max_tokens: 100,
    model: "text-curie-001",
    prompt: msg.text + " (please keep your answer within 100 words)",
    temperature: 0,
  });

  bot.sendMessage(chatId, reply.data.choices[0].text);
});
