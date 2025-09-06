import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Получаем тело запроса
  const body = req.body;
  if (!body || !body.message) {
    return res.status(200).json({ ok: true });
  }

  const { message } = body;
  const chatId = message.chat.id;
  const text = message.text;
  const firstName = message.from.first_name || "Аноним";

  const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
  const ADMIN_CHAT_ID = 935264202;

  // Функция отправки сообщения
  const sendText = async (toChatId, msg) => {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${toChatId}&text=${encodeURIComponent(msg)}`;
    try {
      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.error("Ошибка отправки:", error);
    }
  };

  // Команда /start
  if (text === "/start") {
    await sendText(chatId, `✅ Привет, ${firstName}! Ты подписан на уведомления.`);
    await sendText(ADMIN_CHAT_ID, `📥 Новый сотрудник: ${firstName} (${chatId})`);
    return res.status(200).json({ ok: true });
  }

  // Команда /send (только для админа)
  if (chatId == ADMIN_CHAT_ID && text.startsWith("/send ")) {
    const broadcastText = text.replace("/send ", "");
    await sendText(ADMIN_CHAT_ID, `📤 Рассылка: "${broadcastText}" — пока отправляется только вам.`);
    return res.status(200).json({ ok: true });
  }

  res.status(200).json({ ok: true });
}
