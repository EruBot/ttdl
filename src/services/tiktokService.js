import axios from "axios";

const API = "https://tikwm.com/api/";

async function resolveTikTokUrl(url) {
  try {
    const res = await axios.get(url, {
      maxRedirects: 10,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      validateStatus: (s) => s >= 200 && s < 400
    });

    return res?.request?.res?.responseUrl || url;
  } catch {
    return url;
  }
}

function cleanUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

async function fetchTikwm(url) {
  const res = await axios.post(API, { url }, { timeout: 10000 });

  const data = res.data?.data;
  if (!data) throw new Error("Tikwm error");

  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    return {
      type: "image",
      images: data.images
    };
  }

  const video = data.play || data.wmplay || data.hdplay;
  if (!video) throw new Error("No video");

  return {
    type: "video",
    video
  };
}

function extractVideoFromHtml(html) {
  const patterns = [
    /"playAddr":"(.*?)"/,
    /"downloadAddr":"(.*?)"/,
    /"play_url":"(.*?)"/
  ];

  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      return match[1].replace(/\\u0026/g, "&");
    }
  }

  return null;
}

async function fetchFallback(url) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  const html = res.data;
  const video = extractVideoFromHtml(html);

  if (!video) throw new Error("Fallback failed");

  return {
    type: "video",
    video
  };
}

export const getTikTokVideo = async (url) => {
  const resolved = await resolveTikTokUrl(url);
  const clean = cleanUrl(resolved);

  try {
    return await fetchTikwm(clean);
  } catch {
    return await fetchFallback(clean);
  }
};
