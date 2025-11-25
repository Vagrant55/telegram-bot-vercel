import { createClient } from '@supabase/supabase-js';

// 🔐 Загрузка токена из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_IDS = [935264202, 1527919229]; // ваши ID

if (!TOKEN) {
  console.error('❌ КРИТИКА: TELEGRAM_BOT_TOKEN не задан в Environment Variables!');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_URL или SUPABASE_ANON_KEY не заданы!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📤 Отправка сообщения
async function sendText(chatId, text, replyMarkup = null) {
  if (typeof chatId !== 'number' || isNaN(chatId) || chatId <= 0) {
    console.warn('⚠️ Попытка отправки в недопустимый chat_id:', chatId);
    return;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
    });
    const result = await response.text();
    if (!response.ok) {
      console.error('❌ Telegram API send error:', result);
    }
  } catch (e) {
    console.error('💥 Ошибка сети в sendText:', e.message);
  }
}

// ✅ Обязательный ответ на callback_query
async function answerCallback(callbackQueryId) {
  if (!callbackQueryId) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (e) {
    console.warn('⚠️ Не удалось ответить на callback:', e.message);
  }
}

// 💾 Сохранение сотрудника
async function saveEmployee(chatId, name, type) {
  if (typeof chatId !== 'number' || isNaN(chatId) || chatId <= 0) return;
  if (!name || typeof name !== 'string') name = 'Аноним';
  if (!['military', 'civil'].includes(type)) return;

  const { error } = await supabase
    .from('employees')
    .upsert({ chat_id: chatId, name, type }, { onConflict: 'chat_id' });

  if (error) console.error('❌ Supabase employees error:', error);
}

// 📥 Сессия админа
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

async function setAdminSession(chatId, type) {
  try {
    const { error } = await supabase
      .from('admin_sessions')
      .upsert({ chat_id: chatId, awaiting_broadcast_type: type }, { onConflict: 'chat_id' });
    if (error) console.error('❌ Ошибка сохранения сессии:', error);
  } catch (err) {
    console.error('💥 setAdminSession error:', err.message);
  }
}

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

    if (!message && !callback_query) {
      return res.status(200).json({ ok: true });
    }

    // 📨 Обработка текстовых сообщений
    if (message && message.text) {
      const chatId = Number(message.chat.id);
      const text = message.text.trim();

      if (ADMIN_CHAT_IDS.includes(chatId)) {
        const sessionType = await getAdminSession(chatId);
        if (sessionType) {
          await clearAdminSession(chatId);
          const result = await sendBroadcast(text, sessionType);
          await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
          return res.status(200).json({ ok: true });
        }
      }

      if (text === '/start') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🎖️ Военный', callback_ 'type_military' }],
            [{ text: '👔 Гражданский', callback_ 'type_civil' }],
          ],
        };
        await sendText(chatId, '👋 Привет! Пожалуйста, выберите ваш тип:', keyboard);
        return res.status(200).json({ ok: true });
      }

      if (ADMIN_CHAT_IDS.includes(chatId) && text === '/menu') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '📤 Отправить ВСЕМ', callback_ 'send_all' }],
            [{ text: '🎖️ Только военным', callback_ 'send_military' }],
            [{ text: '👔 Только гражданским', callback_ 'send_civil' }],
          ],
        };
        await sendText(chatId, '👇 Выберите тип рассылки:', keyboard);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // 🖱️ Обработка кнопок
    if (callback_query) {
      const callbackId = callback_query.id;
      const chatId = Number(callback_query.message?.chat?.id);
      const userId = callback_query.from.id; // ID пользователя, который нажал
      const data = callback_query.data;
      const name = callback_query.from.first_name || callback_query.from.username || 'Аноним';

      // Логирование для диагностики
      console.log('🔍 Callback:', {
        chatId,
        userId,
        data,
        isValidChatId: !isNaN(chatId) && chatId > 0,
        messageExists: !!callback_query.message,
      });

      // ✅ Обязательно отвечаем на callback
      await answerCallback(callbackId);

      // Если сообщение удалено — не падаем, но работаем через userId
      if (!callback_query.message?.chat) {
        console.log('ℹ️ Сообщение удалено — используем userId для ответа');
      }

      // === Админские кнопки рассылки ===
      if (ADMIN_CHAT_IDS.includes(userId)) {
        if (['send_all', 'send_military', 'send_civil'].includes(data)) {
          const type = data.replace('send_', '');
          const typeMap = { all: 'всем', military: 'военным', civil: 'гражданским' };
          await setAdminSession(userId, type);
          await sendText(userId, `📩 Введите текст рассылки для: ${typeMap[type]}\n(Просто отправьте текст в чат)`);
          return res.status(200).json({ ok: true });
        }
      }

      // === Кнопки выбора типа пользователя ===
      if (['type_military', 'type_civil'].includes(data)) {
        const type = data === 'type_military' ? 'military' : 'civil';
        const label = type === 'military' ? 'Военный' : 'Гражданский';

        // Сохраняем по chatId, если возможно
        if (!isNaN(chatId) && chatId > 0) {
          await saveEmployee(chatId, name, type);
          await sendText(chatId, `✅ Вы выбрали: ${label}.`);
        } else {
          // Иначе — сохраняем по userId и отправляем туда
          await saveEmployee(userId, name, type);
          await sendText(userId, `✅ Вы выбрали: ${label}.`);
        }
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
