'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Save, PlusCircle } from 'lucide-react';
import type { HomePageBanner } from '@prisma/client';
import { Switch } from '@/components/ui/switch';

// <<< INÍCIO DA CORREÇÃO >>>
// O schema foi ajustado. O .default(true) foi removido do campo 'isActive',
// pois o valor padrão já é tratado pelo hook useForm.
// Isso resolve o conflito de tipos que causava o erro.
const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }),
  linkUrl: z.string().url({ message: 'Por favor, insira uma URL de link válida.' }).optional().or(z.literal('')),
  isActive: z.boolean(),
});
// <<< FIM DA CORREÇÃO >>>

interface BannerFormProps {
  initialData: HomePageBanner | null;
  onSuccess: () => void;
}

export function BannerForm({ initialData, onSuccess }: BannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // O valor padrão para 'isActive' é definido aqui, que é a abordagem correta.
    defaultValues: initialData ? {
      title: initialData.title,
      imageUrl: initialData.imageUrl,
      linkUrl: initialData.linkUrl || '',
      isActive: initialData.isActive
    } : {
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: true,
    },
  });

  useEffect(() => {
    form.reset(initialData ? {
      title: initialData.title,
      imageUrl: initialData.imageUrl,
      linkUrl: initialData.linkUrl || '',
      isActive: initialData.isActive
    } : {
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: true
    });
  }, [initialData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const url = initialData ? `/api/admin/banners/${initialData.id}` : '/api/admin/banners';
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${initialData ? 'atualizar' : 'criar'} o banner.`);
      }

      toast.success(`Banner ${initialData ? 'atualizado' : 'criado'} com sucesso!`);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const title = initialData ? 'Editar Banner' : 'Adicionar Novo Banner';
  const description = initialData ? 'Faça alterações no seu banner existente.' : 'Crie um novo banner para a página inicial.';
  const buttonText = initialData ? 'Salvar Alterações' : 'Criar Banner';
  const ButtonIcon = initialData ? Save : PlusCircle;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Título do Banner</FormLabel><FormControl><Input placeholder="Ex: Promoção de Verão" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="imageUrl" render={({ field }) => (
            <FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input placeholder="https://exemplo.com/imagem.png" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="linkUrl" render={({ field }) => (
            <FormItem><FormLabel>URL do Link (para onde o banner aponta)</FormLabel><FormControl><Input placeholder="https://seusite.com/promocao" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5"><FormLabel>Banner Ativo</FormLabel><FormDescription>Desative para ocultar o banner sem o excluir.</FormDescription></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4" />}
              {buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
