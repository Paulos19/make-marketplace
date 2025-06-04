import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface RouteContext {
  params: {
    userId?: string;
  };
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    if (userId === session.user.id) {
      return NextResponse.json({ message: 'Admin cannot delete self' }, { status: 400 });
    }
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ message: 'User deleted successfully', deletedUser }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user for admin:', error);
    if (error === 'P2025') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Could not delete user' }, { status: 500 });
  }
}