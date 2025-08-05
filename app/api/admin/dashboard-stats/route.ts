import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Certifique-se que o caminho para o prisma está correto
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!month || !year) {
    return new NextResponse('Mês e ano são obrigatórios', { status: 400 });
  }

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 1); // Corrigido para o primeiro dia do próximo mês

  try {
    // Busca os produtos criados no período
    const products = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Busca os usuários criados no período
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // CORREÇÃO: Busca usuários criados no período que TÊM uma assinatura
    const subscriptions = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        // Filtra apenas usuários que possuem um ID de assinatura do Stripe
        stripeSubscriptionId: {
          not: null,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Agrupa os dados por dia
    const dataByDay = new Map<string, { products: number; users: number; subscriptions: number }>();

    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = i.toString().padStart(2, '0');
      const formattedMonth = month.toString().padStart(2, '0');
      const date = `${year}-${formattedMonth}-${day}`;
      dataByDay.set(date, { products: 0, users: 0, subscriptions: 0 });
    }

    products.forEach((p) => {
      const date = p.createdAt.toISOString().split('T')[0];
      if (dataByDay.has(date)) {
        const currentData = dataByDay.get(date)!;
        dataByDay.set(date, { ...currentData, products: currentData.products + 1 });
      }
    });

    users.forEach((u) => {
      const date = u.createdAt.toISOString().split('T')[0];
      if (dataByDay.has(date)) {
        const currentData = dataByDay.get(date)!;
        dataByDay.set(date, { ...currentData, users: currentData.users + 1 });
      }
    });

    subscriptions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (dataByDay.has(date)) {
        const currentData = dataByDay.get(date)!;
        dataByDay.set(date, { ...currentData, subscriptions: currentData.subscriptions + 1 });
      }
    });

    const chartData = Array.from(dataByDay.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return new NextResponse('Erro Interno do Servidor', { status: 500 });
  }
}