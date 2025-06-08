import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Resend } from 'resend'; // 1. Importar o Resend
import { MarketingEmail } from '@/app/components/emails/MarketingEmail';
import { UserRole } from '@prisma/client';

// 2. Instanciar o Resend com a chave de API do ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
        recipients, 
        subject, 
        title, 
        content, 
        imageUrl, 
        buttonText, 
        buttonUrl,
        fontColor,
        buttonBgColor,
        buttonTextColor
    } = body;
    
    if (!recipients || !subject) {
      return new NextResponse('Destinatários e assunto são obrigatórios', { status: 400 });
    }

    const recipientList = recipients.split(',').map((email: string) => email.trim());

    // 3. Usar o método resend.emails.send
    const { data, error } = await resend.emails.send({
      // ATENÇÃO: Use um e-mail de um domínio verificado no Resend.
      // Ex: 'Loja Incrível <vendas@sua-loja.com>'
      from: 'Make Marketplace <onboarding@resend.dev>', 
      to: recipientList,
      subject: subject,
      // A grande vantagem do Resend: passe o componente React diretamente!
      react: MarketingEmail({
        subject,
        title,
        content,
        imageUrl,
        buttonText,
        buttonUrl,
        fontColor,
        buttonBgColor,
        buttonTextColor
      })
    });

    if (error) {
      console.error('[RESEND_ERROR]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'E-mails enviados com sucesso!', data });
  } catch (error) {
    console.error('[MARKETING_SEND_EMAIL_POST]', error);
    // Assegura que o erro é do tipo Error para aceder à 'message'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ message: 'Internal error', details: errorMessage }), { status: 500 });
  }
}