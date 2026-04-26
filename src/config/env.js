import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const BOT_TOKEN = process.env.BOT_TOKEN ?? "";

export const MAX_FILE_MB = toInt(process.env.MAX_FILE_MB, 50);
export const RATE_LIMIT_COUNT = toInt(process.env.RATE_LIMIT_COUNT, 5);
export const RATE_LIMIT_WINDOW_MS = toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000);
export const MAX_CONCURRENCY = toInt(process.env.MAX_CONCURRENCY, 3);

export const CACHE_TTL_MS = toInt(process.env.CACHE_TTL_MS, 3600000);
export const CACHE_MAX_SIZE = toInt(process.env.CACHE_MAX_SIZE, 100);

export const DOWNLOAD_TIMEOUT_MS = toInt(process.env.DOWNLOAD_TIMEOUT_MS, 10000);
export const RETRY_COUNT = toInt(process.env.RETRY_COUNT, 3);
export const RETRY_DELAY_MS = toInt(process.env.RETRY_DELAY_MS, 1200);

export const USER_AGENT =
  process.env.USER_AGENT ??
  "Mozilla/5.0";