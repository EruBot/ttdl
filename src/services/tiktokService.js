import { chromium } from "playwright";

export const getTikTokVideo = async (url) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // wait for video
    const video = await page.waitForSelector("video", { timeout: 15000 });
    const videoUrl = await video.getAttribute("src");

    if (videoUrl) {
      return {
        type: "video",
        video: videoUrl
      };
    }

    // fallback: check images (slideshow)
    const images = await page.$$eval("img", imgs =>
      imgs.map(i => i.src).filter(src => src.includes("tiktokcdn"))
    );

    if (images.length) {
      return {
        type: "image",
        images
      };
    }

    throw new Error("No media found");
  } finally {
    await browser.close();
  }
};