// app/api/sales/[reservationId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sendOrderCompletionEmail } from '@/lib/resend';
import { UserRole, ReservationStatus } from '@prisma/client';

// Interface para os parâmetros da rota dinâmica
interface RouteParams {
  params: {
    reservationId: string;
  };
}

// Schema de validação para a atualização de status vinda do frontend
const updateReservationSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

/**
 * PATCH: Atualiza o status de uma reserva (venda).
 * - Acessível por Vendedores (SELLER) e Administradores (ADMIN).
 * - Deduz o estoque do produto somente quando o status muda para 'COMPLETED'.
 * - Envia um e-mail de notificação ao cliente quando a venda é concluída.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    // Validação de permissão
    if (!session?.user?.id || (session.user.role !== UserRole.SELLER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { reservationId } = params;
    const body = await request.json();
    
    // Validação dos dados recebidos
    const validation = updateReservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Status inválido', errors: validation.error.errors }, { status: 400 });
    }

    // Mapeia o status do frontend para o status do banco de dados
    const { status: frontendStatus } = validation.data;
    const newDbStatus: ReservationStatus = frontendStatus === 'COMPLETED' ? ReservationStatus.SOLD : ReservationStatus.CANCELED;

    // Utiliza uma transação para garantir a consistência dos dados
    const updatedReservation = await prisma.$transaction(async (tx) => {
      // 1. Busca a reserva para garantir que ela existe e pertence ao vendedor logado
      const reservation = await tx.reservation.findFirst({
        where: { 
          id: reservationId, 
          product: { userId: session.user!.id } 
        },
        include: { 
          product: true, // Inclui dados completos do produto
          user: true,    // Inclui dados completos do cliente (user)
        },
      });

      if (!reservation) {
        throw new Error('Reserva não encontrada ou não pertence a você.');
      }
      
      // Impede a modificação de uma reserva que já foi finalizada
      if (reservation.status === ReservationStatus.SOLD || reservation.status === ReservationStatus.CANCELED) {
        throw new Error(`Esta reserva já foi finalizada como ${reservation.status}.`);
      }
      
      // 2. Lógica de atualização de estoque
      if (newDbStatus === ReservationStatus.SOLD) {
        // Verifica se há estoque suficiente antes de decrementar
        if (reservation.product.quantity < reservation.quantity) {
          throw new Error("Estoque insuficiente para confirmar esta venda. O produto pode ter sido vendido em outra reserva.");
        }
        // Decrementa o estoque APENAS na confirmação da venda
        await tx.product.update({
          where: { id: reservation.productId },
          data: {
            quantity: {
              decrement: reservation.quantity,
            },
          },
        });
      }
      // Se a reserva for cancelada, o estoque não é alterado, pois ele não foi deduzido na reserva inicial.
      
      // 3. Atualiza o status da reserva no banco de dados
      const finalReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: newDbStatus },
      });

      // 4. Se a venda for concluída, envia um e-mail de notificação para o cliente
      if (newDbStatus === ReservationStatus.SOLD && reservation.user.email) {
        await sendOrderCompletionEmail({
            clientEmail: reservation.user.email,
            clientName: reservation.user.name,
            productName: reservation.product.name,
            productId: reservation.product.id,
            sellerName: session.user?.name ?? null, 
        });
      }
      
      return finalReservation;
    });

    return NextResponse.json(updatedReservation, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao atualizar reserva pelo vendedor:", error);
    return NextResponse.json({ message: error.message || 'Não foi possível atualizar a reserva' }, { status: 500 });
  }
}
