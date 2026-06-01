import prisma from "@/lib/prisma";
import { CategoryClient } from "./components/CategoryClient";

// Função para buscar os dados no servidor
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error("Falha ao buscar categorias:", error);
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Gerenciamento de Categorias</h1>
      </div>
      
      <CategoryClient initialData={categories} />
    </>
  );
}