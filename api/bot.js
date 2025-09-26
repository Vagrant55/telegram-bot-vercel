import { createClient } from '@supabase/supabase-js';

// Проверка подключения к Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Простой тестовый обработчик
export default async function handler(req, res) {
  console.log("=== ТЕСТИРОВАНИЕ ===");
  console.log("Получен запрос:", req.method, req.url);
  console.log("Заголовки:", req.headers);
  
  // Проверка метода
  if (req.method !== 'POST') {
    console.log("Неверный метод запроса");
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      method: req.method,
      expected: 'POST'
    });
  }

  // Проверка тела запроса
  console.log("Тело запроса:", req.body);
  
  if (!req.body) {
    console.log("Тело запроса отсутствует");
    return res.status(400).json({ error: 'No request body' });
  }

  // Проверка подключения к Supabase
  try {
    console.log("Проверка подключения к Supabase...");
    const { data, error } = await supabase.from('employees').select('count').single();
    console.log("Supabase проверка:", { data, error });
    
    if (error) {
      console.error("Ошибка Supabase:", error);
      return res.status(500).json({ 
        error: 'Supabase connection failed',
        details: error.message 
      });
    }
    
    console.log("Supabase подключение успешно");
    
  } catch (supabaseError) {
    console.error("Ошибка при проверке Supabase:", supabaseError);
    return res.status(500).json({ 
      error: 'Supabase test failed',
      details: supabaseError.message 
    });
  }

  // Проверка наличия сообщения
  const { message, callback_query } = req.body;
  
  if (message) {
    console.log("Получено сообщение:", message.text);
    return res.status(200).json({ 
      status: 'success',
      message: 'Message received',
      text: message.text,
      timestamp: new Date().toISOString()
    });
  }
  
  if (callback_query) {
    console.log("Получен callback:", callback_query.data);
    return res.status(200).json({ 
      status: 'success',
      message: 'Callback received',
      data: callback_query.data,
      timestamp: new Date().toISOString()
    });
  }

  // Если нет сообщений
  console.log("Нет сообщений или callback");
  return res.status(200).json({ 
    status: 'ready',
    message: 'Bot is ready',
    timestamp: new Date().toISOString()
  });
}
```

## Как использовать тестовый код:

1. **Замените содержимое `api/bot.js`** на этот тестовый код.

2. **Обновите `vercel.json`** (если нужно):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/test.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/test.js"
    }
  ]
}
