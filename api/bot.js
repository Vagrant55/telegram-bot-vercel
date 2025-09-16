import { google } from 'googleapis';

// 🧠 Простой in-memory кэш для хранения состояния админов
const adminState = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, callback_query } = req.body;

  // 🔑 Настройки — замените на свои
  const TOKEN = "7991590846:AAHp6H7VW_dPhH3tf_zAjTj8aQSCYZcm6iU";
  const ADMIN_CHAT_IDS = [935264202]; // ← Добавьте chat_id админов через запятую
  const SPREADSHEET_ID = "1O-UibvEGDG_JFVF2FLC49YiAjlzIMduFSBZ7hNRQwmcrdo6JufnXi8y";

  // 🧑‍💼 Сервисный аккаунт Google — замените содержимое на своё
  const SERVICE_ACCOUNT = {
   "type": "service_account",
  "project_id": "kaf-471314",
  "private_key_id": "e8fb161bb4b4b6b8f7cf80f4ff6387aed0a6c49b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDqUo/O5QpFukxg\nNkQA51lsYc12NijZjeRx9HC1O6ti66MrbTtHS/ZHb0R+lfezKxVYTvMJbgQz4zYa\nFRSK4lRsH3CSuWn9w8CSLcpciZaOzL7SwEHij3xn8r6mgISFWMc3yOqezmshGXLw\nna13WUmTMVyW8zhuCGHrT1O5w21LS5UjrKyn8xqilm33TKSLGTno2BCNpxvrt7iw\nWAJot5tULsKpzaVvl61BBVcH36B5rViwaHjXvctHxHl2MVV1YvnDQzVDl8gUwfYE\nwUtLf55KoEW70bcxn3jqXvopzC7hP0LHSRIXjx3QQfK8+yHk1OaHDHFY7uvbLCJr\n/0M/yk8/AgMBAAECggEAXjJBaFkPp5csQ9McxEY8XwL0DwzXoBlX1+19b4WksJfs\nWLVJCrDBONdEcCTGVgrAQmc+cTB+VQOGSLbnsqsoZ+y9muYZcy+BluH8gvW2hgJN\nxbgO5E5tIvZk6NcqLtbRAx5sHtn5G+24lHy2co98scS6pV3x9d29y1Pw4vDqW0Uq\nhwLwrtpyYIHU0+mKztdejD2PbHkMX6+RoTJyVGlGwraAcLA4atfCIkHzLZjZIv4E\njyumygfHV83SANv8wqTfx3ab2lYg1JWdgx/2iTB4JKwPZoIQJ0F11Yol4uiWRAc7\nT0QyrlgBqW/VrMav4rm9s3sLePtlxC4DbPUx9vLP0QKBgQD+luiUI9v/Q7Mg1wgY\nEsPZ0oo6hYzvwWCVFQqDLjFQfI757LqcGivxR7EtSF5te9jvKeUtdLEBmG807Wek\njDbVFBaxJnL2iskeQlSTGniylg71YYEsSwt1RbtmfYwlg9hGMji0M+cr5osiOORr\nAwTuehjxVhKUjCPhzd/ND2YbkQKBgQDrnuhzPHW9I+TPG77pwnBOol+886D0PdpN\nJPVRzYmPeocRQAO+5VBSoGmKiffsqAbgiax4hU/BBDls6WUH+93flUxseQw0IrWu\nwFN33j9jVI+4NmzVB2B9IpicpV7pJtsT3ASB9CEivdd95pT2GNkw7VRem87Z9VJo\nKo/b+7U1zwKBgAadl0eaMvJMKRB2ZgByJGK5pNvmcoYcaU0WceJ8xc1In1KBQ0wh\nJfksGr+JfOKtcDKuzQTEXoEjG+itLp9JAXfCAODzldMwQg+mO5pi+rXxTkw0D24+\nOPsAJ+F+67Bh37HbRjvwiVZLtFvcTJs3Rd6Ij7NdwDfZ+Gi6t9EVUFrxAoGAK5iF\nbfz70/k2NtPtaRce7I3CpRV27HodUDTMZ0xebXvATgLILqQDTqZ7oLSSeOlGDHms\nvcf8z7vWXD57ARUrIllfgJqNFYBumVzglMc8d0aIKQ9455mr0rt5/VHj08PquSv2\ncY0YLHNv0c2+NiK23QSsnay6gz2O99MYNx3Fk6UCgYEAsxnlQ+IYuJVu56W2iUTo\ndmUZEzi5lrvyMSv0jHNUZIeZq85J0pvokCQI9LEgSEURNtYSiBGcav9gkCRAZb60\ns5v/fXo6UypjTbrWk8ADjgyLMrYttWajRu4gcOBDLHDza60fmQxHwgPKwAu09WB+\n+Pj4ZVKGbYglKYH5W9GKung=\n-----END PRIVATE KEY-----\n",
  "client_email": "kaf-471314@appspot.gserviceaccount.com",
  "client_id": "102306985385816454633",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/kaf-471314%40appspot.gserviceaccount.com",
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
      const url = `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
      await fetch(url, { method: 'GET' });
      sent++;
    } catch (e) {
      failed++;
    }
  }

  return { sent, failed };
}
