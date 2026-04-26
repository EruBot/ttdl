# Media Downloader Bot

A Telegram bot (originally branded as a TikTok no-watermark downloader) that accepts a public, direct media URL from a user, downloads it, and re-uploads it to Telegram as the appropriate media type (video, photo, audio, or document).

## Tech Stack

- **Runtime**: Node.js 18+ (ES modules)
- **Framework**: [Telegraf](https://telegraf.js.org/) v4 (Telegram bot framework, long-polling mode)
- **Config**: dotenv

## Project Layout

```
index.js                      # Entrypoint: instantiates Telegraf, registers handlers, launches polling
src/
  bot/
    commands.js               # /start and /help command handlers
    handler.js                # Main text-message handler: URL extraction, queueing, download, send
  config/
    env.js                    # Loads/normalizes env vars (BOT_TOKEN, limits, timeouts, etc.)
  middlewares/
    errorHandler.js           # Generic error logger
  services/
    cacheService.js           # In-memory LRU+TTL cache of url -> Telegram file_id
    downloadService.js        # Streams media via fetch with size limit, retries, timeouts
    queueService.js           # Bounded async concurrency queue
    rateLimiter.js            # Sliding-window per-user rate limiter
  utils/
    logger.js                 # Structured console logger
    validator.js              # URL parsing/validation, MIME/extension -> media kind inference
```

## Environment

Required secret:
- `BOT_TOKEN` — Telegram Bot API token from @BotFather

Optional tunables (see `.env.example`): `MAX_FILE_MB`, `RATE_LIMIT_COUNT`, `RATE_LIMIT_WINDOW_MS`, `MAX_CONCURRENCY`, `CACHE_TTL_MS`, `CACHE_MAX_SIZE`, `DOWNLOAD_TIMEOUT_MS`, `RETRY_COUNT`, `RETRY_DELAY_MS`, `USER_AGENT`.

## Replit Setup

- This is a **backend-only** worker (no HTTP server, no frontend). It connects to Telegram via long polling.
- Workflow: **Telegram Bot** → `npm start` (console output, no port).
- No database, no integrations beyond the Telegram Bot API.

## Run Locally / On Replit

```bash
npm install
npm start
```

The workflow restarts the process automatically; on a successful start there is no further stdout (Telegraf's `bot.launch()` only resolves when polling stops). Operational logs (`DOWNLOAD_START`, `DOWNLOAD_DONE`, `CACHE_HIT`, errors) appear when users interact with the bot.
