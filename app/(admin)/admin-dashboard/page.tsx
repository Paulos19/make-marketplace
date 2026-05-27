import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { DashboardClient } from "./components/DashboardClient"; 

async function getStats() {
  const [userCount, productCount, categoryCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count()
  ]);
  return { userCount, productCount, categoryCount };
}

export default async function AdminDashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/');
  }

  const { userCount, productCount, categoryCount } = await getStats();

  return (
    <div className="flex-1 w-full flex">
      <DashboardClient 
        userCount={userCount}
        productCount={productCount}
        categoryCount={categoryCount}
        userName={session.user.name || 'Admin'}
      />
    </div>
  );
}