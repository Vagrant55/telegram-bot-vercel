import { createClient } from '@supabase/supabase-js';

// 🔐 Чувствительные данные — только из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN; // ← новый токен из BotFather
const ADMIN_CHAT_IDS = [935264202, 1527919229]; // числа, не строки!

if (!TOKEN) {
  console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN не задан в переменных окружения!');
}

// 🧑‍💼 Подключение к Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Ошибка: SUPABASE_URL или SUPABASE_ANON_KEY не заданы!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📤 Отправка сообщения в Telegram
async function sendText(chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, reply_markup: replyMarkup };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Telegram API ошибка:', errorText);
    }
  } catch (err) {
    console.error('💥 Ошибка сети в sendText:', err.message);
  }
}

// ✅ Ответ на нажатие кнопки (убирает "часики")
async function answerCallback(callbackQueryId) {
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (err) {
    console.warn('⚠️ Не удалось ответить на callback:', err.message);
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

// 🚀 Основной обработчик
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, callback_query } = req.body;

    // Игнорируем пустые запросы
    if (!message && !callback_query) {
      return res.status(200).json({ ok: true });
    }

    // 📨 Обработка текстовых сообщений
    if (message && message.text) {
      const chatId = Number(message.chat.id);
      const text = message.text.trim();

      // Админ вводит текст рассылки
      if (ADMIN_CHAT_IDS.includes(chatId)) {
        const sessionType = await getAdminSession(chatId);
        if (sessionType) {
          await clearAdminSession(chatId);
          const result = await sendBroadcast(text, sessionType);
          await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
          return res.status(200).json({ ok: true });
        }
      }

      // Команды
      if (text === '/start') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🎖️ Военный', callback_data: 'type_military' }],
            [{ text: '👔 Гражданский', callback_data: 'type_civil' }],
          ],
        };
        await sendText(chatId, '👋 Привет! Пожалуйста, выберите ваш тип:', keyboard);
        return res.status(200).json({ ok: true });
      }

      if (ADMIN_CHAT_IDS.includes(chatId) && text === '/menu') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '📤 Отправить ВСЕМ', callback_data: 'send_all' }],
            [{ text: '🎖️ Только военным', callback_data: 'send_military' }],
            [{ text: '👔 Только гражданским', callback_data: 'send_civil' }],
          ],
        };
        await sendText(chatId, '👇 Выберите тип рассылки:', keyboard);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // 🖱️ Обработка нажатий на кнопки
    if (callback_query) {
      const chatId = Number(callback_query.message?.chat?.id);
      const data = callback_query.data;
      const callbackId = callback_query.id;
      const name = callback_query.from.first_name || callback_query.from.username || 'Аноним';

      // Убираем "часики" у пользователя
      await answerCallback(callbackId);

      // Защита от некорректных данных
      if (!chatId || !callback_query.message?.chat) {
        return res.status(200).json({ ok: true });
      }

      // Админ выбирает тип рассылки
      if (ADMIN_CHAT_IDS.includes(chatId)) {
        if (['send_all', 'send_military', 'send_civil'].includes(data)) {
          const type = data.replace('send_', '');
          const typeMap = { all: 'всем', military: 'военным', civil: 'гражданским' };
          await setAdminSession(chatId, type);
          await sendText(
            chatId,
            `📩 Введите текст рассылки для: ${typeMap[type]}\n(Просто отправьте текст в чат)`
          );
          return res.status(200).json({ ok: true });
        }
      }

      // Пользователь выбирает тип профиля
      if (['type_military', 'type_civil'].includes(data)) {
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
