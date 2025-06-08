import prisma from "@/lib/prisma";
import { ProductForm } from "./components/ProductForm"; // O formulário será um componente separado
import Navbar from "@/app/components/layout/Navbar";

// Função para buscar as categorias no servidor
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return categories;
  } catch (error) {
    console.error("Falha ao buscar categorias para o formulário:", error);
    return [];
  }
}

export default async function AddProductPage() {
  // Busca os dados no servidor antes de renderizar a página
  const categories = await getCategories();

  return (
    <>
    <Navbar/>
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas filter drop-shadow-sm">
          Adicionar um Novo Achadinho
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
          Preencha os dados do seu produto pra galera encontrar! Capricha, psit!
        </p>
      </header>

      {/* Renderiza o formulário como um Client Component, passando os dados iniciais */}
      <ProductForm availableCategories={categories} />
    </div>
    </>
  );
}