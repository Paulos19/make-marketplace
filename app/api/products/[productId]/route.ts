// app/api/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

// GET para um único produto (sem alterações)
export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  const { productId } = params;
  if (!productId) {
    return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: { 
          select: {
            id: true,
            name: true,
            whatsappLink: true,
            image: true,
            storeName: true,
            profileDescription: true,
          },
        },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    // Normaliza os dados para o frontend esperar 'categories' como um array
    const { category, ...rest } = product;
    const productForFrontend = { ...rest, categories: category ? [category] : [] };

    return NextResponse.json(productForFrontend, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT para atualizar produto
export async function PUT(request: NextRequest, { params }: { params: { productId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { productId } = params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { userId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }
        
        if (product.userId !== session.user.id) {
            return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
        }

        const body = await request.json();

        // <<< INÍCIO DA CORREÇÃO >>>
        // Desestruturamos os campos do corpo da requisição.
        // O frontend envia 'imageUrls' e 'categoryIds', mas o banco espera 'images' e 'categoryId'.
        const { imageUrls, categoryIds, ...restOfBody } = body;

        // Construímos o objeto de dados com os nomes de campo corretos para o Prisma.
        const dataToUpdate = {
          ...restOfBody,
          images: imageUrls, // Mapeamos 'imageUrls' para o campo 'images' do banco de dados.
          // Como o produto só pode ter uma categoria, pegamos o primeiro ID do array.
          ...(categoryIds && categoryIds.length > 0 && { categoryId: categoryIds[0] }),
        };
        // <<< FIM DA CORREÇÃO >>>

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: dataToUpdate, // Usamos o objeto de dados corrigido.
        });

        return NextResponse.json(updatedProduct, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE para remover produto (sem alterações)
export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { productId } = params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { userId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        if (product.userId !== session.user.id) {
            return NextResponse.json({ error: 'Sem permissão para remover' }, { status: 403 });
        }

        await prisma.product.delete({
            where: { id: productId },
        });

        return NextResponse.json({ message: 'Produto removido' }, { status: 200 });
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
