import { createClient } from '@supabase/supabase-js';

// 🧠 Простой in-memory кэш для хранения состояния админов
const adminState = new Map();

// 🔑 Настройки
const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
const ADMIN_CHAT_IDS = [935264202, 1527919229];

// 🧑‍💼 Подключение к Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🚀 Главная функция обработки запросов
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, callback_query } = req.body;

    if (!message && !callback_query) return res.status(200).json({ ok: true });

    // Обработка текстовых сообщений
    if (message && message.text) {
      const chatId = Numaber(message.chat.id);
      const text = message.text;

      if (ADMIN_CHAT_IDS.includes(chatId) && adminState.has(chatId)) {
        const { type } = adminState.get(chatId);
        adminState.delete(chatId);

        const result = await sendBroadcast(text, type);
        await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
        return res.status(200).json({ ok: true });
      }

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
    }

    // Обработка нажатий кнопок
    if (callback_query) {
      console.log('📥 Получен callback_query:', {
        data: callback_query.data,
        chatId: callback_query.message?.chat?.id,
        fromId: callback_query.from?.id
      });

      if (!callback_query.message || !callback_query.message.chat) {
        console.warn('⚠️ Пропущен callback_query: отсутствует message или chat');
        return res.status(200).json({ ok: true });
      }

      const chatId = Number(callback_query.message.chat.id);
      const data = callback_query.data;
      const name = callback_query.from.first_name || callback_query.from.username || "Аноним";

      console.log('👤 chatId:', chatId, '(тип:', typeof chatId, ')');
      console.log('🛡️ ADMIN_CHAT_IDS:', ADMIN_CHAT_IDS);
      console.log('🔍 Данные кнопки:', data);

      if (ADMIN_CHAT_IDS.includes(chatId)) {
        if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
          const typeMap = {
            'send_all': 'всем',
            'send_military': 'военным',
            'send_civil': 'гражданским'
          };
          const type = data.replace('send_', '');
          adminState.set(chatId, { type });
          console.log('✅ Админ ожидает ввод текста для:', type);
          await sendText(chatId, `📩 Введите текст рассылки для: ${typeMap[data]}\n(Просто отправьте текст в чат)`);
          return res.status(200).json({ ok: true });
        }

        if (data === 'cancel') {
          adminState.delete(chatId);
          await sendText(chatId, '✅ Действие отменено.');
          return res.status(200).json({ ok: true });
        }
      }

      if (data === 'type_military' || data === 'type_civil') {
        const type = data === 'type_military' ? 'military' : 'civil';
        await saveEmployee(chatId, name, type);
        await sendText(chatId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}.`);
        return res.status(200).json({ ok: true });
      }

      console.log('❓ Неизвестная callback_', data);
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('💥 Глобальная ошибка в handler:', err);
    return res.status(200).json({ ok: true });
  }
}

// 📤 Функция отправки сообщения
async function sendText(chatId, text, replyMarkup = null) {
  console.log('📤 Отправка сообщения:', { chatId, text });
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const body = { chat_id: chatId, text, reply_markup: replyMarkup };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const responseText = await response.text();
    console.log('📨 Ответ Telegram:', {
      status: response.status,
      body: responseText
    });

    if (!response.ok) {
      console.error('❌ Ошибка Telegram API:', responseText);
    }
  } catch (err) {
    console.error('💥 Ошибка сети:', err.message);
  }
}
// 💾 Функция сохранения сотрудника
async function saveEmployee(chatId, name, type) {
  if (typeof chatId !== 'number') {
    console.error('❌ chatId не число:', chatId, typeof chatId);
    return;
  }
  if (!name || typeof name !== 'string') {
    name = 'Аноним';
  }
  if (!['military', 'civil'].includes(type)) {
    console.error('❌ Неверный тип:', type);
    return;
  }

  console.log('💾 Сохраняем:', { chat_id: chatId, name, type });

  const { error } = await supabase
    .from('employees')
    .upsert({ chat_id: chatId, name, type }, { onConflict: 'chat_id' });

  if (error) {
    console.error('❌ Supabase ошибка:', error);
  } else {
    console.log('✅ Успешно сохранено');
  }
}

// 📢 Функция рассылки по типу
async function sendBroadcast(text, type) {
  console.log('🚀 Начинаем рассылку для типа:', type);

  const { data, error } = type === 'all'
    ? await supabase.from('employees').select('chat_id')
    : await supabase.from('employees').select('chat_id').eq('type', type);

  if (error) {
    console.error('❌ Ошибка Supabase:', error);
    return { sent: 0 };
  }

  console.log('📦 Найдено получателей:', data?.length || 0);

  let sent = 0;
  for (const { chat_id } of data || []) {
    try {
      console.log('📩 Отправляем сообщение пользователю:', chat_id);
      await sendText(chat_id, text);
      sent++;
    } catch (e) {
      console.error(`Ошибка при отправке для ${chat_id}:`, e.message);
    }
  }

  console.log('✅ Рассылка завершена. Отправлено:', sent);
  return { sent };
}
