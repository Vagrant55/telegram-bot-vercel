import { createClient } from '@supabase/supabase-js';

// 🔐 Переменные окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_IDS = [935264202, 1527919229]; // ваши Telegram ID

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// 🛡️ Защита от отсутствующих переменных
if (!TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN не задан — отправка сообщений невозможна');
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase не настроен — сохранение данных отключено');
}

// 🧑‍💼 Инициализация Supabase (только если есть ключи)
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// 📤 Отправка сообщения в Telegram
async function sendText(chatId, text, replyMarkup = null) {
  if (!TOKEN) {
    console.error('❌ Невозможно отправить сообщение: токен не задан');
    return;
  }
  if (typeof chatId !== 'number' || isNaN(chatId) || chatId === 0) {
    console.warn('⚠️ Пропуск отправки: некорректный chat_id', chatId);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Telegram API ошибка:', errorText);
    }
  } catch (err) {
    console.error('💥 Ошибка отправки сообщения:', err.message);
  }
}

// ✅ Ответ на нажатие кнопки (обязательно!)
async function answerCallback(callbackQueryId) {
  if (!TOKEN || !callbackQueryId) return;
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

// 💾 Сохранение сотрудника (с защитой)
async function saveEmployee(chatId, name, type) {
  if (!supabase) {
    console.warn('ℹ️ Supabase не доступен — пропуск сохранения');
    return;
  }
  if (typeof chatId !== 'number' || isNaN(chatId) || chatId <= 0) return;
  if (!name || typeof name !== 'string') name = 'Аноним';
  if (!['military', 'civil'].includes(type)) return;

  try {
    const { error } = await supabase
      .from('employees')
      .upsert({ chat_id: chatId, name, type }, { onConflict: 'chat_id' });

    if (error) console.error('❌ Supabase employees error:', error);
  } catch (err) {
    console.error('💥 Ошибка в saveEmployee:', err.message);
  }
}

// 📥 Работа с сессией админа
async function getAdminSession(chatId) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('awaiting_broadcast_type')
      .eq('chat_id', chatId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Ошибка загрузки сессии:', error);
    }
    return data?.awaiting_broadcast_type || null;
  } catch (err) {
    console.error('💥 Ошибка в getAdminSession:', err.message);
    return null;
  }
}

async function setAdminSession(chatId, type) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('admin_sessions')
      .upsert({ chat_id: chatId, awaiting_broadcast_type: type }, { onConflict: 'chat_id' });
    if (error) console.error('❌ Ошибка сохранения сессии:', error);
  } catch (err) {
    console.error('💥 Ошибка в setAdminSession:', err.message);
  }
}

async function clearAdminSession(chatId) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('chat_id', chatId);
    if (error) console.error('❌ Ошибка удаления сессии:', error);
  } catch (err) {
    console.error('💥 Ошибка в clearAdminSession:', err.message);
  }
}

// 📢 Рассылка
async function sendBroadcast(text, type) {
  if (!supabase) {
    console.warn('ℹ️ Supabase недоступен — рассылка невозможна');
    return { sent: 0 };
  }

  try {
    let query = supabase.from('employees').select('chat_id');
    if (type !== 'all') {
      query = query.eq('type', type);
    }
    const { data, error } = await query;

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
  } catch (err) {
    console.error('💥 Ошибка в sendBroadcast:', err.message);
    return { sent: 0 };
  }
}

// 🚀 Основной обработчик
export default async function handler(req, res) {
  // Telegram требует 200 даже при ошибках
  const safeEnd = () => res.status(200).json({ ok: true });

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, callback_query } = req.body;

    if (!message && !callback_query) {
      return safeEnd();
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
          return safeEnd();
        }
      }

      // Команды
      if (text === '/start') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🎖️ Военный', callback_ 'type_military' }],
            [{ text: '👔 Гражданский', callback_ 'type_civil' }],
          ],
        };
        await sendText(chatId, '👋 Привет! Пожалуйста, выберите ваш тип:', keyboard);
        return safeEnd();
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
        return safeEnd();
      }

      return safeEnd();
    }

    // 🖱️ Обработка кнопок
    if (callback_query) {
      const callbackId = callback_query.id;
      const chatId = Number(callback_query.message?.chat?.id);
      const userId = callback_query.from.id;
      const data = callback_query.data;
      const name = callback_query.from.first_name || callback_query.from.username || 'Аноним';

      // ✅ Обязательно отвечаем на callback
      await answerCallback(callbackId);

      // === Кнопки выбора типа ===
      if (['type_military', 'type_civil'].includes(data)) {
        const type = data === 'type_military' ? 'military' : 'civil';
        const label = type === 'military' ? 'Военный' : 'Гражданский';

        // Сохраняем и отправляем — используем chatId, если можно, иначе userId
        const targetId = (!isNaN(chatId) && chatId > 0) ? chatId : userId;
        await saveEmployee(targetId, name, type);
        await sendText(targetId, `✅ Вы выбрали: ${label}.`);
        return safeEnd();
      }

      // === Админские кнопки рассылки ===
      if (ADMIN_CHAT_IDS.includes(userId)) {
        if (['send_all', 'send_military', 'send_civil'].includes(data)) {
          const type = data.replace('send_', '');
          const typeMap = { all: 'всем', military: 'военным', civil: 'гражданским' };
          await setAdminSession(userId, type);
          await sendText(userId, `📩 Введите текст рассылки для: ${typeMap[type]}\n(Просто отправьте текст в чат)`);
          return safeEnd();
        }
      }

      return safeEnd();
    }

    return safeEnd();
  } catch (err) {
    console.error('💥 Критическая ошибка в обработчике:', err);
    return safeEnd(); // Всегда 200 для Telegram
  }
}
