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
  const SPREADSHEET_ID = "1O-UibvEGDG_JFVF2FLC49YiAjlzIMduFSBZ7hNRQwmcrdo6JufnXi8ys";

  // 🧑‍💼 Сервисный аккаунт Google
  const SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "kaf-471314",
    "private_key_id": "99c0a4247c816ee5568a2f87cb0fad89220c583c",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDvA+FXKwKxncK0\naLmzGZQUiq+ewWRLENH9EL+4nValg+hNjpnll0g4tMmrYb5OT7ePI6APQ2DF36yD\nPqg3xksFRYPeupOEvX8jhUwy44jhw7tY38f86QYhQ8S802JnNKwt/5JrMwnhWHgo\nNZPUauFYz/YMEW4tTVMvnPQIKBVtiEN6WnyJH9CzgnvsCE2b6RAqWg0Bz9zKizWF\n3worroomd10ed/j0+pbIuT8yanjqZJki5zzBt73c/ANGHwz9Ee6DWcEP5EyXyFGB\ngACBq1FrBeH13R8oktwBMksbswTEr89fxjRlGG8i3tz8RuN11O7uvD+6LANWLoo2\niiPI6mtrAgMBAAECggEAK2ezfO55I0NIkBWyn4VGIILdCMILEhzAXao0fvTHvvAY\n+Dis1wZlnbKrKv3pnvQYHBz2nL76LIUFoaH3z4Upq4/ntkOAtarqE0vKPjWW7pTq\niWW+Pj4dGF5jtHzY0nA80m+mqeQPZ8Z2r6qnKXytZsEBaEikDwMLV8qzgGWzGnw6\nFFVBQVNyc7fMU9Jabmbd1yyWwA3hlb2e2as/b42QyUA/g/pD1xDK8a2y+8GqQnuC\ncjth1EhS0H6JouyJ8u+Ynb6LPZrSVzA85tu87iqU+wbRKFQi2H8tdamO0B7Bo/cj\nZCrwgv+6Ccx9jINmJvEgWypbwpy99tuZWShqqXlC/QKBgQD8Z9LbZhvZ/mV9YoVt\nKUMtaduhr5G/p8X3YyAsGMxBDgIliPTRGgCc0GkmlOqtHv4WpHlodhEkbcMPztS5\ne36+ra8q+WSSTEcfXXCvO8tTFN3wMigxRxFxuo3COyYcoECWu8o/HrQVcNajuKZ2\n9YHyOHzXFMsQ0rdPbDNMcFOxxwKBgQDyaz17oe4ljW7RI1BYNZ42Vqfp1uFsuEVE\nhJeLjir4jkGOLZILYUKHc7DHlqJk9pumxp6yzRKQ8SU5QXKCaLVi71A+u6aLImBF\n5Ue7UZu9TI5kXbYWRgrSP1m5SsaJdjWGJ9fvmQGhQiBULEdei3XWaEJK7kPSPx3f\nhLS8Wn55PQKBgQC/5aeYCp+uMw2yME9E2RQr2MmUucjTr5iBJyn0nL3dz+qt4txO\nhbhlgMYRATMSf/ep+04ar3kE+zZMNHHiuxN3oNEGmSlvWPLR09ayQ4GoHrtFvLx2\nCpQmpTDVtOaa6PNyJj/zkUJU8r8dJmvZEXrET1IKq9JfbfTUO20c9mGLTQKBgQC7\nn1qXrI2oDN3/CejuTJlmDw2ow4H3ZmteC41LGr6RX3DHfOey3RTjxxvEbgbEQ8XW\nf5VmZ6f9/FXGCax52FbC+tvNoejVeMawcjNhfFkgWvc+IPWEKbPIY/WqnoAo9g+Z\nBI9xRqfnSknBPAAE4cVTK6BbZCujtuwFCi3kNdn7NQKBgQC8NXq4OLTbJx5WVitk\n5T/BvTsQ6BEuRnWjPod7yzkpFlxnO74WgVjONDusvgEi1B69oGwB6QS0WipmOHim\nJbjxFE5enpb7lSdK0yAJF6O9QZ+JARkKYYnTJ0EabIiBzf03yHOMXHtRjyFMZyt+\nkNApPNjtnhxd7FvQzmcnbv/Sfg==\n-----END PRIVATE KEY-----\n",
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
      const url = `https://api.telegram.org/bot8391873182:AAHUykid30Fssju6OfnUtwv6uCc9ZFdazh/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
      await fetch(url, { method: 'GET' });
      sent++;
    } catch (e) {
      failed++;
    }
  }

  return { sent, failed };
}
