// app/api/pix/status/[txid]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { txid: string } }
) {
  const { txid } = params;

  if (!txid) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  try {
    const pixPayment = await prisma.pixPayment.findUnique({
      where: { txid },
      select: {
        status: true,
      },
    });

    if (!pixPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ status: pixPayment.status });
  } catch (error) {
    console.error('Error fetching Pix payment status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}