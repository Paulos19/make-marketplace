import prisma from "@/lib/prisma";
import { ProductForm } from "./components/ProductForm";
import { Badge } from "@/components/ui/badge";
import { PackagePlus } from "lucide-react";

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
  const categories = await getCategories();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full">
      
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900 to-slate-900 text-white shadow-lg p-8 md:p-10 flex flex-col items-center text-center gap-4 border border-white/10">
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-violet-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 translate-y-1/3 translate-x-1/3 w-80 h-80 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
              <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4 px-3 py-1">
                  Inventário
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Adicionar um Novo Achadinho</h1>
              <p className="text-white/70 max-w-xl mx-auto text-sm md:text-base">
                  Preencha os dados abaixo com o máximo de detalhe. Produtos com boas fotos e descrições claras têm 3x mais hipóteses de venda rápida.
              </p>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl">
          <ProductForm availableCategories={categories} />
      </div>
      
    </div>
  );
}
