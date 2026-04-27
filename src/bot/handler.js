import { cache } from "../services/cacheService.js";
import { queue } from "../services/queueService.js";
import { rateLimiter } from "../services/rateLimiter.js";
import { getTikTokVideo } from "../services/tiktokService.js";
import { extractFirstUrl, isHttpUrl } from "../utils/validator.js";
import { logger } from "../utils/logger.js";

const CAPTION = "upload by: @ttdl_anilobot";
const JOIN_LINK = "https://t.me/grup_anime_indo";
const TARGET_USERNAME = "grup_anime_indo";

function buildKeyboard(ctx) {
  const chatUsername = ctx.chat?.username;
  const isTargetGroup = chatUsername && chatUsername.toLowerCase() === TARGET_USERNAME;
  if (isTargetGroup) return undefined;
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "JOIN", url: JOIN_LINK }]]
    }
  };
}

export function registerTextHandler(bot) {
  bot.on("text", async (ctx) => {
    const text = ctx.message?.text ?? "";
    const url = extractFirstUrl(text);

    if (!url) return;

    if (!isHttpUrl(url)) {
      return ctx.reply("URL tidak valid.");
    }

    const userId = ctx.from?.id?.toString?.() ?? String(ctx.from?.id ?? "");
    const rate = rateLimiter.allow(userId);

    if (!rate.allowed) {
      return ctx.reply("Terlalu banyak request, coba lagi sebentar.");
    }

    await queue.add(async () => {
      try {
        const cached = cache.get(url);
        if (cached) {
          const extra = buildKeyboard(ctx);
          return ctx.replyWithVideo(cached, {
            supports_streaming: true,
            caption: CAPTION,
            ...(extra || {})
          });
        }

        const result = await getTikTokVideo(url);
        const extra = buildKeyboard(ctx);

        if (result.type === "image" && result.images?.length) {
          const media = result.images.map((img, i) => ({
            type: "photo",
            media: img,
            caption: i === 0 ? CAPTION : undefined
          }));

          await ctx.replyWithMediaGroup(media, extra || undefined);
          return;
        }

        const msg = await ctx.replyWithVideo(result.video, {
          supports_streaming: true,
          caption: CAPTION,
          ...(extra || {})
        });

        const fileId = msg.video.file_id;
        cache.set(url, fileId);
      } catch (error) {
        logger.error("TIKTOK_ERROR", {
          userId: ctx.from?.id,
          url,
          message: error?.message
        });

        ctx.reply("Gagal mengambil video. Coba lagi nanti.");
      }
    });
  });
}