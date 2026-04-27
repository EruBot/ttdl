import axios from "axios";

const API = "https://tikwm.com/api/";

export const getTikTokVideo = async (url) => {
  const res = await axios.post(API, { url }, { timeout: 10000 });

  const data = res.data?.data;
  if (!data) throw new Error("Gagal ambil data");

  // detect slideshow (image post)
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    return {
      type: "image",
      images: data.images
    };
  }

  return {
    type: "video",
    video: data.play
  };
};