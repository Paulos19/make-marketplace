// app/dashboard/link-shortener/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ImageUpload from '@/app/components/ImageUpload';
import { Link2, Copy, Loader2, Trash2, Edit, BarChart2, Share, AlertTriangle, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Navbar from '@/app/components/layout/Navbar';

const shortenerSchema = z.object({
  id: z.string().optional(),
  url: z.string().url({ message: "Por favor, insira uma URL válida." }),
  title: z.string().max(70, "O título deve ter no máximo 70 caracteres.").optional().nullable(),
  description: z.string().max(200, "A descrição deve ter no máximo 200 caracteres.").optional().nullable(),
  imageUrl: z.string().url("A URL da imagem deve ser válida.").optional().nullable(),
});

type ShortenerFormValues = z.infer<typeof shortenerSchema>;

interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  clicks: number;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

// Componente do formulário, reutilizável para criar e editar
const ShortenerForm = ({
  form,
  onSubmit,
  userId
}: {
  form: any;
  onSubmit: (data: ShortenerFormValues) => void;
  userId?: string;
}) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField name="url" control={form.control} render={({ field }) => (
        <FormItem>
          <FormLabel>URL Original</FormLabel>
          <FormControl><Input placeholder="https://seusite.com/produto-incrivel" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <Card className="bg-slate-50 dark:bg-slate-800/50 border-dashed">
        <CardHeader className="pb-2">
            <CardTitle className="text-base">Pré-visualização (Opcional)</CardTitle>
            <CardDescription className="text-xs">Esses dados aparecerão ao compartilhar o link no WhatsApp, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField name="title" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Título da Pré-visualização</FormLabel>
              <FormControl><Input placeholder="Ex: Promoção Imperdível!" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="description" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Descrição</FormLabel>
              <FormControl><Textarea placeholder="Descreva o que há no link." {...field} value={field.value ?? ""} rows={3} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="imageUrl" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Imagem</FormLabel>
              <FormControl><ImageUpload maxFiles={1} currentFiles={field.value ? [field.value] : []} onUploadComplete={(urls) => field.onChange(urls[0])} onRemoveFile={() => field.onChange("")} userId={userId} storagePath="shortener_images/" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </CardContent>
      </Card>
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {form.getValues('id') ? "Salvar Alterações" : "Encurtar Link"}
      </Button>
    </form>
  </Form>
);


export default function LinkShortenerPage() {
  const { data: session } = useSession();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null);

  const form = useForm<ShortenerFormValues>({
    resolver: zodResolver(shortenerSchema),
    defaultValues: { url: "", title: "", description: "", imageUrl: "" },
  });

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shortener');
      if (!response.ok) throw new Error("Falha ao buscar links.");
      const data = await response.json();
      setLinks(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar seus links.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const onSubmit = async (data: ShortenerFormValues) => {
    const isEditing = !!data.id;
    const apiEndpoint = isEditing ? `/api/shortener/${data.id}` : '/api/shortener';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Falha ao salvar o link.");
      
      toast.success(`Link ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      setIsFormOpen(false);
      fetchLinks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o link.");
    }
  };
  
  const handleEditClick = (link: ShortLink) => {
    setSelectedLink(link);
    form.reset({
        id: link.id,
        url: link.originalUrl,
        title: link.title || "",
        description: link.description || "",
        imageUrl: link.imageUrl || "",
    });
    setIsFormOpen(true);
  };
  
  const handleDeleteClick = (link: ShortLink) => {
    setSelectedLink(link);
    setIsDeleteOpen(true);
  }

  const onDeleteConfirm = async () => {
    if (!selectedLink) return;
    try {
        await fetch(`/api/shortener/${selectedLink.id}`, { method: 'DELETE' });
        toast.success("Link excluído com sucesso!");
        setIsDeleteOpen(false);
        fetchLinks();
    } catch (error) {
        toast.error("Falha ao excluir o link.");
    }
  }

  const copyToClipboard = (shortCode: string) => {
    const url = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Link encurtado copiado!");
  };

  return (
    <>
    <Navbar/>
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100"><Link2 /> Encurtador de Links</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie links curtos para compartilhar.</p>
        </div>
        <Button onClick={() => {
          setSelectedLink(null);
          form.reset({
            url: "",
            title: "",
            description: "",
            imageUrl: ""
          });
          setIsFormOpen(true);
        }} className="bg-zaca-azul hover:bg-zaca-azul/90 text-white">
          <PlusCircle className="mr-2 h-4 w-4"/> Criar Link
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Seus Links</CardTitle>
          <CardDescription>Gerencie todos os seus links encurtados aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Link</TableHead>
                            <TableHead className="hidden lg:table-cell">Destino Original</TableHead>
                            <TableHead className="text-center w-[100px]">Cliques</TableHead>
                            <TableHead className="text-right w-[150px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {links.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">Você ainda não criou nenhum link.</TableCell></TableRow>
                        ) : (
                        links.map(link => (
                            <TableRow key={link.id}>
                                <TableCell className="font-medium flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                        {link.imageUrl ? <Image src={link.imageUrl} alt="preview" fill className="object-cover" /> : <ImageIcon className="h-5 w-5 m-auto text-slate-400"/>}
                                    </div>
                                    <a href={`${window.location.origin}/s/${link.shortCode}`} target="_blank" className="text-zaca-azul hover:underline truncate">{`${window.location.origin.replace(/^https?:\/\//, '')}/s/${link.shortCode}`}</a>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell"><span className="truncate block max-w-md">{link.originalUrl}</span></TableCell>
                                <TableCell className="text-center font-bold text-lg">{link.clicks}</TableCell>
                                <TableCell className="text-right space-x-0">
                                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(link.shortCode)}><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(link)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(link)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedLink ? "Editar Link do Zaca" : "Criar Novo Link"}</DialogTitle>
            <DialogDescription>Preencha os detalhes abaixo. Os campos de pré-visualização são opcionais, mas recomendados.</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <ShortenerForm form={form} onSubmit={onSubmit} userId={session?.user?.id} />
          </div>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500"/>Confirmar Exclusão</DialogTitle>
                <DialogDescription>Tem certeza que deseja excluir este link? Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                <Button type="button" variant="destructive" onClick={onDeleteConfirm} disabled={!selectedLink}>Excluir</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
