import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getMobileUserId(req: NextRequest): Promise<string | null> {
  const authorizationHeader = req.headers.get('authorization');
  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.substring(7);
    try {
      const decoded = await decode({
        token: token,
        secret: authOptions.secret!,
      });
      if (decoded && typeof decoded.id === 'string') {
        return decoded.id;
      }
    } catch (error) {
      console.error('Erro ao decodificar token mobile:', error);
    }
  }
  return null;
}
