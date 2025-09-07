import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, callback_query } = req.body;
  const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
  const ADMIN_CHAT_IDS = [935264202, 123456789]; // ← ДОБАВЬТЕ СЮДА chat_id ДРУГИХ АДМИНОВ
  const SPREADSHEET_ID = "ВАШ_SPREADSHEET_ID"; // ← ЗАМЕНИТЕ!

  // Сервисный аккаунт (вставьте содержимое вашего JSON-файла)
  const SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "ваш-project-id",
    "private_key_id": "ваш-private-key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\nваш-ключ\n-----END PRIVATE KEY-----\n",
    "client_email": "ваш-email@project-id.iam.gserviceaccount.com",
    "client_id": "ваш-client-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/ваш-email%40project-id.iam.gserviceaccount.com"
  };

  // Функция отправки сообщения
  const sendText = async (toChatId, msg, replyMarkup = null) => {
    let url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${toChatId}&text=${encodeURIComponent(msg)}`;
    if (replyMarkup) {
      url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
    }
    await fetch(url, { method: 'GET' });
  };

  // Функция редактирования сообщения
  const editMessage = async (chatId, messageId, text, replyMarkup = null) => {
    let url = `https://api.telegram.org/bot${TOKEN}/editMessageText?chat_id=${chatId}&message_id=${messageId}&text=${encodeURIComponent(text)}`;
    if (replyMarkup) {
      url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
    }
    await fetch(url, { method: 'GET' });
  };

  // Обработка callback_query (нажатия кнопок)
  if (callback_query) {
    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;
    const data = callback_query.data;

    // Выбор типа сотрудником
    if (data === 'type_military' || data === 'type_civil') {
      const type = data === 'type_military' ? 'military' : 'civil';
      await saveEmployee(chatId, callback_query.from.first_name || "Аноним", type, SERVICE_ACCOUNT, SPREADSHEET_ID);
      await editMessage(chatId, messageId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}. Вы подписаны на уведомления.`);
      await sendText(ADMIN_CHAT_IDS[0], `📥 Новый сотрудник: ${callback_query.from.first_name} (${chatId}) — тип: ${type}`);
      return res.status(200).json({ ok: true });
    }

    // Выбор типа рассылки админом
    if (ADMIN_CHAT_IDS.includes(chatId)) {
      if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
        await editMessage(chatId, messageId, `📩 Введите текст рассылки для: ${data === 'send_all' ? 'ВСЕХ' : data === 'send_military' ? 'ВОЕННЫХ' : 'ГРАЖДАНСКИХ'}\n(Отправьте текст в чат)`);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  }

  // Обработка текстовых сообщений
  if (!message || !message.text) return res.status(200).json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text;
  const firstName = message.from.first_name || "Аноним";

  // Команда /start — показать кнопки выбора типа
  if (text === "/start") {
    const keyboard = {
      inline_keyboard: [
        [{ text: "🎖️ Военный", callback_data: "type_military" }],
        [{ text: "👔 Гражданский", callback_ "type_civil" }]
      ]
    };
    await sendText(chatId, "👋 Привет! Пожалуйста, выберите ваш тип:", keyboard);
    return res.status(200).json({ ok: true });
  }

  // Команда /menu — показать кнопки админу
  if (ADMIN_CHAT_IDS.includes(chatId) && text === "/menu") {
    const keyboard = {
      inline_keyboard: [
        [{ text: "📤 Отправить ВСЕМ", callback_ "send_all" }],
        [{ text: "🎖️ Только военным", callback_ "send_military" }],
        [{ text: "👔 Только гражданским", callback_ "send_civil" }]
      ]
    };
    await sendText(chatId, "👇 Выберите тип рассылки:", keyboard);
    return res.status(200).json({ ok: true });
  }

  // Если админ отправил текст после выбора кнопки — делаем рассылку (заглушка)
  if (ADMIN_CHAT_IDS.includes(chatId)) {
    await sendText(chatId, "ℹ️ Пожалуйста, используйте /menu для выбора типа рассылки.");
    return res.status(200).json({ ok: true });
  }

  res.status(200).json({ ok: true });
}

// Сохранить сотрудника в таблицу
async function saveEmployee(chatId, name, type, serviceAccount, spreadsheetId) {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  await auth.authorize();

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:A',
  });

  const values = response.data.values || [];

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] == chatId) {
      // Обновляем тип, если сотрудник уже есть
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `C${i + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[type]]
        }
      });
      return;
    }
  }

  // Добавляем нового сотрудника
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:C',
    valueInputOption: 'RAW',
    resource: {
      values: [[chatId, name, type]]
    }
  });
}
