import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

// Configuração do transporter do Nodemailer
// As informações devem vir do seu arquivo .env.local
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT || 587),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface SendVerificationEmailParams {
  email: string;
  name: string | null;
  token: string;
}

export const sendVerificationEmail = async ({ email, name, token }: SendVerificationEmailParams) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  const siteName = "Zacaplace";

  const mailOptions = {
    from: `"${siteName}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Ô Psit! Verifique seu Email no ${siteName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8A2BE2; text-align: center; font-family: 'Bangers', cursive;">Só falta um tiquinho, Cumpadi ${name || ''}!</h2>
        <p>Obrigado por se juntar à trupe do ${siteName}! Para começar a farra (e as compras!), precisamos que você verifique seu email clicando no botão mágico abaixo:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationLink}" style="background-color: #EC4899; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Verificar Meu Email Agora!</a>
        </div>
        <p>Este link é mais rápido que o Zaca fugindo da bronca e expira em <strong>1 hora</strong>.</p>
        <p>Se você não pediu pra entrar na nossa 'Zoropa', pode ignorar este email que não dá nada!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="text-align: center; font-size: 12px; color: #777;">Abraços apertados (mas sem amassar o chapéu!),<br/>Equipe ${siteName}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de verificação enviado para ${email}`);
  } catch (error) {
    console.error(`Falha ao enviar e-mail de verificação para ${email}:`, error);
    // Lançar o erro para que a rota de registro saiba que falhou
    throw new Error('Falha ao enviar o e-mail de verificação.');
  }
};

export const sendMail = async ({ to, subject, html, text }: MailOptions) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Zacaplace'}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error(`Falha ao enviar email para ${to}:`, error);
    // Lançamos o erro para que a função que chamou saiba que o envio falhou
    throw new Error('Falha ao enviar o e-mail de notificação.');
  }
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

/**
 * Envia um e-mail de notificação para o vendedor sobre uma nova reserva.
 */
export const sendReservationNotificationEmail = async ({
  sellerEmail,
  sellerName,
  clientName,
  clientContact,
  productName,
  quantity,
  productId,
}: ReservationNotificationParams) => {
  const siteName = "Zacaplace";
  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}`;
  const reservationsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/reservations`;

  const subject = `🎉 Nova Reserva no ${siteName}: ${quantity}x ${productName}!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #8A2BE2;">Ô psit, ${sellerName || 'Vendedor(a)'}! Notícia boa na área!</h2>
      <p>Você recebeu uma nova reserva na sua lojinha do ${siteName}. Dá uma espiada nos detalhes, cumpadi:</p>
      <ul style="list-style: none; padding: 0; margin: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0;">
        <li style="padding: 5px 0;"><strong>Produto:</strong> ${productName}</li>
        <li style="padding: 5px 0;"><strong>Quantidade Reservada:</strong> ${quantity} unidade(s)</li>
        <li style="padding: 5px 0;"><strong>Cliente:</strong> ${clientName || 'Cliente Interessado'}</li>
        ${clientContact ? `<li style="padding: 5px 0;"><strong>Contato do Cliente:</strong> ${clientContact}</li>` : ''}
      </ul>
      <p>Que tal dar um alô pro cliente e combinar os próximos passos? Não vá "moscar", hein!</p>
      <p style="text-align: center; margin-top: 25px;">
        <a href="${reservationsUrl}" style="background-color: #3B82F6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">Gerenciar Minhas Reservas</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="text-align: center; font-size: 12px; color: #777;">Abraços apertados (mas sem amassar o chapéu!),<br/>Equipe ${siteName}</p>
    </div>
  `;

  await sendMail({
    to: sellerEmail,
    subject,
    html,
    text: `Olá ${sellerName || 'Vendedor(a)'}, Você recebeu uma nova reserva para: ${productName} (Quantidade: ${quantity}) de ${clientName || 'Cliente Interessado'}. Contato: ${clientContact || 'Não informado'}. Gerencie em ${reservationsUrl}`
  });
};