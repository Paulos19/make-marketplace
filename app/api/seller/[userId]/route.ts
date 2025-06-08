// app/api/seller/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client'; // Certifique-se de que UserRole está sendo importado

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  // A desestruturação de `params` aqui é a forma padrão e correta.
  // O aviso do Next.js sobre "await params" geralmente se aplica a cenários mais complexos
  // ou ao acessar `request.params` diretamente em vez do segundo argumento da função.
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'ID do usuário (vendedor) não fornecido.' }, { status: 400 });
  }

  try {
    // A consulta busca na tabela 'User'
    const sellerProfile = await prisma.user.findUnique({
      where: { 
        id: userId,
        role: UserRole.SELLER, // Garante que apenas usuários com a role SELLER sejam retornados
      },
      // Seleciona apenas os campos públicos e necessários para o perfil do vendedor
      select: {
        id: true,
        name: true,
        email: true, // Considere se o email deve ser público
        image: true,
        storeName: true,
        whatsappLink: true,
        profileDescription: true,
        sellerBannerImageUrl: true,
        createdAt: true, // Para exibir "Vendedor desde..."
        // Inclui os produtos do vendedor
        products: {
          where: {
            // Você pode adicionar filtros aqui, por exemplo, para não mostrar produtos sem estoque
            // quantity: { gt: 0 } 
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        },
      },
    });

    // Se nenhum usuário com esse ID e role SELLER for encontrado, retorna 404
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Perfil de vendedor não encontrado ou o usuário não é um vendedor.' }, { status: 404 });
    }

    return NextResponse.json(sellerProfile, { status: 200 });

  } catch (error) {
    console.error(`Erro ao buscar perfil de vendedor para userId: ${userId}`, error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar perfil do vendedor.' }, { status: 500 });
  }
}
