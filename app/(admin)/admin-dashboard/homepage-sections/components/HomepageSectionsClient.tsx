// app/admin-dashboard/homepage-sections/components/HomepageSectionsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion, Reorder } from "framer-motion"; // <<< IMPORTE O REORDER
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, PlusCircle, Trash2, Edit, LayoutTemplate, AlertTriangle, Loader2, GripVertical } from "lucide-react"; // <<< IMPORTE O GRIP
import { HomepageSection, Product } from "@prisma/client";
import { HomepageSectionForm } from "./HomepageSectionForm";

interface HomepageSectionsClientProps {
  initialData: HomepageSection[];
  allProducts: Pick<Product, 'id' | 'name' | 'images'>[];
}

export function HomepageSectionsClient({ initialData, allProducts }: HomepageSectionsClientProps) {
  const router = useRouter();
  const [sections, setSections] = useState(initialData);
  const [isOrderDirty, setIsOrderDirty] = useState(false); // <<< ESTADO PARA MUDANÇA NA ORDEM
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<HomepageSection | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // <<< FUNÇÃO PARA SALVAR A NOVA ORDEM >>>
  const handleSaveOrder = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/homepage-sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      if (!response.ok) throw new Error("Falha ao salvar a nova ordem.");
      toast.success("Ordem das seções salva com sucesso!");
      setIsOrderDirty(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (funções handleOpenForm, handleOpenDeleteAlert, e handleDelete permanecem as mesmas) ...
  const handleOpenForm = (section: HomepageSection | null = null) => {
    setCurrentSection(section);
    setIsFormOpen(true);
  };

  const handleOpenDeleteAlert = (section: HomepageSection) => {
    setCurrentSection(section);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDelete = async () => {
    if (!currentSection) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/homepage-sections/${currentSection.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Falha ao excluir a seção.");
      toast.success("Seção excluída com sucesso!");
      router.refresh(); 
      setIsDeleteAlertOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        {/* <<< BOTÃO DE SALVAR ORDEM APARECE QUANDO HÁ MUDANÇAS >>> */}
        <AnimatePresence>
            {isOrderDirty && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <Button onClick={handleSaveOrder} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar Ordem
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Seção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seções Atuais</CardTitle>
          <CardDescription>Arraste e solte pelo ícone à esquerda para reordenar as seções.</CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            // <<< WRAPPER PARA REORDENAÇÃO >>>
            <Reorder.Group axis="y" values={sections} onReorder={(newOrder) => { setSections(newOrder); setIsOrderDirty(true); }}>
              <div className="space-y-4">
                {sections.map((section) => (
                  <Reorder.Item key={section.id} value={section}>
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-800/50 cursor-grab active:cursor-grabbing">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground"/>
                        <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{section.title}</p>
                          <p className="text-sm text-muted-foreground">{section.isActive ? "Ativa" : "Inativa"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenForm(section)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteAlert(section)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </div>
            </Reorder.Group>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma seção criada ainda.</p>
          )}
        </CardContent>
      </Card>

      {/* Dialogs de criar/editar e deletar (código inalterado) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentSection ? 'Editar Seção' : 'Criar Nova Seção'}</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo para configurar a seção da sua homepage.</DialogDescription>
          </DialogHeader>
          <HomepageSectionForm currentSection={currentSection} allProducts={allProducts} onSuccess={() => { setIsFormOpen(false); router.refresh(); }}/>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500"/>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza que deseja excluir a seção "<strong>{currentSection?.title}</strong>"? Esta ação não poderá ser desfeita.</DialogDescription></DialogHeader>
            <DialogFooter className="sm:justify-end gap-2"><DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose><Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sim, excluir seção</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}