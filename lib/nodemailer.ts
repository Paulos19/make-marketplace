// lib/nodemailer.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Versão em texto puro opcional
}

// Configuração do transporter do Nodemailer
// Essas informações devem vir de variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST, // ex: 'smtp.example.com'
  port: Number(process.env.EMAIL_SERVER_PORT), // ex: 587 ou 465
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true para 465, false para outros
  auth: {
    user: process.env.EMAIL_SERVER_USER, // seu usuário do servidor de email
    pass: process.env.EMAIL_SERVER_PASSWORD, // sua senha do servidor de email
  },
});

export const sendMail = async ({ to, subject, html, text }: MailOptions) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM, // ex: '"Zacaplace" <nao-responda@zacaplace.com>'
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
    console.error('Erro ao enviar email:', error);
    // Não lance o erro aqui para não quebrar o fluxo principal da reserva,
    // mas registre-o. Em um sistema de produção, você pode querer um sistema de retry ou notificação de falha.
    // throw new Error('Falha ao enviar o email de notificação.');
    return null; // Indica falha no envio
  }
};

// Função específica para notificação de reserva
interface ReservationNotificationParams {
  sellerEmail: string;
  sellerName: string | null | undefined;
  clientName: string | null | undefined;
  clientContact?: string | null | undefined; // Email ou WhatsApp do cliente
  productName: string;
  quantity: number;
  productId: string;
}

export const sendReservationNotificationEmail = async ({
  sellerEmail,
  sellerName,
  clientName,
  clientContact,
  productName,
  quantity,
  productId,
}: ReservationNotificationParams) => {
  const siteName = "Zacaplace"; // Ou puxe de uma variável de ambiente
  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}`;
  const reservationsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/reservations`;

  const subject = `🎉 Nova Reserva no ${siteName}: ${quantity}x ${productName}!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #8A2BE2;">Ô psit, ${sellerName || 'Vendedor(a)'}! Notícia boa na área!</h2>
      <p>Você recebeu uma nova reserva no ${siteName}. Dá uma espiada nos detalhes, cumpadi:</p>
      <ul>
        <li><strong>Produto:</strong> ${productName}</li>
        <li><strong>Quantidade Reservada:</strong> ${quantity} unidade(s)</li>
        <li><strong>Cliente Solicitante:</strong> ${clientName || 'Cliente Interessado'}</li>
        ${clientContact ? `<li><strong>Contato do Cliente:</strong> ${clientContact}</li>` : ''}
      </ul>
      <p>Que tal dar um alô pro cliente e combinar os próximos passos? Não vá "moscar", hein!</p>
      <p>
        <a href="${productUrl}" style="display: inline-block; background-color: #EC4899; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Ver Produto</a>
        <a href="${reservationsUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Gerenciar Reservas</a>
      </p>
      <p>Abraços da equipe ${siteName}!</p>
    </div>
  `;

  await sendMail({
    to: sellerEmail,
    subject,
    html,
    text: `Olá ${sellerName || 'Vendedor(a)'}, Você recebeu uma nova reserva para: ${productName} (Quantidade: ${quantity}) de ${clientName || 'Cliente Interessado'}. Contato: ${clientContact || 'Não informado'}. Gerencie em ${reservationsUrl}`,
  });
};