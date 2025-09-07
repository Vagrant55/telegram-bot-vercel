import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, callback_query } = req.body;
  const TOKEN = "8391873182:AAHUykid30Fssju6OfnUtwv6uCc9ZFdazh";
  const ADMIN_CHAT_IDS = [935264202, 123456789]; // ← ДОБАВЬТЕ СЮДА chat_id ДРУГИХ АДМИНОВ
  const SPREADSHEET_ID = "1utCG8rmf449THR5g6SHvSK4pp6-nj7UEgSgP4H1_isc"; // ← ЗАМЕНИТЕ!

  // Сервисный аккаунт (вставьте содержимое вашего JSON-файла)
  const SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "kaf-471314",
    "private_key_id": "3c299aa0f6f13fede6e9e2784f593b11fba691e8",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDB5ghtHC2zjWYO\n/w9Y/dbmZVlkzVAEGQFLxNJxFfJuNiqewnou5AyTbTV6i9dMySJMMXqv3aC4YhAc\nlDikJPuQYiCNp4uXKmrd7G6YaR+tf82y+LCR1/ClDKplVxRGJQkhx2C8VOngr2WU\nrhu7LOiQJD2GPcEHkVqBo+mmoY/grPrRxihdUVfCmHuk8TOtX4hozmt1tXl4+5L5\nlTrTaxmKyg0/TXr8Pw0ZgMMioSF2e43u33OgK36gRNsTMBJ7ZHwDQn6fA4R4C51c\n56UfcpK8VI6GKSeuXsay20smM3DTsXb6/r3c8bh92sqlufhT0data5+AIlVPow+F\nppWhHaFTAgMBAAECggEAC6y4ESnDLq5y2LBO0kLmb5TmnwUlrjl7NH6zVQ/HOw+T\n3V9EUBJ3F2FZ+Pj2i68Im6HXC0PC65cr9SyPhIKdiwH9h8nww7dQG/CicBbUS3QI\nhKAosX9ZA/cRQ2zM0bRlKl2A25YZRugIq70X+lsn3ZXxBmYtezErS+b8qIXNze9B\nVUxAmOC0ggBy3YO8ZU8sB5dse3KnPSaBSt3FCKsiUMNXEfbDVq221Rf0nXh+8rR2\n7/MnQEIItx6bz9oaaK7smNDN8OQMDbsjJRin9pctgCA2NF2W4qiCYWRMJOdf387t\nF5DQf8WROdv2xsvhj+UOAOIMw4RcjxFB2IizMNAdMQKBgQD9d+Jk8/ZzTrhtKdwC\nJJZ+K352skngHq4SGv/GhhcZMhIk0UORlGJocvdM23mDwBaC4nCmnYsM7+PXWood\n4yd0K5KmZfFUMBLer4Ydorh+YX79VBOXcyXfZZT7t5ZDnOdnC9L3zrMr8feYmiml\njn4dFoYdP5DjhvFkpNx6WjcjpwKBgQDD1dRUZou4CB6KZWAQ5hrTkITCn2fKq82r\nVstv/ejDPX4t5GIO8K57ufLW2bO4fkAWT2D4IEGpiX9Q5MTy/JRmcsdpC6ijpQ5b\nRbjpwhHqXEe6KOKeniHevqI0XaXRysi00RMd3Aaw6gKN3CloMcJo41EYiGCnJiCL\nwFDvtkW6dQKBgBiBPqID9A+xzKLBKUQLxYDtM4zGL947GRknAxNuY01MSfTFRoMM\nlXcDpmUH0vep2oNM4Rc6o/bcOmrXlgLNs0LH86WitXIuM6TT02OKF8wgIObc+gfq\nWf7/EyhC14Qx5y1PN1Y95ZSaEBXw0ZXv8MFfLBgnzRoyMaRJTAeIMUyBAoGBAJ+M\nCRXOCcygCMm198MsxPRSTGcHWZcby07pQor2MPlHkxIue9kyKuUwRHDYInyPlwTW\nHOlp1jUaiThNeUuBjiG9J0skrXrNUVn4/sKrUs896U34W1DhAjUn2JyTIzI9ZLEz\nmMB97pGZxQTwNmfmCj5L3FkBWsUy4dcZkpcJR9u1AoGAaR9gr+bomHvJwl2BjEcT\nFZypxg6CV7vCPxRtFQBPEbNH5RIjdNLISIM6k4Dj9h/TXuRaLynFKA1pJSfDfSe3\nfg/zSPuZHBuBF0qyUBFliQfLZP2jCL+ToxErlMZx4gthz6ani72J73Rl1VDMyDS2\np7cFx/YUQXA672LNzFSsN0I=\n-----END PRIVATE KEY-----\n",
    "client_email": "telegram-bot-service-account@kaf-471314.iam.gserviceaccount.com",
    "client_id": "102899225308073479135",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/telegram-bot-service-account%40kaf-471314.iam.gserviceaccount.com"
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
