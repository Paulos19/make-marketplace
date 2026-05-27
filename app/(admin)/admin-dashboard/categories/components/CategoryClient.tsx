"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client"; // Importa o tipo Category gerado pelo Prisma

// Tipagem para os dados iniciais, incluindo a contagem de produtos
type CategoryWithCount = Category & {
  _count: {
    products: number;
  };
};

interface CategoryClientProps {
  initialData: CategoryWithCount[];
}

function AIGenerationCard({ onGenerationComplete }: { onGenerationComplete: () => void }) {
  const [generationCount, setGenerationCount] = useState(3); // Padrão para 3 categorias
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (generationCount < 1 || generationCount > 10) {
      toast.error("Por favor, insira um número de 1 a 10 para gerar categorias.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/categories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: Number(generationCount) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Falha ao gerar categorias com IA.");
      
      toast.success(data.message || "Categorias geradas!", {
        description: data.newCategories && data.newCategories.length > 0 
          ? `Novas categorias: ${data.newCategories.join(', ')}`
          : "Nenhuma nova categoria única foi adicionada.",
      });
      onGenerationComplete(); // Chama a função para atualizar a lista principal
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro na geração com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mb-6 bg-gradient-to-tr from-zaca-lilas/20 to-zaca-azul/20 dark:from-zaca-lilas/10 dark:to-zaca-azul/10 border-zaca-roxo/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zaca-roxo dark:text-zaca-lilas font-bangers tracking-wider">
          <Sparkles className="h-5 w-5" />
          Gerador de Categorias com IA (Gemini)
        </CardTitle>
        <CardDescription>
          Sem ideias? Deixe a IA do Gemini criar novas categorias relevantes para seus produtos de maquiagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-end gap-4">
        <div className="w-full sm:w-auto flex-grow">
          <Label htmlFor="ai-count" className="text-sm font-medium">Nº de categorias a gerar</Label>
          <Input 
            id="ai-count" 
            type="number" 
            value={generationCount}
            onChange={(e) => setGenerationCount(Number(e.target.value))}
            min="1"
            max="10" // Limite para não sobrecarregar ou gerar muitas de uma vez
            className="mt-1 h-10 dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto bg-zaca-magenta hover:bg-zaca-magenta/90 text-white">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Sugerir com IA
        </Button>
      </CardContent>
    </Card>
  )
}

export function CategoryClient({ initialData }: CategoryClientProps) {
  const router = useRouter();
  // Não é necessário useState para 'categories' se router.refresh() for usado para buscar dados atualizados
  // const [categories, setCategories] = useState(initialData); // Pode ser removido
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentCategory, setCurrentCategory] = useState<CategoryWithCount | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const handleOpenAddModal = () => {
    setCurrentCategory(null);
    setCategoryName("");
    setIsAddOrEditModalOpen(true);
  };

  const handleOpenEditModal = (category: CategoryWithCount) => {
    setCurrentCategory(category);
    setCategoryName(category.name);
    setIsAddOrEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (category: CategoryWithCount) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
        toast.error("O nome da categoria não pode estar vazio.");
        return;
    }
    setIsLoading(true);
    const isEditing = !!currentCategory;
    const url = isEditing ? `/api/admin/categories/${currentCategory.id}` : '/api/admin/categories';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao salvar categoria.');
      
      toast.success(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
      setIsAddOrEditModalOpen(false);
      router.refresh(); // Atualiza os dados da página (Server Component)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao salvar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/categories/${currentCategory.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao excluir categoria.');
      
      toast.success("Categoria excluída com sucesso!");
      setIsDeleteModalOpen(false);
      router.refresh(); // Atualiza os dados da página
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro ao excluir.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AIGenerationCard onGenerationComplete={() => router.refresh()} />

      <div className="flex justify-end mb-6">
        <Button onClick={handleOpenAddModal} className="bg-zaca-azul hover:bg-zaca-azul/90 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Categoria
        </Button>
      </div>
      <Card className="shadow-lg dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="font-bangers text-zaca-roxo dark:text-zaca-lilas tracking-wide">Categorias Existentes</CardTitle>
          <CardDescription>Gerencie as categorias de produtos do seu marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          {initialData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Nome da Categoria</TableHead>
                  <TableHead className="text-center">Produtos</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-center">{category._count.products}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEditModal(category)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-500 focus:text-red-600 dark:focus:text-red-500" 
                            onClick={() => handleOpenDeleteModal(category)}
                            disabled={category._count.products > 0} // Desabilita se houver produtos
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhuma categoria cadastrada ainda. Que tal adicionar uma ou usar a IA para gerar ideias?</p>
          )}
        </CardContent>
      </Card>

      {/* Modal para Adicionar/Editar Categoria */}
      <Dialog open={isAddOrEditModalOpen} onOpenChange={setIsAddOrEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="font-bangers text-zaca-roxo dark:text-zaca-lilas">
                {currentCategory ? 'Editar Categoria do Zaca' : 'Adicionar Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input 
              id="category-name" 
              value={categoryName} 
              onChange={(e) => setCategoryName(e.target.value)} 
              placeholder="Ex: Sombras Poderosas"
              className="dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveCategory} disabled={isLoading} className="bg-zaca-magenta hover:bg-zaca-magenta/90 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {currentCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para Excluir Categoria */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
          <DialogHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500"/>
            <DialogTitle className="font-bangers text-red-600 dark:text-red-400">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            Tem certeza que deseja excluir a categoria "<strong>{currentCategory?.name}</strong>"? 
            {currentCategory && currentCategory._count.products > 0 
                ? <span className="block text-red-500 mt-2">Esta categoria não pode ser excluída pois possui {currentCategory._count.products} produto(s) associado(s).</span> 
                : <span className="block mt-2">Esta ação não pode ser desfeita.</span>
            }
          </DialogDescription>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button 
                variant="destructive" 
                onClick={handleDeleteCategory} 
                disabled={isLoading || (currentCategory?._count.products ?? 0) > 0}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
