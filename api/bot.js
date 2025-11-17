import { createClient } from '@supabase/supabase-js';

// Простой6in-nemory кэш для хранения состояния админов 
const adminState = new Map();

// 🔑 Настройки
const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
const ADMIN_CHAT_IDS = [935264202, 1527919229]; // числа, не строки!

// 🧑‍💼 Подключение к Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📤 Отправка сообщения в Telegram
async function sendText(chatId, text, replyMarkup = null) {
  console.log('📤 Попытка отправки:', { chatId, text });
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, reply_markup: replyMarkup };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.text();
    if (!response.ok) {
      console.error('❌ Telegram API ошибка:', result);
    }
  } catch (err) {
    console.error('💥 Ошибка сети в sendText:', err.message);
  }
}

// 💾 Сохранение сотрудника
async function saveEmployee(chatId, name, type) {
  if (typeof chatId !== 'number') return;
  if (!name || typeof name !== 'string') name = 'Аноним';
  if (!['military', 'civil'].includes(type)) return;

  const { error } = await supabase
    .from('employees')
    .upsert({ chat_id: chatId, name, type }, { onConflict: 'chat_id' });

  if (error) console.error('❌ Supabase employees error:', error);
}

// 📥 Получить тип рассылки для админа
async function getAdminSession(chatId) {
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('awaiting_broadcast_type')
    .eq('chat_id', chatId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Ошибка загрузки сессии:', error);
  }
  return data?.awaiting_broadcast_type || null;
}

// 📥 Сохранить сессию админа
async function setAdminSession(chatId, type) {
  try {
    const { error } = await supabase
      .from('admin_sessions')
      .upsert({ chat_id: chatId, awaiting_broadcast_type: type }, { onConflict: 'chat_id' });
    if (error) console.error('❌ Ошибка сохранения сессии:', error);
  } catch (err) {
    console.error('💥 Ошибка в setAdminSession:', err.message);
  }
}

// 🧹 Удалить сессию админа
async function clearAdminSession(chatId) {
  const { error } = await supabase
    .from('admin_sessions')
    .delete()
    .eq('chat_id', chatId);
  if (error) console.error('❌ Ошибка удаления сессии:', error);
}

// 📢 Рассылка
async function sendBroadcast(text, type) {
  const { data, error } = type === 'all'
    ? await supabase.from('employees').select('chat_id')
    : await supabase.from('employees').select('chat_id').eq('type', type);

  if (error) {
    console.error('❌ Supabase select error:', error);
    return { sent: 0 };
  }

  let sent = 0;
  for (const { chat_id } of data || []) {
    try {
      await sendText(chat_id, text);
      sent++;
    } catch (e) {
      console.error(`Ошибка отправки ${chat_id}:`, e.message);
    }
  }
  return { sent };
}

// 🚀 Обработчик запросов
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, callback_query } = req.body;

    if (!message && !callback_query) {
      return res.status(200).json({ ok: true });
    }

    // 📨 Обработка текстовых сообщений
    if (message && message.text) {
      const chatId = Number(message.chat.id);
      const text = message.text;

      console.log('📨 Получен текст:', { chatId, text });

      // Админ вводит текст рассылки
      const sessionType = await getAdminSession(chatId);
      if (ADMIN_CHAT_IDS.includes(chatId) && sessionType) {
        await clearAdminSession(chatId);
        const result = await sendBroadcast(text, sessionType);
        await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
        return res.status(200).json({ ok: true });
      }

      // Команда /start
      if (text === "/start") {
        const keyboard = {
          inline_keyboard: [
            [{ text: "🎖️ Военный", callback_data: "type_military" }],
            [{ text: "👔 Гражданский", callback_data: "type_civil" }]
          ]
        };
        await sendText(chatId, "👋 Привет! Пожалуйста, выберите ваш тип:", keyboard);
        return res.status(200).json({ ok: true });
      }

      // Команда /menu
      if (ADMIN_CHAT_IDS.includes(chatId) && text === "/menu") {
        const keyboard = {
          inline_keyboard: [
            [{ text: "📤 Отправить ВСЕМ", callback_data: "send_all" }],
            [{ text: "🎖️ Только военным", callback_data: "send_military" }],
            [{ text: "👔 Только гражданским", callback_data: "send_civil" }]
          ]
        };
        await sendText(chatId, "👇 Выберите тип рассылки:", keyboard);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // 🖱️ Обработка кнопок
    if (callback_query) {
     console.log('📥 Получен callback_query:', {
       data: callback_query.data,
       chatId: callback_query.message?.chat?.id
     });

      // Защита от NaN
  const chatId = Number(callback_query.message.chat.id);
  if (isNaN(chatId)) {
    console.error('❌ chatId не число:', callback_query.message.chat.id);
    return res.status(200).json({ ok: true });
  }
      if (!callback_query.message?.chat) {
        return res.status(200).json({ ok: true });
      }

      const chatId = Number(callback_query.message.chat.id);
      const data = callback_query.data;
      const name = callback_query.from.first_name || callback_query.from.username || "Аноним";

      console.log('🖱️ Callback:', { chatId, data });


      
      // Админ выбирает тип рассылки
      if (ADMIN_CHAT_IDS.includes(chatId)) {
        if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
          const type = data.replace('send_', '');
          const typeMap = { all: 'всем', military: 'военным', civil: 'гражданским' };
          await setAdminSession(chatId, type);
          await sendText(chatId, `📩 Введите текст рассылки для: ${typeMap[type]}\n(Просто отправьте текст в чат)`);
          return res.status(200).json({ ok: true });
        }
      }

      // Пользователь выбирает тип профиля
      if (data === 'type_military' || data === 'type_civil') {
        const type = data === 'type_military' ? 'military' : 'civil';
        await saveEmployee(chatId, name, type);
        await sendText(chatId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}.`);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('💥 Глобальная ошибка:', err);
    return res.status(200).json({ ok: true });
  }
}
