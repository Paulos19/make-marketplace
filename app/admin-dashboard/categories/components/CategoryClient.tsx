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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";

// Tipagem para os dados iniciais, incluindo a contagem de produtos
type CategoryWithCount = Category & {
  _count: {
    products: number;
  };
};

interface CategoryClientProps {
  initialData: CategoryWithCount[];
}

export function CategoryClient({ initialData }: CategoryClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para os modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [currentCategory, setCurrentCategory] = useState<CategoryWithCount | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const handleOpenAddModal = () => {
    setCurrentCategory(null);
    setCategoryName("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (category: CategoryWithCount) => {
    setCurrentCategory(category);
    setCategoryName(category.name);
    setIsEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (category: CategoryWithCount) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
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
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      router.refresh(); // Atualiza os dados da página (Server Component)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
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
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleOpenAddModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Categoria
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Categorias Existentes</CardTitle>
          <CardDescription>Adicione, edite ou remova as categorias de produtos da sua loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Categoria</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditModal(category)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleOpenDeleteModal(category)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para Adicionar/Editar Categoria */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={isAddModalOpen ? setIsAddModalOpen : setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para Excluir Categoria */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p>Tem certeza que deseja excluir a categoria "<strong>{currentCategory?.name}</strong>"?</p>
          <p className="text-sm text-red-500">Atenção: Esta ação só será possível se nenhum produto estiver utilizando esta categoria.</p>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}