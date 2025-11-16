import { createClient } from '@supabase/supabase-js';
      // Команда /menu
      if (ADMIN_CHAT_IDS.includes(chatId) && text === "/menu") {
        const keyboard = {
          inline_keyboard: [
            [{ text: "📤 Отправить ВСЕМ", callback_data: "send_all" }],
            [{ text: "🎖️ Только военным", callback_ "send_military" }],
            [{ text: "👔 Только гражданским", callback_ "send_civil" }]
          ]
        };
        await sendText(chatId, "👇 Выберите тип рассылки:", keyboard);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    // 🖱️ Обработка кнопок
    if (callback_query) {
      if (!callback_query.message?.chat) {
        return res.status(200).json({ ok: true });
      }

      const chatId = Number(callback_query.message.chat.id);
      const data = callback_query.data;
      const name = callback_query.from.first_name || callback_query.from.username || "Аноним";

      console.log('🖱️ Callback:', { chatId, data });

      // Админ выбирает тип рассылки
      if (ADMIN_CHAT_IDS.includes(chatId)) {
        if (data === 'send_all' || data === 'send_military' || data === 'send_civil') {
          const type = data.replace('send_', '');
          const typeMap = { all: 'всем', military: 'военным', civil: 'гражданским' };
          await setAdminSession(chatId, type);
          await sendText(chatId, `📩 Введите текст рассылки для: ${typeMap[type]}\n(Просто отправьте текст в чат)`);
          return res.status(200).json({ ok: true });
        }
      }

      // Пользователь выбирает тип профиля
      if (data === 'type_military' || data === 'type_civil') {
        const type = data === 'type_military' ? 'military' : 'civil';
        await saveEmployee(chatId, name, type);
        await sendText(chatId, `✅ Вы выбрали: ${type === 'military' ? 'Военный' : 'Гражданский'}.`);
        return res.status(200).json({ ok: true });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('💥 Глобальная ошибка:', err);
    return res.status(200).json({ ok: true });
  }
}
