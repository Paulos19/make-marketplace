import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole, SubscriptionStatus } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from "@/lib/resend";

// Schema de validação para o registro
const registerUserSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação da senha é obrigatória." }),
  role: z.enum([UserRole.USER, UserRole.SELLER]),
  whatsappLink: z.string().url().optional().nullable(),
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não coincidem, cumpadi!",
    path: ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Dados de registro inválidos.";
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    const { email, name, password, whatsappLink, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Este email já foi cadastrado." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário com os dados básicos
    let newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        whatsappLink: role === UserRole.SELLER ? whatsappLink : null,
      },
    });

    // --- LÓGICA PARA O VENDEDOR PREMIUM ---
    // Verifica se o email do novo usuário é o premium definido no .env
    if (newUser.email === process.env.NEXT_PUBLIC_EMAIL_PREMIUM) {
      // Define uma data de expiração da assinatura para 100 anos no futuro
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);

      // Atualiza o usuário recém-criado com os benefícios premium
      newUser = await prisma.user.update({
        where: { id: newUser.id },
        data: {
          role: 'SELLER', // Garante que a role seja de vendedor
          stripeSubscriptionStatus: SubscriptionStatus.ACTIVE, // Define o status da assinatura como ativo
          stripeCurrentPeriodEnd: farFuture, // Define a data de expiração
          showInSellersPage: true, // Opcional: já exibe na página de vendedores
        },
      });
    }
    // --- FIM DA LÓGICA ---

    // Envio do e-mail de verificação (lógica existente)
    const verificationTokenValue = uuidv4() + '-' + Date.now();
    const expires = new Date(Date.now() + 3600 * 1000 * 24); // Token válido por 24 horas

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({ data: { identifier: email, token: verificationTokenValue, expires } });
    await sendVerificationEmail({ email: newUser.email!, name: newUser.name, token: verificationTokenValue });
    
    // Remove o hash da senha antes de retornar a resposta
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ 
        message: "Cadastro realizado! Enviamos um link de verificação para o seu email.",
        user: userWithoutPassword 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro no fluxo de registro:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
