import axios from "axios";

const API = "https://tikwm.com/api/";

export const getTikTokVideo = async (url) => {
  const res = await axios.post(API, { url }, { timeout: 10000 });

  const data = res.data?.data;
  if (!data) throw new Error("Gagal ambil data");

  return {
    video: data.play
  };
};