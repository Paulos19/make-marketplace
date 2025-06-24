// lib/resend.ts
import { Resend } from 'resend';
import * as React from 'react';

// Importa os componentes de e-mail
import { VerificationEmail } from '@/app/components/emails/VerificationEmail';
import { PasswordResetEmail } from '@/app/components/emails/PasswordResetEmail';
import { ReservationNotificationEmail } from '@/app/components/emails/ReservationNotificationEmail';
import { OrderCompletionEmail } from '@/app/components/emails/OrderCompletionEmail';
import { ContactFormEmail } from '@/app/components/emails/ContactFormEmail';
import ReviewRequestEmail from '@/app/components/emails/ReviewRequestEmail';
import { StripePurchaseConfirmationEmail } from '@/app/components/emails/StripePurchaseConfirmationEmail'; // <<< 1. NOVO IMPORT

// Inicializa a instância do Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// Define o remetente padrão
const fromEmail = process.env.EMAIL_SENDER || 'Zacaplace <onboarding@resend.dev>';

/**
 * Envia um e-mail genérico.
 */
async function sendEmail({ to, subject, react, replyTo }: { to: string | string[], subject: string, react: React.ReactElement, replyTo?: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      react,
      replyTo,
    });

    if (error) {
      throw new Error("Falha ao enviar e-mail via Resend.", { cause: error });
    }
    return data;
  } catch (error) {
    console.error(`Falha ao enviar e-mail para ${to}:`, error);
    throw error;
  }
}

// ... (Funções existentes como sendVerificationEmail, etc.) ...

// --- INÍCIO DA NOVA FUNÇÃO ---
interface StripePurchaseConfirmationParams {
    to: string;
    userName: string | null;
    planName: string;
    price: string;
    isSubscription: boolean;
}

/**
 * Envia um e-mail de confirmação de compra ou assinatura via Stripe.
 * @param params - Parâmetros para o e-mail de confirmação.
 */
export const sendStripePurchaseConfirmationEmail = async (params: StripePurchaseConfirmationParams) => {
    const { to, userName, planName, price, isSubscription } = params;

    await sendEmail({
        to,
        subject: `✅ Compra Confirmada: ${planName}`,
        react: <StripePurchaseConfirmationEmail
            userName={userName}
            planName={planName}
            price={price}
            isSubscription={isSubscription}
        />
    });
};
// --- FIM DA NOVA FUNÇÃO ---

// Funções de envio de e-mail existentes...
// (sendVerificationEmail, sendPasswordResetEmail, etc.)

interface VerificationEmailParams {
  email: string;
  name: string | null;
  token: string;
}
export const sendVerificationEmail = async ({ email, name, token }: VerificationEmailParams) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: `Ô Psit! Verifique seu Email no Zacaplace!`,
    react: <VerificationEmail name={name} verificationLink={verificationLink} />,
  });
};

interface PasswordResetEmailParams {
  email: string;
  token: string;
}
export const sendPasswordResetEmail = async ({ email, token }: PasswordResetEmailParams) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Recuperação de Senha - Zacaplace',
    react: <PasswordResetEmail resetLink={resetLink} />,
  });
};

interface ReservationNotificationParams {
  sellerEmail: string;
  sellerName: string | null | undefined;
  clientName: string | null | undefined;
  clientContact?: string | null | undefined;
  productName: string;
  quantity: number;
  productId: string;
}
export const sendReservationNotificationEmail = async (params: ReservationNotificationParams) => {
  const reservationsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/reservations`;
  await sendEmail({
    to: params.sellerEmail,
    subject: `🎉 Nova Reserva no Zacaplace: ${params.quantity}x ${params.productName}!`,
    react: <ReservationNotificationEmail {...params} reservationsUrl={reservationsUrl} />,
  });
};

interface OrderCompletionParams {
  clientEmail: string;
  clientName: string | null;
  productName: string;
  productId: string;
  sellerName: string | null;
}
export const sendOrderCompletionEmail = async (params: OrderCompletionParams) => {
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${params.productId}#reviews`;
  await sendEmail({
    to: params.clientEmail,
    subject: `✅ Pedido Entregue: Avalie sua compra de "${params.productName}"!`,
    react: <OrderCompletionEmail {...params} reviewLink={reviewLink} />,
  });
};

interface ContactFormEmailParams {
  fromName: string;
  fromEmail: string;
  message: string;
}
export const sendContactFormEmail = async ({ fromName, fromEmail, message }: ContactFormEmailParams) => {
  const adminEmail = process.env.EMAIL_FROM;
  if (!adminEmail) {
    throw new Error("O servidor não está configurado para receber mensagens de contato (EMAIL_FROM não definido).");
  }
  await sendEmail({
    to: adminEmail,
    subject: `Nova Mensagem de Contato de ${fromName} - Zacaplace`,
    react: <ContactFormEmail fromName={fromName} fromEmail={fromEmail} message={message} />,
    replyTo: fromEmail,
  });
};
