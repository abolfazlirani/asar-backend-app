import cron from "node-cron";
import { updatePricesFromAPI } from "./jobs/updatePrices.job.js";
import TelegramNotifier from "./utils/telegram-notifier.js";

const APP_STATE = process.env.APP_STATE || "production";

// Only run initial job if not in development mode
if (APP_STATE !== "dev") {
  (async () => {
    try {
      await updatePricesFromAPI();
      await TelegramNotifier.sendMessage(
        "🚀 اجرای اولیه کرون‌جاب هنگام استارت اپ موفق بود ✅",
        "Startup"
      );
    } catch (error) {
      console.error(error);
      await TelegramNotifier.sendMessage(
        `❌ خطا در اجرای اولیه کرون‌جاب:\n${error.message}`,
        "Startup"
      );
    }
  })();
}

// Schedule the cron job
if (APP_STATE === "dev") {
  // In development, run once a day at 12:00 PM
  cron.schedule("0 12 * * *", async () => {
    await updatePricesFromAPI();
  });
} else {
  // In other environments, run every hour
  cron.schedule("0 * * * *", async () => {
    await updatePricesFromAPI();
  });
}
