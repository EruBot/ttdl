import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./src/config/env.js";
import { registerCommands } from "./src/bot/commands.js";
import { registerTextHandler } from "./src/bot/handler.js";
import { logger } from "./src/utils/logger.js";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN belum diisi di environment.");
}

const bot = new Telegraf(BOT_TOKEN);

registerCommands(bot);
registerTextHandler(bot);

bot.catch((err, ctx) => {
  logger.error("BOT_ERROR", {
    chatId: ctx?.chat?.id,
    userId: ctx?.from?.id,
    message: err?.message,
    stack: err?.stack
  });
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

await bot.launch();

logger.info("BOT_STARTED", { mode: "polling" });