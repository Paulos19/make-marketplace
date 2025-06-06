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

interface OrderCompletionParams {
  clientEmail: string;
  clientName: string | null;
  productName: string;
  productId: string;
  sellerName: string | null;
}

/**
 * Envia um e-mail para o cliente quando o vendedor confirma a entrega.
 */
export const sendOrderCompletionEmail = async ({
  clientEmail,
  clientName,
  productName,
  productId,
  sellerName,
}: OrderCompletionParams) => {
  const siteName = "Zacaplace";
  // O link de avaliação pode apontar para a página do produto ou uma página específica de review
  const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${productId}#reviews`;

  const subject = `✅ Pedido Entregue: Avalie sua compra de "${productName}"!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #16a34a;">Oba, ${clientName || 'Cumpadi'}! Seu produto chegou!</h2>
      <p>O vendedor <strong>${sellerName || 'Zaca'}</strong> confirmou a entrega do seu produto:</p>
      <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #eee;">
        <p style="margin:0; font-size: 1.1em; font-weight: bold;">${productName}</p>
      </div>
      <p>A gente espera que você tenha amado seu achadinho! Que tal deixar uma avaliação e contar pra todo mundo como foi sua experiência? Isso ajuda outros Zacas a comprarem com mais confiança!</p>
      <p style="text-align: center; margin-top: 25px;">
        <a href="${reviewLink}" style="background-color: #f97316; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Deixar minha Avaliação</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="text-align: center; font-size: 12px; color: #777;">Obrigado por fazer parte da turma do ${siteName}!</p>
    </div>
  `;

  await sendMail({
    to: clientEmail,
    subject,
    html,
    text: `Olá ${clientName || ''}, O vendedor ${sellerName} confirmou a entrega do seu produto "${productName}". Por favor, avalie sua compra em: ${reviewLink}`
  });
};

interface PasswordResetEmailParams {
  email: string;
  token: string;
}

/**
 * Envia um e-mail para o usuário com um link para redefinir sua senha.
 */
export const sendPasswordResetEmail = async ({ email, token }: PasswordResetEmailParams) => {
  const siteName = "Zacaplace";
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

  const subject = `Recuperação de Senha - ${siteName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #8A2BE2;">Esqueceu sua senha, cumpadi?</h2>
      <p>Sem problemas! Acontece nas melhores famílias de trapalhões. Recebemos uma solicitação para redefinir a senha da sua conta no ${siteName}.</p>
      <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por 1 hora.</p>
      <p style="text-align: center; margin-top: 25px;">
        <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Minha Senha</a>
      </p>
      <p>Se você não solicitou uma redefinição de senha, pode ignorar este e-mail com segurança. Ninguém mais além de você recebeu este link.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="text-align: center; font-size: 12px; color: #777;">Atenciosamente,<br>A Turma do ${siteName}</p>
    </div>
  `;
  const text = `Olá! Para redefinir sua senha, acesse o seguinte link (válido por 1 hora): ${resetLink}`;

  await sendMail({ to: email, subject, html, text });
};

interface ContactFormEmailParams {
  fromName: string;
  fromEmail: string;
  message: string;
}

/**
 * Envia uma notificação por e-mail para o administrador do site
 * com a mensagem enviada através do formulário de contato.
 */
export const sendContactFormEmail = async ({
  fromName,
  fromEmail,
  message,
}: ContactFormEmailParams) => {
  const siteName = "Zacaplace";
  // O e-mail será enviado para o endereço de e-mail do administrador/suporte
  const adminEmail = process.env.EMAIL_FROM; // Usando o mesmo e-mail do .env

  if (!adminEmail) {
    console.error("EMAIL_FROM não está definido no .env para receber e-mails de contato.");
    throw new Error("O servidor não está configurado para receber mensagens de contato.");
  }

  const subject = `Nova Mensagem de Contato de ${fromName} - ${siteName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>Nova Mensagem Recebida do Formulário de Contato do Zacaplace</h2>
      <p>Você recebeu uma nova mensagem de um visitante do site.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p><strong>Nome:</strong> ${fromName}</p>
      <p><strong>E-mail do Remetente:</strong> <a href="mailto:${fromEmail}">${fromEmail}</a></p>
      <h3>Mensagem:</h3>
      <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #777;">Esta mensagem foi enviada através do formulário de contato do site ${siteName}.</p>
    </div>
  `;
  const text = `Nova mensagem de ${fromName} (${fromEmail}):\n\n${message}`;

  await sendMail({
    to: adminEmail, // Envia para si mesmo (o admin)
    replyTo: fromEmail, // Permite responder diretamente ao usuário a partir do seu cliente de e-mail
    subject,
    html,
    text,
  });
};