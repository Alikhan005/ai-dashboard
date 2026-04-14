import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    // Читаем то, что прислала RetailCRM
    const bodyText = await request.text();
    
    // Формируем сообщение
    const message = `🚀 Ура! Пришел новый заказ из RetailCRM!\n\nДетали:\n${bodyText.substring(0, 300)}...`;
    
    // Достаем ключи, которые ты только что вписал в Netlify
    const botToken = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Keys missing' }, { status: 500 });
    }

    // Отправляем сообщение в Телеграм
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}