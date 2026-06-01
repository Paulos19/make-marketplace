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
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & {
  _count: {
    products: number;
  };
};

interface CategoryClientProps {
  initialData: CategoryWithCount[];
}

function AIGenerationCard({ onGenerationComplete }: { onGenerationComplete: () => void }) {
  const [generationCount, setGenerationCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (generationCount < 1 || generationCount > 10) {
      toast.error("Limite inválido", {
        description: "Insira um número de 1 a 10 para gerar categorias.",
      });
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
      
      toast.success("Categorias geradas com sucesso!", {
        description: data.newCategories && data.newCategories.length > 0 
          ? `Novas: ${data.newCategories.join(', ')}`
          : "Nenhuma nova categoria única foi adicionada.",
      });
      onGenerationComplete();
    } catch (error) {
      toast.error("Erro na geração", {
        description: error instanceof Error ? error.message : "Ocorreu um erro na geração com IA.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mb-6 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          Gerador de Categorias com IA
        </CardTitle>
        <CardDescription>
          Sem ideias? Deixe a IA do Gemini criar novas categorias relevantes para o marketplace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-end gap-4">
        <div className="w-full sm:w-auto flex-grow">
          <Label htmlFor="ai-count">Nº de categorias a gerar</Label>
          <Input 
            id="ai-count" 
            type="number" 
            value={generationCount}
            onChange={(e) => setGenerationCount(Number(e.target.value))}
            min="1"
            max="10"
            className="mt-1 h-10 max-w-xs"
          />
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Sugerir com IA
        </Button>
      </CardContent>
    </Card>
  )
}

export function CategoryClient({ initialData }: CategoryClientProps) {
  const router = useRouter();
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
        toast.error("Campo obrigatório", {
          description: "O nome da categoria não pode estar vazio."
        });
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
      
      toast.success(isEditing ? "Categoria atualizada!" : "Categoria criada!", {
        description: `A categoria "${categoryName}" foi salva com sucesso.`
      });
      setIsAddOrEditModalOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Erro ao salvar", {
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar."
      });
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
      router.refresh();
    } catch (error) {
      toast.error("Erro ao excluir", {
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AIGenerationCard onGenerationComplete={() => router.refresh()} />

      <div className="flex justify-end mb-4">
        <Button onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias Existentes</CardTitle>
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenEditModal(category)}>
                            <Edit className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            variant="destructive"
                            onClick={() => handleOpenDeleteModal(category)}
                            disabled={category._count.products > 0}
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
            <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada ainda.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOrEditModalOpen} onOpenChange={setIsAddOrEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
                {currentCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input 
              id="category-name" 
              value={categoryName} 
              onChange={(e) => setCategoryName(e.target.value)} 
              placeholder="Ex: Celulares"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSaveCategory} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                {currentCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive"/>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            Tem certeza que deseja excluir a categoria "<strong>{currentCategory?.name}</strong>"? 
            {currentCategory && currentCategory._count.products > 0 
                ? <span className="block text-destructive mt-2">Esta categoria não pode ser excluída pois possui {currentCategory._count.products} produto(s) associado(s).</span> 
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
