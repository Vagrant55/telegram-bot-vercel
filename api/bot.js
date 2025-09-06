import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text;
  const firstName = message.from.first_name || "Аноним";

  const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
  const ADMIN_CHAT_ID = 935264202;

  // Функция отправки сообщения
  const sendText = async (toChatId, msg) => {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${toChatId}&text=${encodeURIComponent(msg)}`;
    try {
      await fetch(url);
    } catch (error) {
      console.error("Ошибка отправки:", error);
    }
  };

  // Команда /start
  if (text === "/start") {
    await sendText(chatId, `✅ Привет, ${firstName}! Ты подписан на уведомления.`);
    await sendText(ADMIN_CHAT_ID, `📥 Новый сотрудник: ${firstName} (${chatId}) — не забудьте указать тип (military/civil) в таблице!`);
    return res.status(200).json({ ok: true });
  }

  // Рассылка ВСЕМ
  if (chatId == ADMIN_CHAT_ID && text.startsWith("/send_all ")) {
    const broadcastText = text.replace("/send_all ", "");
    const result = await sendToAll(broadcastText);
    await sendText(ADMIN_CHAT_ID, `✅ Рассылка ВСЕМ отправлена!\n📤 Доставлено: ${result.sent}\n❌ Ошибок: ${result.failed}`);
    return res.status(200).json({ ok: true });
  }

  // Рассылка ТОЛЬКО военным
  if (chatId == ADMIN_CHAT_ID && text.startsWith("/send_military ")) {
    const broadcastText = text.replace("/send_military ", "");
    const result = await sendToType(broadcastText, 'military');
    await sendText(ADMIN_CHAT_ID, `✅ Рассылка ВОЕННЫМ отправлена!\n📤 Доставлено: ${result.sent}\n❌ Ошибок: ${result.failed}`);
    return res.status(200).json({ ok: true });
  }

  // Рассылка ТОЛЬКО гражданским
  if (chatId == ADMIN_CHAT_ID && text.startsWith("/send_civil ")) {
    const broadcastText = text.replace("/send_civil ", "");
    const result = await sendToType(broadcastText, 'civil');
    await sendText(ADMIN_CHAT_ID, `✅ Рассылка ГРАЖДАНСКИМ отправлена!\n📤 Доставлено: ${result.sent}\n❌ Ошибок: ${result.failed}`);
    return res.status(200).json({ ok: true });
  }

  // Подсказка админу
  if (chatId == ADMIN_CHAT_ID && text === "/help") {
    await sendText(ADMIN_CHAT_ID, `
📌 Команды для рассылки:
/send_all Текст — всем сотрудникам
/send_military Текст — только военным
/send_civil Текст — только гражданским
`);
    return res.status(200).json({ ok: true });
  }

  res.status(200).json({ ok: true });
}

// Отправить ВСЕМ
async function sendToAll(text) {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/ВАШ_SPREADSHEET_ID/export?format=csv";
  let sent = 0, failed = 0;

  try {
    const response = await fetch(SHEET_URL);
    const csv = await response.text();
    const rows = csv.split('\n').slice(1); // Пропускаем заголовок

    for (let row of rows) {
      if (!row.trim()) continue;
      const cols = row.split(',');
      const chatId = cols[0]?.trim();
      if (!chatId || chatId === 'chat_id') continue;

      try {
        await sendTextToTelegram(chatId, text);
        sent++;
      } catch (e) {
        failed++;
      }
    }
  } catch (error) {
    console.error("Ошибка чтения таблицы:", error);
  }

  return { sent, failed };
}

// Отправить по типу
async function sendToType(text, type) {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1utCG8rmf449THR5g6SHvSK4pp6-nj7UEgSgP4H1_isc/export?format=csv";
  let sent = 0, failed = 0;

  try {
    const response = await fetch(SHEET_URL);
    const csv = await response.text();
    const rows = csv.split('\n').slice(1);

    for (let row of rows) {
      if (!row.trim()) continue;
      const cols = row.split(',');
      const chatId = cols[0]?.trim();
      const userType = cols[2]?.trim(); // Столбец C — тип

      if (!chatId || chatId === 'chat_id' || userType !== type) continue;

      try {
        await sendTextToTelegram(chatId, text);
        sent++;
      } catch (e) {
        failed++;
      }
    }
  } catch (error) {
    console.error("Ошибка чтения таблицы:", error);
  }

  return { sent, failed };
}

// Отправка сообщения через Telegram API
async function sendTextToTelegram(chatId, text) {
  const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
  await fetch(url);
}
