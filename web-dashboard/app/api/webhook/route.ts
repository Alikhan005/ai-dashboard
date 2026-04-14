import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: "Working", 
    message: "Связь установлена" 
  });
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const token = process.env.TG_BOT_TOKEN?.trim();
    const chat = process.env.TG_CHAT_ID?.trim();

    if (!token || !chat) {
      return NextResponse.json({ error: "Ключи не найдены" }, { status: 200 });
    }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: `🚀 Сообщение из CRM: ${text}`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}