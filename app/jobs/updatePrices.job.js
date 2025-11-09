import axios from "axios";
import { PriceItem } from "../database/postgres_sequelize.js";
import TelegramNotifier from "../utils/telegram-notifier.js";
import { getIranTimeJalali } from "../utils/time-utils.js";

/**
 * Updates local prices from BRSAPI (Gold & Currency).
 * 1. Destroys all old price records
 * 2. Inserts fresh data from API
 * 3. Sends Telegram notification on success/failure
 */
export async function updatePricesFromAPI() {
  try {
    // Step 1: Fetch data from API
    const res = await axios.get(process.env.PRICES_UPDATE_URL);
    const { gold = [], currency = []} = res.data;
    const allItems = [...gold, ...currency];

    // Step 2: Delete all existing records in PriceItem table
    await PriceItem.destroy({ where: {} });

    // Step 3: Insert new items
    let inserted = 0;
    for (const item of allItems) {
      await PriceItem.create({
        symbol: item.symbol,
        title: item.name,
        buy: item.price,
        sell: item.price,
        last_update: new Date(item.time_unix * 1000),
      });
      inserted++;
    }

    // Step 4: Send success notification
    const now = getIranTimeJalali();

  } catch (err) {
    // Step 5: Send error notification
    const now = getIranTimeJalali();
    const errorMessage = `❌ خطا در به‌روزرسانی قیمت‌ها از BRSAPI:\n${err.message}\n📅 زمان: ${now}`;
    await TelegramNotifier.sendMessage(errorMessage, "StorySazCronJobAgent");
  }
}
