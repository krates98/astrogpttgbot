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

const menuMessage =
  "🃏 Please choose an action:\n\n" +
  "💁🏻 /help - Get help\n" +
  "🥪 /menu - Show menu\n" +
  "🌐 /website - Get website URL\n" +
  "🎨 /generate - Generate image using text\n" +
  "💬 /chat - Start a chat with the bot\n" +
  "🔮 /tarotreading - Get a random tarot reading\n" +
  "🔮 /tokentarot - Get a specific tarot reading\n" +
  "🔮 /brokenheart - Get advice for a broken heart\n" +
  "😔 /depression - Get help with depression\n" +
  "😊 /cheermeup - Get cheered up\n" +
  "💰 /getrich - Get advice on how to get rich\n" +
  "💼 /shouldinvest - Get investment advice\n" +
  "💪 /health - Get health advice\n" +
  "❤️ /relationship - Get advice on relationships\n" +
  "🔐 /admin - Admin commands (admins only)";

const adminUsernames = ["your_admin_username_here"]; // Replace with the usernames of your admin users

const userCommandCounts = new Map();

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "This is a help message.");
});

bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, menuMessage);
});

bot.onText(/\/website/, (msg) => {
  bot.sendMessage(msg.chat.id, "https://www.telegramgpt.com");
});

bot.onText(/\/generate/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please enter some text to generate an image:");
});

bot.onText(/\/chat/, (msg) => {
  bot.sendMessage(msg.chat.id, "Please enter a message:");
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

  if (msg.text === "/generate") {
    bot.once("message", async (msg) => {
      if (msg.text) {
        const text = msg.text;

        bot.sendPhoto(chatId, placeholderImage).then(async (sentMessage) => {
          try {
            const response = await openai.createImage({
              model: "image-alpha-001",
              prompt: text,
              n: 1,
              size: "1024x1024",
            });

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
      }
    });
  }

  if (msg.text === "/chat") {
    bot.sendMessage(chatId, "Please enter a message:");
    bot.on("message", chatListener);
  }
});

const generateRandomTarotReading = async () => {
  // Code to generate a random tarot reading goes here
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

const chatListener = async (msg) => {
  if (
    msg.text != "/help" &&
    msg.text != "/generate" &&
    msg.text != "/menu" &&
    msg.text != "/start" &&
    msg.text != "/website" &&
    msg.text != "/chat"
  ) {
    const reply = await openai.createCompletion({
      max_tokens: 100,
      model: "text-curie-001",
      prompt: msg.text + " (please keep your answer within 100 words)",
      temperature: 0,
    });

    bot.sendMessage(chatId, reply.data.choices[0].text);
  }
};

app.get("/", (req, res) => {
  res.send("Telegram ChatBot is running");
});

app.listen(port, () => {
  console.log("Telegram ChatBot is listening");
});
