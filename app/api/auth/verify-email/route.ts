// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // [cite: paulos19/make-marketplace/make-marketplace-46963943dd3832bf14e677f937979a4894fd9404/lib/prisma.ts]
import { z } from 'zod';

const verifyEmailQuerySchema = z.object({
  token: z.string().min(1, { message: "Token de verificação é obrigatório." }),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenParam = searchParams.get('token');

  // Validar o parâmetro token
  const validation = verifyEmailQuerySchema.safeParse({ token: tokenParam });
  if (!validation.success) {
    const errorMessage = validation.error.errors[0]?.message || 'Token de verificação ausente ou inválido.';
    // Redirecionar para uma página de erro ou exibir uma mensagem genérica
    // Para fins de API, retornar JSON é comum, mas a página do cliente lidará com o redirecionamento.
    // Aqui, poderíamos redirecionar para uma página de erro genérica no frontend.
    const errorRedirectUrl = new URL('/auth/verify-email', request.url); // Reutilizar a mesma página para mostrar erro
    errorRedirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(errorRedirectUrl);
  }

  const { token } = validation.data;

  try {
    // 1. Encontrar o token de verificação no banco de dados
    //    O modelo VerificationToken deve ter 'token' como @unique
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }, // Busca pelo token único
    });

    if (!verificationToken) {
      // Redirecionar para a página de verificação com mensagem de erro
      const errorRedirectUrl = new URL('/auth/verify-email', request.url);
      errorRedirectUrl.searchParams.set('error', 'Token inválido ou já utilizado. Tente novamente, Zé!');
      return NextResponse.redirect(errorRedirectUrl);
    }

    // 2. Verificar se o token não expirou
    if (new Date(verificationToken.expires) < new Date()) {
      // Deletar o token expirado para evitar acúmulo
      await prisma.verificationToken.delete({
        where: { token: verificationToken.token }, // Deleta pelo token
      });
      const errorRedirectUrl = new URL('/auth/verify-email', request.url);
      errorRedirectUrl.searchParams.set('error', 'Seu link de verificação expirou igual promessa de político! Solicite um novo, cumpadi.');
      return NextResponse.redirect(errorRedirectUrl);
    }

    // 3. Usar uma transação para garantir que ambas as operações sejam atômicas
    await prisma.$transaction(async (tx) => {
      // Atualizar o status do usuário para verificado
      // O campo 'identifier' no VerificationToken armazena o email
      await tx.user.update({
        where: { email: verificationToken.identifier }, // << CORREÇÃO: Usar identifier
        data: { emailVerified: new Date() },
      });

      // Deletar o token de verificação após o uso bem-sucedido
      // Deleta pelo token, que é o identificador único da linha
      await tx.verificationToken.delete({
        where: { token: verificationToken.token }, // << CORREÇÃO: Usar token para deletar
      });
    });

    // Redirecionar para a página de login com mensagem de sucesso
    const redirectUrl = new URL('/auth/signin', request.url); // Vai para o URL base do app
    redirectUrl.searchParams.set('emailVerified', 'true');
    redirectUrl.searchParams.set('message', 'Email verificado com sucesso, cumpadi! Agora pode entrar na festa.');
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('Erro durante a verificação de e-mail (API):', error);
    // Redirecionar para uma página de erro genérica no frontend com mensagem
    const errorRedirectUrl = new URL('/auth/verify-email', request.url); // Reutilizar a mesma página para mostrar erro
    let errorMessage = 'Deu um revertério no servidor e não deu pra verificar. Tente de novo!';
    if (error.code === 'P2025') { // Prisma: Record to update not found (usuário ou token)
        errorMessage = 'Token ou usuário associado não encontrado. Pode ser que já foi verificado ou o link é antigo.';
    }
    errorRedirectUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(errorRedirectUrl);
  }
}