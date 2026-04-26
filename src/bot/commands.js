export function registerCommands(bot) {
  bot.start((ctx) => {
    return ctx.reply(
      [
        "Kirim URL media langsung yang boleh diakses publik.",
        "Bot akan mengunduh, memproses, lalu mengirim ulang file tersebut.",
        "Gunakan /help untuk format penggunaan."
      ].join("\n")
    );
  });

  bot.help((ctx) => {
    return ctx.reply(
      [
        "Cara pakai:",
        "1. Kirim satu URL media langsung.",
        "2. Tunggu proses selesai.",
        "3. Bot akan kirim file kembali.",
        "",
        "Catatan:",
        "- Hanya URL yang valid dan dapat diakses publik.",
        "- File di atas batas ukuran akan ditolak."
      ].join("\n")
    );
  });
}