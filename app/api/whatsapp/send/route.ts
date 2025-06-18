import { NextResponse } from 'next/server';
import { z } from 'zod';
import twilio from 'twilio';

const whatsappSchema = z.object({
  to: z.string().min(10, "Número de destino inválido."),
  message: z.string().min(1, "A mensagem não pode estar vazia."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = whatsappSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Dados inválidos.", errors: validation.error.format() }, { status: 400 });
    }
    
    const { to, message } = validation.data;
    const zacaNumber = process.env.ZACA_NUMBER;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Verifica se todas as credenciais necessárias estão configuradas
    if (!zacaNumber || !accountSid || !authToken) {
      console.error("Credenciais da Twilio ou ZACA_NUMBER não estão configuradas no .env");
      return NextResponse.json({ message: "Serviço de WhatsApp não configurado corretamente no servidor." }, { status: 500 });
    }

    // --- LÓGICA DE ENVIO REAL COM TWILIO ---
    const client = twilio(accountSid, authToken);

    await client.messages.create({
       body: message,
       from: `whatsapp:${zacaNumber}`, // Número da Twilio (Sandbox ou comprado)
       to: `whatsapp:${to}` // Número do vendedor
     });

    console.log(`Mensagem da Twilio enviada com sucesso para ${to}`);

    return NextResponse.json({ success: true, message: "Notificação via WhatsApp enviada para o vendedor." });

  } catch (error: any) {
    console.error("[WHATSAPP_SEND_ERROR]", error.message);
    return NextResponse.json({ message: 'Erro ao enviar notificação via WhatsApp.' }, { status: 500 });
  }
}