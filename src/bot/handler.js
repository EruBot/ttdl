import fs from "node:fs";
import { cache } from "../services/cacheService.js";
import { queue } from "../services/queueService.js";
import { rateLimiter } from "../services/rateLimiter.js";
import { cleanupFile, downloadMedia } from "../services/downloadService.js";
import {
  extractFirstUrl,
  isHttpUrl,
  normalizeUrl
} from "../utils/validator.js";
import { logger } from "../utils/logger.js";

async function sendByKind(ctx, kind, filePath, fileName) {
  const stream = () => fs.createReadStream(filePath);
  const payload = { source: stream(), filename: fileName };

  if (kind === "video") {
    return ctx.replyWithVideo(payload, { supports_streaming: true });
  }

  if (kind === "photo") {
    return ctx.replyWithPhoto(payload);
  }

  if (kind === "audio") {
    return ctx.replyWithAudio(payload);
  }

  return ctx.replyWithDocument(payload);
}

function extractTelegramFileId(message) {
  if (!message) return null;

  if (message.video?.file_id) {
    return { fileId: message.video.file_id, kind: "video" };
  }

  if (message.photo?.length) {
    return {
      fileId: message.photo[message.photo.length - 1].file_id,
      kind: "photo"
    };
  }

  if (message.audio?.file_id) {
    return { fileId: message.audio.file_id, kind: "audio" };
  }

  if (message.document?.file_id) {
    return { fileId: message.document.file_id, kind: "document" };
  }

  return null;
}

async function handleUrl(ctx, rawUrl) {
  const normalizedUrl = normalizeUrl(rawUrl);
  const cached = cache.get(normalizedUrl);

  if (cached?.fileId) {
    logger.info("CACHE_HIT", { userId: ctx.from.id, url: normalizedUrl, kind: cached.kind });
    return sendFromFileId(ctx, cached);
  }

  const startedAt = Date.now();

  return queue.add(async () => {
    const tempFiles = [];

    try {
      logger.info("DOWNLOAD_START", { userId: ctx.from.id, url: normalizedUrl });

      const result = await downloadMedia(normalizedUrl);
      tempFiles.push(result.filePath);

      const sent = await sendByKind(ctx, result.kind, result.filePath, result.fileName);
      const telegram = extractTelegramFileId(sent);

      if (telegram?.fileId) {
        cache.set(normalizedUrl, {
          fileId: telegram.fileId,
          kind: telegram.kind || result.kind
        });
      }

      const elapsed = Date.now() - startedAt;
      logger.info("DOWNLOAD_DONE", {
        userId: ctx.from.id,
        url: normalizedUrl,
        kind: result.kind,
        elapsedMs: elapsed
      });

      await ctx.reply("Kirim URL lagi untuk memproses file berikutnya.");
    } finally {
      await Promise.all(tempFiles.map((file) => cleanupFile(file)));
    }
  });
}

async function sendFromFileId(ctx, cached) {
  if (cached.kind === "video") {
    return ctx.replyWithVideo(cached.fileId, { supports_streaming: true });
  }

  if (cached.kind === "photo") {
    return ctx.replyWithPhoto(cached.fileId);
  }

  if (cached.kind === "audio") {
    return ctx.replyWithAudio(cached.fileId);
  }

  return ctx.replyWithDocument(cached.fileId);
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

    try {
      await handleUrl(ctx, url);
    } catch (error) {
      logger.error("PROCESS_FAILED", {
        userId: ctx.from?.id,
        url,
        message: error?.message,
        stack: error?.stack
      });

      if (error?.name === "FileTooLargeError") {
        return ctx.reply("File terlalu besar untuk diproses.");
      }

      return ctx.reply("Gagal memproses file. Coba lagi beberapa saat.");
    }
  });
}