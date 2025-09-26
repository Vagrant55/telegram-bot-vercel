import { createClient } from '@supabase/supabase-js';

// 🧠 Простой  in-memory кэш   для хранения состояния админов
const adminState = new Map();

// 🔑 Настройки — замените на свои
const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU"; // ← Замените на токен из @BotFather
const ADMIN_CHAT_IDS = [935264202, 1527919229]; // ← Замените на ваш chat_id

// 🧑‍💼 Подключение к Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🚀 Главная функция обработки запросов
export default async function handler(req, res) {
  // Разрешаем только POST-запросы (Telegram отправляет POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Получаем данные из запроса
  const { message, callback_query } = req.body;

  // Если нет сообщения — выходим
  if (!message && !callback_query) return res.status(200).json({ ok: true });

  // Обработка текстовых сообщений
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text;

    // Если админ вводит текст после выбора кнопки
    if (ADMIN_CHAT_IDS.includes(chatId) && adminState.has(chatId)) {
      const { type } = adminState.get(chatId);
      adminState.delete(chatId); // Сбрасываем состояние

      const result = await sendBroadcast(text, type);
      await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}`);
      return res.status(200).json({ ok: true });
    }

    // Команда /start — показываем кнопки выбора типа
    if (text === "/start") {
      const keyboard = {
        inline_keyboard: [
          [{ text: "🎖️ Военный", callback_data : "type_military" }],
          [{ text: "👔 Гражданский", callback_data : "type_civil" }]
        ]
      };
      await sendText(chatId, "👋 Привет! Пожалуйста, выберите ваш тип:", keyboard);
      return res.status(200).json({ ok: true });
    }

    // Команда /menu — для админов
    if (ADMIN_CHAT_IDS.includes(chatId) && text === "/menu") {
      const keyboard = {
        inline_keyboard: [
          [{ text: "📤 Отправить ВСЕМ", callback_data : "send_all" }],
          [{ text: "🎖️ Только военным", callback_data : "send_military" }],
          [{ text: "👔 Только гражданским", callback_data : "send_civil" }]
        ]
      };
      await sendText(chatId, "👇 Выберите тип рассылки:", keyboard);
      return res.status(200).json({ ok: true });
    }
  }

  // Обработка нажатий кнопок
  if (callback_query) {
    const chatId = callback_query.message.chat.id;
    const data = callback_query.data;
    const name = callback_query.from.first_name || "Аноним";

    // 👉 Сотрудник выбирает тип
    if (data === 'type_military' || data === 'type_civil') {
      const type = data === 'type_military' ? 'military' : 'civil';
      await saveEmployee(chatId, name, type); // Сохраняем в таблицу
      await sendText(chatId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}.`);
      return res.status(200).json({ ok: true });
    }

    // 👉 Админ выбирает тип рассылки
    if (ADMIN_CHAT_IDS.includes(chatId)) {
      if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
        const typeMap = {
          'send_all': 'всем',
          'send_military': 'военным',
          'send_civil': 'гражданским'
        };
        adminState.set(chatId, { type: data.replace('send_', '') });
        await sendText(chatId, `📩 Введите текст рассылки для: ${typeMap[data]}\n(Просто отправьте текст в чат)`);
        return res.status(200).json({ ok: true });
      }
    }
  }

  res.status(200).json({ ok: true });
}

// 📤 Функция отправки сообщения
async function sendText(chatId, text, replyMarkup = null) {
  let url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
  if (replyMarkup) {
    url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
  }
  await fetch(url, { method: 'GET' });
}

// 💾 Функция сохранения сотрудника
async function saveEmployee(chatId, name, type) {
  // 🔎 Валидация входных данных
  if (typeof chatId !== 'number') {
    console.error('❌ chatId не число:', chatId, typeof chatId);
    return;
  }
  if (!name || typeof name !== 'string') {
    name = 'Аноним'; // или пропустить, но лучше задать значение
  }
  if (!['military', 'civil'].includes(type)) {
    console.error('❌ Неверный тип:', type);
    return;
  }

  console.log('💾 Сохраняем:', { chat_id: chatId, name, type });

  const { error } = await supabase
    .from('employees')
    .upsert(
      { chat_id: chatId, name, type },
      { onConflict: 'chat_id' }
    );

  if (error) {
    console.error('❌ Supabase ошибка:', error);
  } else {
    console.log('✅ Успешно сохранено');
  }
}

// 📢 Функция рассылки по типу
async function sendBroadcast(text, type) {
  const { data, error } = type === 'all'
    ? await supabase.from('employees').select('chat_id')
    : await supabase.from('employees').select('chat_id').eq('type', type);

  if (error) {
    console.error('Ошибка Supabase:', error);
    return { sent: 0 };
  }

  let sent = 0;
  for (const { chat_id } of data || []) {
    try {
      await sendText(chat_id, text);
      sent++;
    } catch (e) {
      console.error(`Ошибка при отправке: ${e.message}`);
    }
  }

  return { sent };
}
