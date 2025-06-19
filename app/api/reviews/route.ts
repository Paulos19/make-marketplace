import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  try {
    const { token, rating, comment } = await request.json()

    if (!token || !rating) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { reviewToken: token },
      include: { product: true }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Token de avaliação inválido ou já utilizado' }, { status: 404 })
    }
    
    // Opcional: Verifica se o usuário logado é o mesmo da reserva
    // if (session?.user?.id !== reservation.userId) {
    //     return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    // }

    const newReview = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        reservationId: reservation.id,
        sellerId: reservation.product.userId,
        buyerId: reservation.userId,
      },
    })
    
    // Invalida o token após o uso
    await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reviewToken: null }
    })

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar avaliação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
