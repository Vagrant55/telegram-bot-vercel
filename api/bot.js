import { createClient } from '@supabase/supabase-js';

// 🧠 In-memory кэш для  состояния  админов
const adminState = new Map();

// 🔑 Настройки
const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
const ADMIN_CHAT_IDS = [935264202, 1527919229];
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🚀 Главная функция
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, callback_query } = req.body;
  if (!message && !callback_query) return res.status(200).json({ ok: true });

  // 📥 Текстовые сообщения
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text;

    // Админ вводит текст после выбора кнопки
    if (ADMIN_CHAT_IDS.includes(chatId) && adminState.has(chatId)) {
      const { type } = adminState.get(chatId);
      adminState.delete(chatId);
      const result = await sendBroadcast(text, type);
      await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
      return res.status(200).json({ ok: true });
    }

    // /start — сотрудники
    if (text === "/start") {
      const keyboard = {
        inline_keyboard: [
          [{ text: "🎖️ Военный", callback_data: "type_military" }],
          [{ text: "👔 Гражданский", callback_data: "type_civil" }]
        ]
      };
      await sendText(chatId, "👋 Привет! Выберите ваш тип:", keyboard);
      return res.status(200).json({ ok: true });
    }

    // /menu — админы
    if (ADMIN_CHAT_IDS.includes(chatId) && text === "/menu") {
      const keyboard = {
        inline_keyboard: [
          [{ text: "📤 Всем", callback_data: "send_all" }],
          [{ text: "🎖️ Военным", callback_data: "send_military" }],
          [{ text: "👔 Гражданским", callback_data: "send_civil" }]
        ]
      };
      await sendText(chatId, "👇 Выберите тип рассылки:", keyboard);
      return res.status(200).json({ ok: true });
    }
  }

  // 🎯 Нажатия кнопок
  if (callback_query) {
    const chatId = callback_query.message.chat.id;
    const data = callback_query.data;
    const name = callback_query.from.first_name || "Аноним";

    // Сотрудник выбирает тип
    if (data === 'type_military' || data === 'type_civil') {
      const type = data === 'type_military' ? 'military' : 'civil';
      await saveEmployee(chatId, name, type);
      await sendText(chatId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}.`);
      return res.status(200).json({ ok: true });
    }

    // Админ выбирает рассылку
    if (ADMIN_CHAT_IDS.includes(chatId)) {
      if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
        const typeMap = {
          'send_all': 'всем',
          'send_military': 'военным',
          'send_civil': 'гражданским'
        };
        adminState.set(chatId, { type: data.replace('send_', '') });
        await sendText(chatId, `📩 Введите текст рассылки для: ${typeMap[data]}`);
        return res.status(200).json({ ok: true });
      }
    }
  }

  res.status(200).json({ ok: true });
}

// 📤 Отправка сообщения
async function sendText(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
  if (replyMarkup) url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
  await fetch(url, { method: 'GET' });
}

// 💾 Сохранение сотрудника
async function saveEmployee(chatId, name, type) {
  await supabase
    .from('employees')
    .upsert({ chat_id: chatId, name, type }, { onConflict: 'chat_id' });
}

// 📢 Рассылка
async function sendBroadcast(text, type) {
  const { data } = type === 'all' 
    ? await supabase.from('employees').select('chat_id')
    : await supabase.from('employees').select('chat_id').eq('type', type);

  let sent = 0;
  for (const { chat_id } of data || []) {
    try {
      await sendText(chat_id, text);
      sent++;
    } catch (e) {}
  }
  return { sent };
}