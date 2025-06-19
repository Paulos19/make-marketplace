import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import crypto from 'crypto'
// Importa a nova função da sua biblioteca
import { sendReviewRequestEmail } from '@/lib/resend'

// A assinatura da função foi alterada para receber apenas 'NextRequest'
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const reservationId = pathParts[pathParts.length - 1]

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID da reserva não fornecido na URL.' },
        { status: 400 },
      )
    }

    const reservationToValidate = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { product: true },
    })

    if (!reservationToValidate) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 },
      )
    }

    if (reservationToValidate.product.userId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const reviewToken = crypto.randomBytes(32).toString('hex')

    const updatedReservation = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: reservationToValidate.productId },
        data: {
          isSold: true,
          isReserved: false,
        },
      })

      const reservation = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: 'SOLD',
          reviewToken: reviewToken,
        },
        include: {
          product: { include: { user: true } },
          user: true,
        },
      })
      return reservation
    })

    // CORRIGIDO: Agora usa a nova função da biblioteca para disparar o email
    await sendReviewRequestEmail({
      to: updatedReservation.user.email!,
      buyerName: updatedReservation.user.name || 'Comprador',
      productName: updatedReservation.product.name,
      sellerName: updatedReservation.product.user.name || 'Vendedor',
      reviewToken: reviewToken,
    })

    return NextResponse.json(updatedReservation)
  } catch (error) {
    console.error('Erro ao confirmar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
