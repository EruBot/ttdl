const ts = () => new Date().toISOString();

const serialize = (meta) => {
  if (!meta || typeof meta !== "object") return "";
  return JSON.stringify(meta);
};

export const logger = {
  info(event, meta) {
    console.log(`[${ts()}] INFO  ${event} ${serialize(meta)}`);
  },
  warn(event, meta) {
    console.warn(`[${ts()}] WARN  ${event} ${serialize(meta)}`);
  },
  error(event, meta) {
    console.error(`[${ts()}] ERROR ${event} ${serialize(meta)}`);
  }
};