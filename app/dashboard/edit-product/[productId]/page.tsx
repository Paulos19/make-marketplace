import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserRole } from '@prisma/client';
import { ProductForm } from '../../add-product/components/ProductForm';

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

// Função para buscar categorias, igual à da página de adicionar
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error("Falha ao buscar categorias para o formulário de edição:", error);
    return [];
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions);
  const { productId } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Busca os dados do produto E as categorias em paralelo
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id: productId,
      },
    }),
    getCategories()
  ]);

  if (!product) {
    notFound();
  }

  if (product.userId !== session.user.id && session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    // Removido o <Navbar/> e o <div> extra.
    // O conteúdo agora será renderizado diretamente dentro do <main> do layout.
    <Card>
        <CardHeader>
            <CardTitle className='text-2xl'>Editar Item</CardTitle>
            <CardDescription>Faça alterações no seu produto ou serviço. Clique em salvar quando terminar.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Passa tanto os dados do produto quanto a lista de categorias para o formulário */}
            <ProductForm initialData={product} availableCategories={categories} />
        </CardContent>
    </Card>
  );
}
