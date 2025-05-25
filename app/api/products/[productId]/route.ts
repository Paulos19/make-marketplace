import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);

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
            id: true, // Ensure userId is selected
            name: true,
            whatsappLink: true,
            image: true, // Adicionando imagem do usuário se desejar exibi-la
          },
        },
        categories: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // O campo quantity já está incluído por padrão ao buscar o produto diretamente
    // não sendo necessário um select explícito para ele, a menos que você queira restringir outros campos.
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { productId } = params;
  if (!productId) {
    return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      onPromotion,   
      imageUrls, 
      categoryIds,
      quantity // Adicionando quantity aqui para atualização
    } = body;

    if (!name || typeof price !== 'number' || typeof quantity !== 'number') {
      return NextResponse.json({ error: 'Nome, preço e quantidade são obrigatórios e devem ser números.' }, { status: 400 });
    }

    if (quantity < 0) {
        return NextResponse.json({ error: 'Quantidade não pode ser negativa.' }, { status: 400 });
    }

    if (onPromotion && (typeof originalPrice !== 'number' || originalPrice <= price)) {
      return NextResponse.json({ error: 'Se em promoção, o preço original deve ser fornecido e maior que o preço promocional.' }, { status: 400 });
    }
    if (!onPromotion && originalPrice != null) {
      return NextResponse.json({ error: 'Preço original só é aplicável quando o produto está em promoção.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este produto' }, { status: 403 });
    }

    const updateData: any = {
      name,
      description,
      price,
      onPromotion: onPromotion || false, 
      originalPrice: onPromotion ? originalPrice : null, 
      imageUrls,
      quantity, // Adicionando quantity aos dados de atualização
    };

    if (categoryIds && Array.isArray(categoryIds)) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id })), 
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { 
        categories: true,
      }
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error instanceof SyntaxError) { 
        return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { productId } = params;

  if (!productId) {
    return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Você não tem permissão para remover este produto' }, { status: 403 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Produto removido com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao remover produto' }, { status: 500 });
  }
}