import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { Resend } from 'resend';
import  StandaloneMarketingEmail  from '@/app/components/emails/MarketingEmail'; // <<< USA O NOVO TEMPLATE
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== UserRole.ADMIN) {
    return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { recipients, subject, ...templateProps } = body;

    if (!recipients || !subject) {
      return NextResponse.json({ message: 'Destinatários e assunto são obrigatórios.' }, { status: 400 });
    }

    const recipientList = recipients.split(',').map((email: string) => email.trim()).filter(Boolean);
    if (recipientList.length === 0) {
      return NextResponse.json({ message: "Nenhum destinatário válido." }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Zacaplace <onboarding@resend.dev>',
      to: recipientList,
      subject: subject,
      react: React.createElement(StandaloneMarketingEmail, { subject, ...templateProps }),
    });

    if (error) throw error;

    return NextResponse.json({ message: `Campanha enviada para ${recipientList.length} destinatário(s)!` });

  } catch (error: any) {
    console.error("[MARKETING_SEND_ERROR]", error);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
