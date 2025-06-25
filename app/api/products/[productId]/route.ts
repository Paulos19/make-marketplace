import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { UserRole, ProductCondition } from '@prisma/client'
import { z } from 'zod'

const updateProductSchema = z.object({
    name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
    description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
    price: z.number().min(0.01, 'O preço deve ser maior que zero.'),
    onPromotion: z.boolean().default(false),
    originalPrice: z.number().optional().nullable(),
    images: z.array(z.string()).min(1, 'Pelo menos uma imagem é necessária.'),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    quantity: z.number().int().min(1, 'A quantidade deve ser de pelo menos 1.'),
    condition: z.nativeEnum(ProductCondition),
  });


// Handler GET para buscar um único produto por ID
export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    if (!productId) {
      return new NextResponse('ID do produto não fornecido', { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        user: true, // Inclui o vendedor
      },
    })

    if (!product) {
      return new NextResponse('Produto não encontrado', { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_GET]', error)
    return new NextResponse('Erro interno do servidor', { status: 500 })
  }
}


// Handler PATCH para atualizar um produto existente
export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { productId } = params;
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
    }

    const body = await req.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, description, price, originalPrice, images, categoryId, quantity, condition, onPromotion } = validation.data;
    
    // Garante que apenas o dono do produto (ou um admin) possa editá-lo
    const productToUpdate = await prisma.product.findFirst({
        where: {
            id: productId,
            userId: session.user.role === UserRole.ADMIN ? undefined : session.user.id,
        }
    });

    if (!productToUpdate) {
        return NextResponse.json({ error: 'Produto não encontrado ou permissão negada.' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        description,
        price,
        originalPrice: onPromotion ? originalPrice : null,
        images,
        quantity,
        condition,
        onPromotion,
        categoryId,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('[PRODUCT_PATCH_ERROR]', error);
    if (error instanceof z.ZodError) {
        return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao atualizar o produto.' }, { status: 500 });
  }
}


// Handler DELETE para excluir um produto
export async function DELETE(
    req: Request,
    { params }: { params: { productId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Não autorizado', { status: 401 });
        }
        
        const { productId } = params;
        if (!productId) {
            return new NextResponse('ID do produto não fornecido', { status: 400 });
        }

        const productToDelete = await prisma.product.findFirst({
            where: {
                id: productId,
                userId: session.user.role === UserRole.ADMIN ? undefined : session.user.id,
            }
        });
    
        if (!productToDelete) {
            return new NextResponse('Produto não encontrado ou permissão negada', { status: 404 });
        }

        await prisma.product.delete({
            where: {
                id: productId
            }
        });

        return new NextResponse('Produto excluído com sucesso', { status: 200 });

    } catch (error) {
        console.error('[PRODUCT_DELETE]', error);
        return new NextResponse('Erro interno do servidor', { status: 500 });
    }
}
