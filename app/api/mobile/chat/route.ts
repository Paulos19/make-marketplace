import { NextRequest, NextResponse } from 'next/server';
import { getMobileUserId } from '../auth-helper';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { chatInput, sessionId } = body;

    if (!chatInput) {
      return NextResponse.json({ error: 'Mensagem (chatInput) não fornecida.' }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      console.error('NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL não está configurada no ambiente.');
      return NextResponse.json({ error: 'Serviço de chat indisponível no momento.' }, { status: 503 });
    }

    // Get mobile user ID if authenticated
    const userId = await getMobileUserId(req);

    // Call n8n chat webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId: sessionId || `mobile-${userId || 'anon'}-${Date.now()}`,
        chatInput: chatInput,
        userId: userId || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook respondeu com status ${response.status}`);
    }

    const rawText = await response.text();
    let outputText = '';

    if (rawText && rawText.trim() !== '') {
      try {
        const data = JSON.parse(rawText);
        outputText =
          data?.output ||
          data?.text ||
          data?.response ||
          data?.message ||
          (typeof data === 'string' ? data : JSON.stringify(data));
      } catch {
        outputText = rawText;
      }
    } else {
      outputText = 'Desculpe, não consegui processar a resposta.';
    }

    return NextResponse.json({ response: outputText });
  } catch (error: any) {
    console.error('Erro na rota do proxy de chat:', error);
    return NextResponse.json({ error: 'Erro ao processar mensagem no assistente.' }, { status: 500 });
  }
}
