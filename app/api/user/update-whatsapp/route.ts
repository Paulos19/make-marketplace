import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // Ajuste o caminho se necessário
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  try {
    const body = await request.json();
    const { whatsappLink } = body;

    if (!whatsappLink) {
      return new NextResponse("Link do WhatsApp é obrigatório", { status: 400 });
    }
    
    // Validação simples do link do WhatsApp
    if (!whatsappLink.startsWith("https://wa.me/") && !whatsappLink.startsWith("https://api.whatsapp.com/send?phone=")) {
        return new NextResponse("Link do WhatsApp inválido.", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { whatsappLink },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar link do WhatsApp:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}