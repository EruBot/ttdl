import { cache } from "../services/cacheService.js";
import { queue } from "../services/queueService.js";
import { rateLimiter } from "../services/rateLimiter.js";
import { getTikTokVideo } from "../services/tiktokService.js";
import { extractFirstUrl, isHttpUrl } from "../utils/validator.js";
import { logger } from "../utils/logger.js";

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
          return ctx.replyWithVideo(cached, { supports_streaming: true });
        }

        const result = await getTikTokVideo(url);

        if (result.type === "image" && result.images?.length) {
          const media = result.images.map((img, i) => ({
            type: "photo",
            media: img,
            caption: i === 0 ? "Done" : undefined
          }));

          await ctx.replyWithMediaGroup(media);
          return;
        }

        const msg = await ctx.replyWithVideo(result.video, {
          supports_streaming: true
        });

        const fileId = msg.video.file_id;
        cache.set(url, fileId);

        await ctx.reply("Kirim link lagi untuk download video lainnya");
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