import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserRole } from '@prisma/client';
import { ProductForm } from '../../add-product/components/ProductForm';
import Navbar from '@/app/components/layout/Navbar';

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

// A página agora é um Server Component assíncrono
export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions);

  // Redireciona se o utilizador não estiver logado
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Busca os dados do produto diretamente no servidor
  const product = await prisma.product.findUnique({
    where: {
      id: params.productId,
    },
  });

  // Se o produto não for encontrado, exibe a página 404
  if (!product) {
    notFound();
  }

  // Garante que apenas o dono do produto ou um admin possam editar
  if (product.userId !== session.user.id && session.user.role !== UserRole.ADMIN) {
    // Redireciona para o dashboard se não tiver permissão
    redirect('/dashboard');
  }

  return (
    <>
    <Navbar/>
    <div className="m-4 md:m-8">
        <Card>
            <CardHeader>
                <CardTitle className='text-2xl'>Editar Produto</CardTitle>
                <CardDescription>Faça alterações no seu produto. Clique em salvar quando terminar.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Passa os dados do produto (initialData) para o formulário.
                  O formulário continua a ser um Client Component, mas agora ele
                  recebe os dados iniciais de forma segura a partir do servidor.
                */}
                <ProductForm initialData={product} />
            </CardContent>
        </Card>
    </div>
    </>
  );
}
