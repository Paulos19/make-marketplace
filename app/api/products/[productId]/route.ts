import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { ProductCondition, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const productUpdateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0.01).optional(),
  originalPrice: z.number().optional().nullable(),
  images: z.array(z.string()).min(1).optional(),
  categoryId: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  condition: z.nativeEnum(ProductCondition).optional(),
  onPromotion: z.boolean().optional(),
  isService: z.boolean().optional(),
  isSold: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { productId } = params;

    if (!session?.user?.id) {
      return new NextResponse('Não autenticado', { status: 401 });
    }

    if (!productId) {
      return new NextResponse('ID do produto não encontrado', { status: 400 });
    }
    
    const validation = productUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten() }, { status: 400 });
    }
    
    const productToUpdate = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productToUpdate) {
      return new NextResponse('Produto não encontrado', { status: 404 });
    }

    if (productToUpdate.userId !== session.user.id && session.user.role !== UserRole.ADMIN) {
      return new NextResponse('Não autorizado', { status: 403 });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: validation.data,
    });
    
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/dashboard`);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`[PRODUCT_PATCH]`, error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}

export async function GET(
    req: Request,
    { params }: { params: { productId: string } }
  ) {
    try {
      if (!params.productId) {
        return new NextResponse("Product id is required", { status: 400 });
      }
  
      const product = await prisma.product.findUnique({
        where: {
          id: params.productId,
        },
        include: {
          user: true,
          category: true,
          reservations: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
      });
    
      return NextResponse.json(product);
    } catch (error) {
      console.error('[PRODUCT_GET]', error);
      return new NextResponse("Internal error", { status: 500 });
    }
};

export async function DELETE(
    req: Request,
    { params }: { params: { productId: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id) {
        return new NextResponse("Unauthenticated", { status: 403 });
      }
  
      if (!params.productId) {
        return new NextResponse("Product id is required", { status: 400 });
      }
  
      const product = await prisma.product.findUnique({
        where: {
          id: params.productId,
        }
      });
  
      if (product?.userId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
  
      await prisma.product.delete({
        where: {
          id: params.productId,
        },
      });
  
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('[PRODUCT_DELETE]', error);
      return new NextResponse("Internal error", { status: 500 });
    }
};
