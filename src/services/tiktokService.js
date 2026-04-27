import axios from "axios";

const API = "https://tikwm.com/api/";

async function resolveTikTokUrl(url) {
  try {
    const res = await axios.get(url, {
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      validateStatus: (s) => s >= 200 && s < 400
    });

    const finalUrl = res?.request?.res?.responseUrl;
    return finalUrl || url;
  } catch {
    return url;
  }
}

export const getTikTokVideo = async (url) => {
  const finalUrl = await resolveTikTokUrl(url);

  const res = await axios.post(API, { url: finalUrl }, { timeout: 10000 });

  const data = res.data?.data;
  if (!data) throw new Error("Gagal ambil data");

  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    return {
      type: "image",
      images: data.images
    };
  }

  const videoUrl = data.play || data.wmplay || data.hdplay;

  if (!videoUrl) {
    throw new Error("Video tidak tersedia dari API");
  }

  return {
    type: "video",
    video: videoUrl
  };
};