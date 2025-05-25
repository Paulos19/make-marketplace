import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, whatsappLink } = body;

    if (!email || !password || !whatsappLink) {
      return new NextResponse("Email, senha e link do WhatsApp são obrigatórios", { status: 400 });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("Usuário já existe com este email", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        whatsappLink,
        // emailVerified: new Date(), // Opcional: considerar um fluxo de verificação de email
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) { // Adicione ': any' para inspecionar melhor
    console.log("--- DETALHES DO ERRO CAPTURADO ---");
    console.log("Tipo do erro:", typeof error);
    console.log("Mensagem do erro:", error?.message);
    console.log("Stack do erro:", error?.stack);
    console.log("Objeto de erro completo:", JSON.stringify(error, null, 2)); // Tenta serializar
    console.error("Erro no registro (original):", error); // Seu log original
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}