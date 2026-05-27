// app/admin-dashboard/homepage-sections/page.tsx
import prisma from "@/lib/prisma";
import { HomepageSectionsClient } from "./components/HomepageSectionsClient";

// Função para buscar os dados no servidor
async function getHomepageSections() {
  try {
    const sections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error("Falha ao buscar seções da homepage:", error);
    return [];
  }
}

// Função para buscar todos os produtos para o seletor do formulário
async function getAllProducts() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                images: true, // Para mostrar uma miniatura no seletor
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
        return products;
    } catch (error) {
        console.error("Falha ao buscar produtos para o seletor:", error);
        return [];
    }
}

export default async function AdminHomepageSectionsPage() {
  // Busca os dados necessários em paralelo
  const [sections, products] = await Promise.all([
    getHomepageSections(),
    getAllProducts()
  ]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Seções da Página Inicial</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-2 mb-6">
        Crie, edite, reordene e gerencie as seções de banner e produtos que aparecem na sua home.
      </p>

      {/* Passamos os dados para o componente cliente que cuidará da interatividade */}
      <HomepageSectionsClient initialData={sections} allProducts={products} />
    </>
  );
}