import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getMobileUserId } from '../auth-helper';

const shortenerSchema = z.object({
  originalUrl: z.string().url({ message: "URL original inválida." }),
  productId: z.string().cuid({ message: "ID do produto inválido." }).optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

const generateShortCode = async (): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 8);
    const existing = await prisma.shortLink.findUnique({ where: { shortCode: code } });
    return existing ? generateShortCode() : code;
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getMobileUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const validation = shortenerSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation Error:', validation.error.flatten());
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }
    const { originalUrl, productId, title, description, imageUrl } = validation.data;
    
    let ownerId: string;
    
    if (productId) {
        const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true } });
        if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
        ownerId = product.userId;
    } else {
        const sellerIdFromUrl = new URL(originalUrl).pathname.split('/').pop();
        if (!sellerIdFromUrl) return NextResponse.json({ error: 'ID do vendedor inválido no URL.' }, { status: 400 });
        ownerId = sellerIdFromUrl;
    }

    let existingLink;
    if (productId) {
      existingLink = await prisma.shortLink.findFirst({
        where: { userId: ownerId, productId: productId },
      });
    } else {
      existingLink = await prisma.shortLink.findFirst({
        where: { userId: ownerId, productId: null },
      });
    }

    if (existingLink) {
      return NextResponse.json({ shortCode: existingLink.shortCode });
    }

    const shortCode = await generateShortCode();
    const newLink = await prisma.shortLink.create({
      data: {
        originalUrl,
        shortCode,
        userId: ownerId,
        productId,
        title: title || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      },
    });

    return NextResponse.json({ shortCode: newLink.shortCode }, { status: 201 });

  } catch (error) {
    console.error('[MOBILE_SHORTENER_POST_ERROR]', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
