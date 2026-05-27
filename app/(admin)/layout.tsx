import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { AdminLayoutShell } from './admin-dashboard/components/AdminLayoutShell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    redirect('/');
  }

  return (
    <AdminLayoutShell user={{ name: session.user.name, image: session.user.image }}>
        {children}
    </AdminLayoutShell>
  );
}