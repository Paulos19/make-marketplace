// app/s/[shortCode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    shortCode: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shortCode } = params;
    // Identifica se a requisição vem de um bot de rede social para evitar contar como clique
    const userAgent = request.headers.get('user-agent') || '';
    const isSocialBot = /whatsapp|facebook|twitter|pinterest|telegram|slack/i.test(userAgent);

    if (!shortCode) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const link = await prisma.shortLink.findUnique({
      where: { shortCode },
    });

    if (!link) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Incrementa o contador de cliques apenas se não for um bot
    if (!isSocialBot) {
      await prisma.shortLink.update({
        where: { id: link.id },
        data: { clicks: { increment: 1 } },
      });
    }

    // Retorna uma página HTML com meta tags para a pré-visualização e um meta refresh para redirecionar o usuário
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${link.title || 'Redirecionando...'}</title>
          <meta property="og:title" content="${link.title || 'Link do Zacaplace'}" />
          <meta property="og:description" content="${link.description || link.originalUrl}" />
          ${link.imageUrl ? `<meta property="og:image" content="${link.imageUrl}" />` : ''}
          <meta http-equiv="refresh" content="0; url=${link.originalUrl}" />
        </head>
        <body>
          <p>Redirecionando para: <a href="${link.originalUrl}">${link.originalUrl}</a></p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Erro no redirecionamento do link:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}