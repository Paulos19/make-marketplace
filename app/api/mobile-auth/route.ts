import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Import authOptions
import prisma from '@/lib/prisma'; // Import prisma
import bcrypt from 'bcryptjs'; // Import bcrypt
import { encode } from 'next-auth/jwt'; // Import encode for JWT

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Check if a session already exists (optional, but good practice)
    const session = await getServerSession(authOptions);
    if (session) {
      return NextResponse.json({ message: 'Already logged in', user: session.user }, { status: 200 });
    }

    // --- Replicate CredentialsProvider authorize logic ---
    if (!email || !password) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // User authenticated successfully. Now, create a JWT for the mobile app.
    const token = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        whatsappLink: user.whatsappLink,
        storeName: user.storeName,
      },
      secret: authOptions.secret!,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }, { status: 200 });

  } catch (error: any) {
    console.error('Error in mobile-auth API:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}