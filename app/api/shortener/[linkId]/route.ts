// app/api/shortener/[linkId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateLinkSchema = z.object({
    originalUrl: z.string().url("URL inválida.").optional(),
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url("URL da imagem inválida.").optional().nullable(),
});

interface RouteParams {
    params: {
        linkId: string;
    };
}

// PUT: Atualiza um link encurtado existente
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const link = await prisma.shortLink.findFirst({
            where: { id: params.linkId, userId: session.user.id },
        });

        if (!link) {
            return NextResponse.json({ message: 'Link não encontrado ou você não tem permissão para editá-lo.' }, { status: 404 });
        }

        const body = await request.json();
        const validation = updateLinkSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: validation.error.errors[0].message }, { status: 400 });
        }

        const updatedLink = await prisma.shortLink.update({
            where: { id: params.linkId },
            data: validation.data,
        });

        return NextResponse.json(updatedLink, { status: 200 });

    } catch (error) {
        console.error("Erro ao atualizar link:", error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE: Exclui um link encurtado
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const link = await prisma.shortLink.findFirst({
            where: { id: params.linkId, userId: session.user.id },
        });

        if (!link) {
            return NextResponse.json({ message: 'Link não encontrado ou você não tem permissão para excluí-lo.' }, { status: 404 });
        }

        await prisma.shortLink.delete({
            where: { id: params.linkId },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("Erro ao excluir link:", error);
        return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
    }
}