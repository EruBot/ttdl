import path from "node:path";

export function extractFirstUrl(text) {
  if (typeof text !== "string" || !text.trim()) return null;

  const match = text.match(/https?:\/\/[^\s<>"'`]+/i);
  if (!match) return null;

  try {
    return new URL(match[0]).toString();
  } catch {
    return null;
  }
}

export function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

export function inferKind(contentType = "", fileName = "") {
  const ct = String(contentType).toLowerCase();
  const ext = path.extname(fileName).toLowerCase();

  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("image/")) return "photo";
  if (ct.startsWith("audio/")) return "audio";

  if ([".mp4", ".mov", ".mkv", ".webm", ".m4v"].includes(ext)) return "video";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return "photo";
  if ([".mp3", ".m4a", ".aac", ".wav", ".ogg"].includes(ext)) return "audio";

  return "document";
}

export function getFileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const base = path.basename(u.pathname);
    if (base && base !== "/" && base !== ".") return decodeURIComponent(base);
  } catch {}
  return "download";
}