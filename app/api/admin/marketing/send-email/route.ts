// app/api/admin/marketing/send-email/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { Resend } from 'resend';
import MarketingEmail from '@/app/components/emails/MarketingEmail';
import * as React from 'react';

// 1. Inicialização do Cliente Resend
// Certifique-se que RESEND_API_KEY está no seu arquivo .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

// 2. Schema de Validação com Zod
// Define a estrutura esperada do corpo da requisição, incluindo o campo de teste.
const emailBuilderSchema = z.object({
  isTest: z.boolean().optional(), // Flag para identificar se é um envio de teste
  targetAudience: z.object({
      newsletter: z.boolean(),
      allUsers: z.boolean(),
  }).optional(), // O público só é necessário se não for um teste
  subject: z.string().min(5, "O assunto deve ter pelo menos 5 caracteres."),
  headline: z.string().min(5, "O título principal é muito curto."),
  body: z.string().min(20, "O corpo do email precisa ter mais conteúdo."),
  ctaText: z.string().min(3, "O texto do botão é muito curto."),
  ctaLink: z.string().url("O link do botão deve ser uma URL válida."),
  imageUrl: z.string().url("A URL da imagem do banner é obrigatória e deve ser válida."),
});

// 3. Função Principal da Rota (POST)
export async function POST(request: Request) {
  try {
    // 4. Verificação de Segurança
    const session = await getServerSession(authOptions);
    // Garante que o usuário está logado, é um ADMIN e possui um email (necessário para receber o teste)
    if (session?.user?.role !== UserRole.ADMIN || !session?.user?.email) {
      return NextResponse.json({ message: 'Acesso negado ou email do admin não encontrado.' }, { status: 403 });
    }

    const emailContent = await request.json();
    const validation = emailBuilderSchema.safeParse(emailContent);

    if (!validation.success) {
      return NextResponse.json({ message: 'Dados do email inválidos.', errors: validation.error.format() }, { status: 400 });
    }

    const { isTest, targetAudience, subject, ...templateProps } = validation.data;
    const adminEmail = session.user.email;
    let finalRecipients: string[] = [];

    // 5. Lógica para Definir os Destinatários
    if (isTest) {
      // Se for um teste, o único destinatário é o próprio admin
      finalRecipients = [adminEmail];
    } else if (targetAudience) {
      // Se for uma campanha real, busca os emails do banco de dados
      const emailPromises: Promise<{ email: string | null }[]>[] = [];
      
      if (targetAudience.newsletter) {
        emailPromises.push(prisma.newsletterSubscription.findMany({ select: { email: true } }));
      }
      if (targetAudience.allUsers) {
        emailPromises.push(prisma.user.findMany({ where: { email: { not: null } }, select: { email: true } }));
      }
      
      const emailResults = await Promise.all(emailPromises);
      
      // Limpa, normaliza e remove duplicatas da lista de emails
      const emailsToSend = emailResults.flat().map(result => result.email).filter((email): email is string => !!email);
      finalRecipients = [...new Set(emailsToSend)];
    }

    if (finalRecipients.length === 0) {
      return NextResponse.json({ message: "Nenhum destinatário válido foi encontrado para esta campanha." }, { status: 400 });
    }
    
    // 6. Envio em Lotes para Evitar Limites da API
    const BATCH_SIZE = 999; // Limite do Resend é 1000 por chamada
    const emailBatches: string[][] = [];
    for (let i = 0; i < finalRecipients.length; i += BATCH_SIZE) {
        emailBatches.push(finalRecipients.slice(i, i + BATCH_SIZE));
    }

    console.log(`Iniciando envio para ${finalRecipients.length} destinatário(s) em ${emailBatches.length} lote(s).`);

    for (const batch of emailBatches) {
      await resend.emails.send({
        from: process.env.EMAIL_SENDER || 'Zacaplace <onboarding@resend.dev>',
        to: batch,
        subject: isTest ? `[TESTE] ${subject}` : subject,
        react: React.createElement(MarketingEmail, { ...templateProps, subject }),
      });
    }

    // 7. Resposta de Sucesso
    const successMessage = isTest
        ? "Email de teste enviado com sucesso para seu email de administrador!"
        : `Campanha enviada com sucesso para ${finalRecipients.length} destinatário(s)!`;

    return NextResponse.json({ message: successMessage }, { status: 200 });

  } catch (error) {
    console.error("Erro na API de envio de marketing:", error);
    return NextResponse.json({ message: "Ocorreu um erro interno no servidor. Verifique os logs." }, { status: 500 });
  }
}
