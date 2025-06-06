// app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactFormEmail } from '@/lib/nodemailer';

// Schema para validar os dados do formulário
const contactFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Por favor, insira um e-mail válido."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = contactFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, email, message } = validation.data;

    // Envia o e-mail para o administrador
    await sendContactFormEmail({
      fromName: name,
      fromEmail: email,
      message: message,
    });

    return NextResponse.json({ message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.' }, { status: 200 });
  } catch (error) {
    console.error("Erro ao enviar e-mail de contato:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Ocorreu um erro interno ao enviar a sua mensagem.' }, { status: 500 });
  }
}