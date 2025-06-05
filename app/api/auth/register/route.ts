// app/api/auth/register/route.ts
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client"; // Importar o enum de roles do Prisma Client
import { v4 as uuidv4 } from 'uuid'; // Para gerar tokens únicos
import { sendVerificationEmail } from "@/lib/nodemailer"; // Sua função de envio de email

// Schema de validação Zod com lógica condicional para o whatsappLink
const registerUserSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres, cumpadi." }),
  role: z.enum([UserRole.USER, UserRole.SELLER], {
    required_error: "O tipo de conta (Comprador ou Vendedor) é obrigatório.",
  }),
  whatsappLink: z.string()
    .url({ message: "O link do WhatsApp parece inválido." })
    .refine(val => val.startsWith("https://wa.me/") || val.startsWith("https://api.whatsapp.com/send?phone="), {
      message: "Link do Zap do Zaca deve começar com https://wa.me/ ou https://api.whatsapp.com/send?phone="
    })
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  if (data.role === 'SELLER' && (!data.whatsappLink || data.whatsappLink.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O link do WhatsApp é obrigatório para a conta de Vendedor.",
      path: ["whatsappLink"],
    });
  }
});


export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar os dados de entrada
    const validation = registerUserSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Dados de registro inválidos.";
      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    const { email, name, password, whatsappLink, role } = validation.data;

    // 2. Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Se o usuário existe, mas ainda não verificou o email, pode ser uma boa ideia
      // permitir que ele solicite um novo email de verificação em vez de apenas bloquear.
      // Mas, para o fluxo de registro, um erro de conflito é apropriado.
      return NextResponse.json(
        { message: "Este email já foi cadastrado. Tente fazer login ou recuperar sua senha." },
        { status: 409 } // Conflict
      );
    }

    // 3. Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar o novo usuário no banco de dados
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        whatsappLink: role === UserRole.SELLER ? whatsappLink : null,
        role: role, // Salva a role correta
        emailVerified: null, // Usuário começa como não verificado
      },
    });

    // ---- INÍCIO DA LÓGICA DE ENVIO DE EMAIL DE VERIFICAÇÃO ----

    // 5. Gerar e armazenar o token de verificação
    const verificationTokenValue = uuidv4() + '-' + Date.now(); // Token único
    const expires = new Date(Date.now() + 3600 * 1000 * 24); // Token válido por 24 horas

    // Antes de criar um novo token, remove quaisquer tokens existentes para o mesmo email (identifier).
    // Isso é crucial se o usuário tentar se registrar múltiplas vezes ou se um token anterior não foi usado.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Criar o novo token de verificação
    await prisma.verificationToken.create({
      data: {
        identifier: email, // O email do usuário é o identificador
        token: verificationTokenValue,
        expires,
      },
    });

    // 6. Enviar o email de verificação
    await sendVerificationEmail({
      email: newUser.email!, // Garante que o email não é null (já validado)
      name: newUser.name,
      token: verificationTokenValue,
    });
    
    // ---- FIM DA LÓGICA DE ENVIO DE EMAIL DE VERIFICAÇÃO ----

    // 7. Remover a senha do objeto de resposta por segurança
    const { passwordHash, ...userWithoutPassword } = newUser;

    // 8. Retornar uma resposta de sucesso clara para o cliente
    return NextResponse.json(
      { 
        message: "Cadastro realizado com sucesso! Enviamos um link de verificação para o seu email. Dá uma espiada lá (e na caixa de spam, psit!).",
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Erro detalhado no fluxo de registro:", error);
    
    if (error.message?.includes('Falha ao enviar o e-mail de verificação')) {
        // Se o envio do email falhar, o usuário já foi criado.
        // Você pode decidir se quer deletar o usuário ou permitir que ele solicite um novo email.
        // Por ora, informamos sobre o cadastro e a falha no email.
        return NextResponse.json({ 
            message: "Cadastro realizado, mas falhamos em enviar o email de verificação. Você pode tentar solicitar um novo link na página de login ou entrar em contato com o suporte." 
        }, { status: 201 }); // Retorna 201 porque o usuário FOI criado, mas com um aviso sobre o email.
    }
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Erro ao criar registro. Este email ou identificador já pode estar em uso." }, { status: 409 });
    }
    return NextResponse.json({ message: "Erro interno do servidor. Ai, pastor, deu um revertério aqui!" }, { status: 500 });
  }
}
