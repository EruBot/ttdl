import { logger } from "../utils/logger.js";

export function errorHandler(err, ctx) {
  logger.error("UNHANDLED_ERROR", {
    chatId: ctx?.chat?.id,
    userId: ctx?.from?.id,
    message: err?.message,
    stack: err?.stack
  });
}