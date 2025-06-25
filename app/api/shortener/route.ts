import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// <<< INÍCIO DA CORREÇÃO >>>
// O schema foi atualizado para aceitar `null` nos campos opcionais,
// tornando a API mais robusta contra diferentes tipos de dados do frontend.
const shortenerSchema = z.object({
  originalUrl: z.string().url({ message: "URL original inválida." }),
  productId: z.string().cuid({ message: "ID do produto inválido." }).optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});
// <<< FIM DA CORREÇÃO >>>

const generateShortCode = async (): Promise<string> => {
    const code = Math.random().toString(36).substring(2, 8);
    const existing = await prisma.shortLink.findUnique({ where: { shortCode: code } });
    return existing ? generateShortCode() : code;
};

// Handler POST para criar um novo link encurtado
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const validation = shortenerSchema.safeParse(body);
    if (!validation.success) {
      // Este log ajuda a depurar, mostrando o erro de validação exato no servidor
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
    console.error('[SHORTENER_POST_ERROR]', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}

// Handler GET para buscar a lista de links do utilizador
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
    
        const userLinks = await prisma.shortLink.findMany({
          where: {
            userId: session.user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
    
        return NextResponse.json(userLinks);
        
      } catch (error) {
        console.error('[SHORTENER_GET_ERROR]', error);
        return new NextResponse('Erro interno do servidor', { status: 500 });
      }
}
