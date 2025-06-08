// app/api/admin/marketing/send-email/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { Resend } from 'resend';
import MarketingEmail from '@/app/components/emails/MarketingEmail'; // Importa o template React
import * as React from 'react'; // <<< ADICIONADO: Importa o React para usar React.createElement

// Inicializa o cliente Resend com a chave de API do .env
const resend = new Resend(process.env.RESEND_API_KEY);

// Schema de validação para os dados recebidos do formulário
const emailBuilderSchema = z.object({
    targetAudience: z.object({
        newsletter: z.boolean(),
        allUsers: z.boolean(),
    }).refine(data => data.newsletter || data.allUsers, { message: "Selecione pelo menos um público-alvo." }),
    subject: z.string().min(5, "O assunto é muito curto."),
    headline: z.string().min(5, "O título é muito curto."),
    body: z.string().min(20, "O corpo do email é muito curto."),
    ctaText: z.string().min(3, "O texto do botão é muito curto."),
    ctaLink: z.string().url("O link do botão deve ser uma URL válida."),
    imageUrl: z.string().url("A URL da imagem deve ser válida."),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Acesso negado. Apenas administradores podem enviar campanhas.' }, { status: 403 });
    }

    const emailContent = await request.json();
    const validation = emailBuilderSchema.safeParse(emailContent);
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados do email inválidos.', errors: validation.error.format() }, { status: 400 });
    }

    const { targetAudience, subject, ...templateProps } = validation.data;

    // 1. Buscar a lista de e-mails dos destinatários com base na seleção do admin
    const emailPromises: Promise<{ email: string | null }[]>[] = [];

    if (targetAudience.newsletter) {
      emailPromises.push(prisma.newsletterSubscription.findMany({ select: { email: true } }));
    }
    if (targetAudience.allUsers) {
      emailPromises.push(prisma.user.findMany({ where: { email: { not: null } }, select: { email: true } }));
    }
    
    const emailResults = await Promise.all(emailPromises);
    
    const emailsToSend = emailResults
      .flat() // Achata o array de arrays
      .map(result => result.email) // Extrai os emails
      .filter((email): email is string => typeof email === 'string' && email.length > 0); // Filtra nulos/vazios e garante o tipo string

    // Remove duplicatas
    const uniqueEmails = [...new Set(emailsToSend)];

    if (uniqueEmails.length === 0) {
        return NextResponse.json({ message: "Nenhum destinatário encontrado para o público selecionado." }, { status: 400 });
    }
    
    const BATCH_SIZE = 999; 
    const emailBatches: string[][] = [];
    for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
        emailBatches.push(uniqueEmails.slice(i, i + BATCH_SIZE));
    }

    console.log(`Iniciando envio de campanha para ${uniqueEmails.length} destinatário(s) em ${emailBatches.length} lote(s).`);

    // 2. Enviar os e-mails usando Resend em lotes
    for (const batch of emailBatches) {
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_SENDER || 'Zacaplace <nao-responda@seu-dominio-verificado.com>',
          to: batch,
          subject: subject,
          // <<< CORREÇÃO AQUI: Passar o componente usando React.createElement >>>
          react: React.createElement(MarketingEmail, templateProps),
        });

        if (error) {
          console.error("Erro do Resend ao enviar um lote:", error);
        } else {
          console.log(`Lote de ${batch.length} e-mails enviado com sucesso. ID do primeiro e-mail: ${data?.id}`);
        }
    }

    return NextResponse.json({ message: `Campanha de email disparada com sucesso para ${uniqueEmails.length} destinatário(s)!` }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de envio de marketing:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
