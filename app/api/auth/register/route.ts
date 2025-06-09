// app/api/auth/register/route.ts
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from "@/lib/nodemailer";

// <<< INÍCIO DA CORREÇÃO >>>
const registerUserSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação da senha é obrigatória." }),
  role: z.enum([UserRole.USER, UserRole.SELLER]),
  whatsappLink: z.string().url().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.role === 'SELLER' && (!data.whatsappLink || data.whatsappLink.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O link do WhatsApp é obrigatório para a conta de Vendedor.",
      path: ["whatsappLink"],
    });
  }
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não coincidem, cumpadi!",
    path: ["confirmPassword"], // O erro será associado ao campo de confirmação
});
// <<< FIM DA CORREÇÃO >>>


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerUserSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Dados de registro inválidos.";
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    // O campo confirmPassword é usado apenas para validação e não é extraído aqui
    const { email, name, password, whatsappLink, role } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Este email já foi cadastrado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        role: role,
        whatsappLink: role === UserRole.SELLER ? whatsappLink : null,
        emailVerified: null,
      },
    });

    // Lógica de envio de email de verificação (inalterada)
    const verificationTokenValue = uuidv4() + '-' + Date.now();
    const expires = new Date(Date.now() + 3600 * 1000 * 24); 

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({ data: { identifier: email, token: verificationTokenValue, expires } });
    await sendVerificationEmail({ email: newUser.email!, name: newUser.name, token: verificationTokenValue });
    
    const { passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({ 
        message: "Cadastro realizado! Enviamos um link de verificação para o seu email.",
        user: userWithoutPassword 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro no fluxo de registro:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}