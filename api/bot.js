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
  const SPREADSHEET_ID = "1utCG8rmf449THR5g6SHvSK4pp6-nj7UEgSgP4H1_isy";

  // 🧑‍💼 Сервисный аккаунт Google — замените содержимое на своё
  const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "kaf-471314",
  "private_key_id": "40fef549044c98083d668d6c08a2847381f94ba4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDtExmYtJO7OAJ3\nJgcZNOQ1Rt7U+VOTB0XaQLcYfk6yg4XIuk2HK8ABCAv4kmEaSSo3gYItEd/1oTmJ\n4t8N3pa+NTqHPhuWvCp6foS+qiUOGjbNYHY0GHJ1H9je1xOOSUPG5Tb/2MLrC16g\nTe1pnCTC9XTzOVpEUUb+IllrQKY5fe/y/fRQcclwO15PG8svcK1nLa0o56hy9jby\nfl8r7sajxJ+zkpEEFrBi7XRzdJhGu7Pagl4VEUtHKqSRX8uvj8kYST1DxpbGScxp\n2MBQqj8RVUNAClhriGApy6CxEeIMji7ZLNafKrG5AZa6HIVEhoqr6E6Au94TWM6t\nf3kZCkDFAgMBAAECggEAHyJawnP2kcf/hOPE22HXlYqW4YvT1rOGEC1fDlOqJKYC\nqBOVcmrDtq72mYCpyXCx32O984rNKX4wpwPZLMJedCDb7J5ys5dHEdqzNrH0F1fI\neizQoTNTtr+FtPA0dIN5J/H6yNtP79vIo89QHkZACq1/HCEcUmwFIYNj0GLHYbXA\nVB5+iyvKV4YdwPn85KFYrXpOaK9btAq9X/UKuG3xssTw7ixXmA+zu50uRHkM9O7k\nG7ZvGKSxUvKqfPcCGt55IPSvL3XveO5IE+oXjAvdEg+9MtiMSFA2V8iObZE+O0g/\nyjX/PjxSh+rPMnaKQPodV6CcLCsZFjp+DvlHmOH6qQKBgQD+IFiqU2VvsGxUPqcG\nfF6ZWkzPhR4MEAauc/kcx7nWNmaAW5k0YW/Yqe/5JmEw05XbkrWxboTgo7srZ4md\n2JWnm6m5Z9Jt/FLs8TVN0EUcKetNNl68W26JwiLV2VEh+aAOneIeAg7Fq5XubnZb\nWMcGA/PR2y6VhNNMFbcouZfSyQKBgQDu0pGym8C36OL3j4m8ANY9KXDNA1rVEwHu\nsGdkF6P+DRT1/Q+BfbzpVisARmGgL+iMaFppJODBxQJnUgz+z4BlTjK4yrxanUBc\n51kvUgTs801mJe9NqV1vC1gXIBITne6udEXlg0/CE411Soi31Ffq3U1vZRS5F1tc\nlLlA/2xgHQKBgF0l0hosk2PLEQoYJPTVpX8kgD8YlhjpzuknDUqlUtLYAd5OtOtk\nQ7DxKUrz7HAPPkDLl9m/nukQWszgGKtI9iIHhsC084bpFCRRja5GBu751ovov/Te\ntre79zTXgUuoyihRas6BBpUh/cT1rGBzPBBSZo6nfn3DwAeFditxS9sxAoGAEsvT\n18DWbCMSKfXMG1XdhrbKP/hxn699SXHs0T3jFE2nRq0CGWjyA1Na0wy3Bkp+/P4B\nj6DtZ5K/263jg/KE4nRDHbQnGuKhfC5hII5OAPAtOUrnCK+5wNGdv0Qw6AZYELbq\nAWRSVK4BRif1lrJJsRx1ybyk4uRptmGmKu1vdCkCgYBhJ1A97eJogAyaTKg3i/0T\nSV9VgRUYejtV53DT1wvHFZOfdnM+cjq/ZjFrqx6U4TEPx52ujn3o5yPtbzfDDvha\nsawDR+W8i1ly05nvN7jMjnbWGPAcxpMmQUKZEbFMX6vfkrLju9U19obhzKSC2dLw\n6JlSfTJ/NRdiG8PVvPnO6Q==\n-----END PRIVATE KEY-----\n",
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
