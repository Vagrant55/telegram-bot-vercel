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
  "private_key_id": "f185db2532f1a547e1970688f943c79e23d1245c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC034SsIislFzCd\nZGa/18iBlNxUCA8yS1+jX8FT4ceDwxvuPYlBLlyF4WZx9KfVbqJMVhUnrvmv3vhz\nyqkWkPzMQzOHvjF6STnCUHTtLZMTZRhirHzq7FEQgpwOnWukzyL+L8cmRY6EwjEK\nBhYB8ZfRUiao/mHDbzoBSOljpzfhRXuD1adMedMbEY+OHXiUj/0o8XR/SfCVDwj6\n0YD6Z2ycS8aa1yyiMeDgwTR/RIlXyvm2AOYFOPFFwSugtcJm4U9eze0zTYnvGzAw\nliaHoQEcoQcIBPJLXUMiXpt1kc+h75DmPwfgHigI0rn01QzXg/T1rbZBd1E3cxUD\noY4vj89BAgMBAAECggEACCJ7YZCB1z+1QIbo9hza2DUdOaxJHq50JTFjzQV9ByiJ\nw4vB9gwDPkQ2as6hk8BPjVZbyjac5TOGghKtyyWHMRqeoS7FI+ZSMjKTJ62ijT9B\nOwLd9WTeensdUKz0z+s+/Cai8s4zDDZ9pSFD8R9wAAqNUZFrTTJd7fvc/03gfgGi\nBrZ8tWCdgkmr/lTIpYbUzSgyMl0dJHeNp6X9jQbYbbEv+t58R36ZLq7YGkdLGfB0\nW1kLEaDxxY+m+wxkleICvZHtPfFsoueC52Fm8BlW6w2Fz/xFIWimIs2VhiqN3TRs\n9jgAs0Y1NJpdCZuRjKVLYaYtnWHxOn6kMmmDf/666QKBgQDvY7i5L78d26yfPS0m\nqdSQPAZOWnMCB4MwNUevmdPq6CB4YF4kCvZzOubrTmwClzaAoPyM1i7PkulqeV5j\nhaUoJWYnxFHgTVIGcODia5pFvVMIR8T49ZlaPg7u05nXGcufl+6I3XhH1VKej5YW\nLjH8jynLlx7Mvv8VEWWIFnRMPQKBgQDBbF53vjRxVjiTYgZW1zErhqYoIubeb0LK\n5qkGOdlA84/d4Pk3Uc23n1YdJUKKjbj4FCg527PlHjM1FdnxYJjQn+Cv8tr0memp\nsXAEL3UT13im2tHgnBeWxrf06pI4N1d5vWcg4XpdMw9nFzL20QaUTpUA+z6gI4Wd\nRrlyk7lrVQKBgQDcqXVK7mIiqa1TE1cdPoq7cTj23JUKl9Yrh9FOYmNfMx1LGLlu\nS9SknvTgject9Ci/JKXnRD7eA7O4+6sv3a9BdEfX/DTkpyEm4sHItBr+keeJyG4e\ndnUnI/Er4Ez8Y8C4mZm8+zi2LkL7+asFQwu8nFKQYfp4DM6gouqOKPSGmQKBgFX2\nGY3SBHCSRxaJLBQQExQrBVE1IbGddOvD0z6nGvyYwklzoI6LVofS0mylkIsPLTNj\nkfUUxUCASXXAPlnd+kxNoYfQwKqQdJ4r84KIrNmim0ZcXYYbGQizTDIWxeEiB0hd\neqXMT5t4A9JnJwk2IFxtCB+liVGWN92L/wMC0Bb5AoGAFJafzUtun5kpnPRbvwaA\nwZf0ZwskmoLQR3Dam7DNmw6aPkwgBSEqGgwv1R4Z3swTPjzKbQfyiUdxbfUMFl8K\nRel5LsMW3wJ03HEZKQ8NZUytHj+oAP0dUZ4bULcv0M/43rOXZSPgrRmxWb7kWn+g\nGo9AQFuW6NGMTR2Ek37sw5U=\n-----END PRIVATE KEY-----\n",
  "client_email": "id-22-bot@kaf-471314.iam.gserviceaccount.com",
  "client_id": "118228097079633655651",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/id-22-bot%40kaf-471314.iam.gserviceaccount.com",
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
