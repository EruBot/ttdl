import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  DOWNLOAD_TIMEOUT_MS,
  MAX_FILE_MB,
  RETRY_COUNT,
  RETRY_DELAY_MS,
  USER_AGENT
} from "../config/env.js";
import { getFileNameFromUrl, inferKind } from "../utils/validator.js";

const MAX_BYTES = MAX_FILE_MB * 1024 * 1024;

export class DownloadError extends Error {
  constructor(message, retryable = true) {
    super(message);
    this.name = "DownloadError";
    this.retryable = retryable;
  }
}

export class FileTooLargeError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileTooLargeError";
    this.retryable = false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}, timeoutMs = DOWNLOAD_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        ...(options.headers ?? {})
      },
      redirect: "follow"
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new DownloadError("Request timeout.", true);
    }
    throw new DownloadError(error?.message || "Request gagal.", true);
  } finally {
    clearTimeout(timer);
  }
}

async function retry(fn, attempts = RETRY_COUNT, delayMs = RETRY_DELAY_MS) {
  let lastError;

  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error?.retryable === false) {
        throw error;
      }

      if (i < attempts) {
        await sleep(delayMs * i);
      }
    }
  }

  throw lastError;
}

function makeTempPath(ext = ".bin") {
  const safeExt = ext.startsWith(".") ? ext : ".bin";
  return path.join(os.tmpdir(), `media-${crypto.randomUUID()}${safeExt}`);
}

function getExtensionFromContentType(contentType = "") {
  const ct = contentType.toLowerCase();

  if (ct.includes("video/mp4")) return ".mp4";
  if (ct.includes("video/webm")) return ".webm";
  if (ct.includes("video/quicktime")) return ".mov";
  if (ct.includes("image/jpeg")) return ".jpg";
  if (ct.includes("image/png")) return ".png";
  if (ct.includes("image/webp")) return ".webp";
  if (ct.includes("audio/mpeg")) return ".mp3";
  if (ct.includes("audio/mp4")) return ".m4a";

  return "";
}

async function getHeadMeta(url) {
  try {
    const response = await fetchWithTimeout(url, { method: "HEAD" });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0) || null;

    return {
      finalUrl: response.url,
      contentType,
      contentLength
    };
  } catch {
    return null;
  }
}

async function downloadOnce(url) {
  const head = await getHeadMeta(url);

  if (head?.contentLength && head.contentLength > MAX_BYTES) {
    throw new FileTooLargeError("File terlalu besar.");
  }

  const response = await fetchWithTimeout(url, { method: "GET" });

  if (!response.ok) {
    throw new DownloadError(`HTTP ${response.status}`, response.status >= 500 || response.status === 429);
  }

  if (!response.body) {
    throw new DownloadError("Body response kosong.", true);
  }

  const contentType = response.headers.get("content-type") ?? head?.contentType ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? 0) || head?.contentLength || null;
  const kind = inferKind(contentType, getFileNameFromUrl(response.url || url));
  const fileNameBase = getFileNameFromUrl(response.url || url);
  const extFromType = getExtensionFromContentType(contentType);
  const extFromName = path.extname(fileNameBase);
  const filePath = makeTempPath(extFromType || extFromName || ".bin");

  if (contentLength && contentLength > MAX_BYTES) {
    throw new FileTooLargeError("File terlalu besar.");
  }

  let bytes = 0;

  const counter = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length;

      if (bytes > MAX_BYTES) {
        callback(new FileTooLargeError("File terlalu besar."));
        return;
      }

      callback(null, chunk);
    }
  });

  try {
    await pipeline(
      Readable.fromWeb(response.body),
      counter,
      fs.createWriteStream(filePath)
    );
  } catch (error) {
    await fs.promises.unlink(filePath).catch(() => {});
    throw error;
  }

  return {
    filePath,
    kind,
    contentType,
    contentLength: bytes || contentLength,
    fileName: path.basename(filePath),
    sourceUrl: response.url || url
  };
}

export async function downloadMedia(url) {
  return retry(() => downloadOnce(url));
}

export async function cleanupFile(filePath) {
  if (!filePath) return;
  await fs.promises.unlink(filePath).catch(() => {});
}