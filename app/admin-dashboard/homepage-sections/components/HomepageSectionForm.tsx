"use client";

import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import ImageUpload from '@/app/components/ImageUpload';
import { HomepageSection, Product } from '@prisma/client';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';

// Schema de validação Zod para o formulário
const formSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  bannerImageUrl: z.string().url("A URL da imagem é obrigatória."),
  bannerFontColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Insira uma cor hexadecimal válida (ex: #FFFFFF).").default("#FFFFFF"),
  productIds: z.array(z.string()).min(1, "Selecione pelo menos um produto.").max(8, "Selecione no máximo 8 produtos."),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

type SectionFormValues = z.infer<typeof formSchema>;

interface HomepageSectionFormProps {
  currentSection: HomepageSection | null;
  allProducts: Pick<Product, 'id' | 'name' | 'images'>[];
  onSuccess: () => void;
}

export function HomepageSectionForm({ currentSection, allProducts, onSuccess }: HomepageSectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(formSchema) as Resolver<SectionFormValues>,
    defaultValues: {
      title: '',
      bannerImageUrl: '',
      bannerFontColor: '#FFFFFF',
      productIds: [],
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    // Preenche o formulário se estivermos editando uma seção existente
    if (currentSection) {
      form.reset({
        title: currentSection.title,
        bannerImageUrl: currentSection.bannerImageUrl,
        bannerFontColor: currentSection.bannerFontColor,
        productIds: currentSection.productIds,
        order: currentSection.order,
        isActive: currentSection.isActive,
      });
    }
  }, [currentSection, form]);

  const onSubmit = async (data: SectionFormValues) => {
    setIsLoading(true);
    const apiEndpoint = currentSection 
      ? `/api/admin/homepage-sections/${currentSection.id}` 
      : '/api/admin/homepage-sections';
    const method = currentSection ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, { method, body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }});
      if (!response.ok) throw new Error("Falha ao salvar a seção.");
      toast.success(`Seção "${data.title}" ${currentSection ? 'atualizada' : 'criada'} com sucesso!`);
      onSuccess(); // Chama a função do pai para fechar o modal e atualizar a lista
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        
        <FormField name="title" control={form.control} render={({ field }) => (
          <FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input {...field} placeholder="Ex: Lançamentos de Verão" /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField name="bannerImageUrl" control={form.control} render={({ field }) => (
          <FormItem><FormLabel>Banner da Seção</FormLabel><FormControl><ImageUpload maxFiles={1} currentFiles={field.value ? [field.value] : []} onUploadComplete={(urls) => field.onChange(urls[0])} onRemoveFile={() => field.onChange("")} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField name="bannerFontColor" control={form.control} render={({ field }) => (
          <FormItem><FormLabel>Cor da Fonte do Banner</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl><Input {...field} placeholder="#FFFFFF" className="w-32" /></FormControl>
              <Input type="color" value={field.value} onChange={field.onChange} className="w-12 h-10 p-1"/>
            </div>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField name="productIds" control={form.control} render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel>Produtos em Destaque</FormLabel>
            <Popover>
              <PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className="w-full justify-between">{field.value?.length > 0 ? `${field.value.length} produtos selecionados` : "Selecione os produtos"} <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandList><CommandEmpty>Nenhum produto encontrado.</CommandEmpty><CommandGroup>
                    {allProducts.map(product => (
                      <CommandItem key={product.id} onSelect={() => {
                        const currentIds = field.value || [];
                        const newIds = currentIds.includes(product.id) ? currentIds.filter(id => id !== product.id) : [...currentIds, product.id];
                        field.onChange(newIds);
                      }}>
                        <Check className={`mr-2 h-4 w-4 ${field.value?.includes(product.id) ? "opacity-100" : "opacity-0"}`} />
                        {product.name}
                      </CommandItem>
                    ))}
                  </CommandGroup></CommandList>
                </Command></PopoverContent>
            </Popover>
            <FormDescription>Selecione de 1 a 8 produtos para exibir nos cards.</FormDescription><FormMessage />
          </FormItem>
        )} />
        
        <div className="flex items-center space-x-4">
            <FormField name="isActive" control={form.control} render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Seção Ativa</FormLabel></FormItem>
            )} />
            <FormField name="order" control={form.control} render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0"><FormLabel>Ordem</FormLabel><FormControl><Input type="number" className="w-20" {...field} /></FormControl></FormItem>
            )} />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentSection ? 'Salvar Alterações' : 'Criar Seção'}
          </Button>
        </div>
      </form>
    </Form>
  );
}