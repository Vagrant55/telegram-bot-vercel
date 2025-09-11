import { google } from 'googleapis';
// 🧠 Простой in-memory кэш для хранения состояния админов
const adminState = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, callback_query } = req.body;

  // 🔑 Настройки — замените на свои
  const TOKEN = "8391873182:AAHUykid30Fssju6OfnUtwv6uCc9ZFdazh";
  const ADMIN_CHAT_IDS = [935264202]; // ← Добавьте chat_id админов
  const SPREADSHEET_ID = "1utCG8rmf449THR5g6SHvSK4pp6-nj7UEgSgP4H1_isc";

  // 🧑‍💼 Сервисный аккаунт Google
  const SERVICE_ACCOUNT = {
     "type": "service_account",
    "project_id": "kaf-471314",
    "private_key_id": "fee4a054ff0530753a9edf44c260d7263c9ad39a",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvjndpL3Y4uGCS\nTbRQ7l87Nz32u8nx9yJd2bSomdQTVXmB1oQg9n4dr5Xd22PCHQUBTAw/wTznIpeb\n3+PR+q/QLe/+SWtro3flhCDhqv8Thoaie8Q1Z2G8TD9/FJEQbzgDrGB8EuhHbqL/\nsbAShffmAfTlPP15A6ro5Bc6pNt76BI7xhvnnYOYF7HeXtZ/QUJX71b0Zgn19DEm\n4AvfrGT2vBXXtkFGPIVmuu0HoVb9inmBC+FP9bCrHg5tyakm/d7v8lLv20Lq83jb\ngkjfgJD7LCM+Yxyt6gQCthdgF4HHA4eYMCMaFUlPd1ywi/OuacfyQp9MUObIJGH/\nbKrWkYTxAgMBAAECggEABsQCHbhzuTsAVEUYu9V677GY4oxRS6EdRsIGDokaoWnd\n8Fs5vXo4aSkYGMwsoZmMFMUnM/IM2IDGmF4SFeigC9EoZouyb0wWCd8sI/xKvyg0\nIjkMOk1nGKpU2F882bX6kfgrwf5Zy65zq1BgD2+wqoFk7Gx7vYUe2iG3tDWwJHvQ\nKYLBMEHfdOtEVEcdn9KyoX01mYLMmWrLsrmMc/LPBnWwXZmFIMx0xNfY/9UfKS33\nf26xLpQAysF4Bcn6Un+J92ZqMaTDsA8O+yBBUzeh6P8WxPoyzut1gi3iBVEUqRDm\n2rL29bvUWgLinkwQv7/+oczGMDMn9WsF7JE/s3LlwQKBgQD2O/+ZkdfhlZ/KhotH\niU9wGtwJkrPvlzEAPhA5nry1hhnAg6VfznBUrUp1O1+2LMg3mTjimfboSN27e2RP\nOvCSqvEHEtMRNslg5tiEY/XnOgirgdvM2mZ074s+g1pMHEEFOK8kT9rrGJKTVSHP\nK5OVRE5k4Me5ucxuX6WCiuVjMQKBgQC2hOFa8x/6h4eLdP92g6FVpmWT0O8t6rE2\nrA9zOvYWE4iZgDGfLcjgbKX+sbUIKg/PeCVWUhZwEwNcPUfjlQL+n1cZeDj1V/qt\n2KbOx5PZNXdxEL3jyPiKTafqfBibDhdZHcJxsQE2UHZ1EleByTY8BnswNFlmq7x4\nknAogoxNwQKBgBjODn+f64l0EzbJuvon4PLAIe5s8udt6afGmMfVL9lxeuKj4GL4\nXuSI2Hla09d8R2ciblKVhAP+Yyfh1EcO/vEne0RlJxIS3NKALsuXbkwu0nTEjini\nznN1NifD/7KvHfWysiIMUVdhkFJ7Pv6puyJMUUFkS3pwNyHfTMMLzvPhAoGBAK7E\nuo0+NKbOU+ojk+LF1ByRgr5x2DTdf+dcBkdOdAlblvd1Gw7S5oCPSLuDKlew/wao\ngwgO/lE+w371Zvry2rU5mktXJSM4pV8GD2P9EwNwAPkREOMms2arSVhsj5sZeR3q\nMyBuXzzE+0jK0WQDaZ08j4Tu+5QmaggCIMeJihOBAoGBAOOeh5JLwumVz57naKg6\nK/PeaUVNmFmQ5PvhjLSWBv3q8B9/yW7C3njd7ArJkOjp9WEXn6trQEHdeqDdzhh1\ngP+pX5WUl9VPf/Xu32RFEe/5HmqE3hXKGKgnWUzsz9Bo65Qtm7r1z9dKWnw7VgJQ\nhZskcUXSjPR/kxIJopnFh3cA\n-----END PRIVATE KEY-----\n",
    "client_email": "telegram-bot-service-account@kaf-471314.iam.gserviceaccount.com",
    "client_id": "102899225308073479135",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/telegram-bot-service-account%40kaf-471314.iam.gserviceaccount.com",
   "universe_domain": "googleapis.com"
  };

  // 📤 Функция отправки сообщения
  const sendText = async (toChatId, msg, replyMarkup = null) => {
    let url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${toChatId}&text=${encodeURIComponent(msg)}`;
    if (replyMarkup) {
      url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
    }
    await fetch(url, { method: 'GET' });
  };

  // ✏️ Функция редактирования сообщения
  const editMessage = async (chatId, messageId, text, replyMarkup = null) => {
    let url = `https://api.telegram.org/bot${TOKEN}/editMessageText?chat_id=${chatId}&message_id=${messageId}&text=${encodeURIComponent(text)}`;
    if (replyMarkup) {
      url += `&reply_markup=${encodeURIComponent(JSON.stringify(replyMarkup))}`;
    }
    await fetch(url, { method: 'GET' });
  };

  // 📥 Обработка текстовых сообщений
  if (message && message.text) {
    const chatId = message.chat.id;
    const text = message.text;

    // Если админ вводит текст после выбора кнопки
    if (ADMIN_CHAT_IDS.includes(chatId) && adminState.has(chatId)) {
      const { type } = adminState.get(chatId);
      adminState.delete(chatId); // Сбрасываем состояние

      const result = await sendBroadcast(text, type, SERVICE_ACCOUNT, SPREADSHEET_ID);
      await sendText(chatId, `✅ Рассылка отправлена!\n📤 Получателей: ${result.sent}\n❌ Ошибок: ${result.failed}`);
      return res.status(200).json({ ok: true });
    }

    // Команда /start — для сотрудников
    if (text === "/start") {
      const keyboard = {
        inline_keyboard: [
          [{ text: "🎖️ Военный", callback_ "type_military" }],
          [{ text: "👔 Гражданский", callback_ "type_civil" }]
        ]
      };
      await sendText(chatId, "👋 Привет! Пожалуйста, выберите ваш тип:", keyboard);
      return res.status(200).json({ ok: true });
    }

    // Команда /menu — для админов
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
  }

  // 🎯 Обработка нажатий кнопок
  if (callback_query) {
    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;
    const data = callback_query.data;

    // 👉 Сотрудник выбирает тип
    if (data === 'type_military' || data === 'type_civil') {
      const type = data === 'type_military' ? 'military' : 'civil';
      const name = callback_query.from.first_name || "Аноним";
      await saveEmployee(chatId, name, type, SERVICE_ACCOUNT, SPREADSHEET_ID);
      await editMessage(chatId, messageId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}. Вы подписаны на уведомления.`);
      await sendText(ADMIN_CHAT_IDS[0], `📥 Новый сотрудник: ${name} (${chatId}) — тип: ${type}`);
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
        await editMessage(chatId, messageId, `📩 Введите текст рассылки для: ${typeMap[data]}\n(Просто отправьте текст в чат)`);
        return res.status(200).json({ ok: true });
      }
    }
  }

  res.status(200).json({ ok: true });
}

// 💾 Сохранить сотрудника
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

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:C',
    valueInputOption: 'RAW',
    resource: {
      values: [[chatId, name, type]]
    }
  });
}

// 📢 Рассылка по типу
async function sendBroadcast(text, type, serviceAccount, spreadsheetId) {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  await auth.authorize();

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:C',
  });

  const rows = response.data.values || [];
  let sent = 0, failed = 0;

  for (let row of rows) {
    const chatId = row[0];
    const userType = row[2];

    if (!chatId || chatId === 'chat_id') continue;
    if (type !== 'all' && userType !== type) continue;

    try {
      const url = `https://api.telegram.org/bot8391873182:AAHUykid30Fssju6OfnUtwv6uCc9ZFdazh/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
      await fetch(url, { method: 'GET' });
      sent++;
    } catch (e) {
      failed++;
    }
  }

  return { sent, failed };
}
