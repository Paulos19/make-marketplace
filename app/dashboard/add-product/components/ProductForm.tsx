"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import ImageUpload from "@/app/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import {
  Loader2, Hash, Edit, DollarSign, Image as ImageIcon, ChevronsUpDown, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipagem para as categorias recebidas como prop
interface Category {
  id: string;
  name: string;
}

// <<< CORREÇÃO PRINCIPAL AQUI (no schema Zod) >>>
const productFormSchema = z.object({
  name: z.string().min(3, "O nome do produto precisa ter no mínimo 3 caracteres."),
  description: z.string().optional(),
  price: z.coerce.number({invalid_type_error: "O preço deve ser um número."}).positive("O preço deve ser um valor positivo.").min(0.01),
  quantity: z.coerce.number({invalid_type_error: "A quantidade deve ser um número."}).int().min(1, "A quantidade em estoque deve ser de no mínimo 1."),
  imageUrls: z.array(z.string().url()).min(1, "É necessário pelo menos uma imagem."),
  categoryIds: z.array(z.string()).min(1, "Selecione pelo menos uma categoria."),
  // Apenas z.boolean() é necessário. O valor padrão será fornecido pelo useForm.
  onPromotion: z.boolean(), 
  originalPrice: z.coerce.number({invalid_type_error: "O preço original deve ser um número."}).optional().nullable(),
}).refine(data => {
  if (data.onPromotion) {
    return data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice > data.price;
  }
  return true;
}, {
  message: "Em promoção, o preço original deve ser informado e maior que o preço atual.",
  path: ["originalPrice"],
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductForm({ availableCategories }: { availableCategories: Category[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      quantity: 1,
      imageUrls: [],
      categoryIds: [],
      // O valor padrão para onPromotion é definido aqui
      onPromotion: false, 
      originalPrice: undefined,
    },
  });
  
  const onPromotionValue = form.watch('onPromotion');

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        originalPrice: data.onPromotion ? data.originalPrice : null,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar o produto.");
      }
      
      toast.success("Achadinho cadastrado com sucesso!");
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bangers text-zaca-roxo">
              <Edit className="h-5 w-5"/> Detalhes do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input placeholder="Ex: Batom Vermelho Paixão" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva os detalhes do seu produto..." rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg dark:bg-slate-800/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bangers text-zaca-roxo"><ImageIcon className="h-5 w-5"/> Mídia</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField name="imageUrls" control={form.control} render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <ImageUpload 
                                onUploadComplete={(urls) => form.setValue('imageUrls', [...form.getValues('imageUrls'), ...urls], { shouldValidate: true })}
                                onRemoveFile={(urlToRemove) => form.setValue('imageUrls', form.getValues('imageUrls').filter(url => url !== urlToRemove), { shouldValidate: true })}
                                maxFiles={5}
                                currentFiles={field.value}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </CardContent>
        </Card>

        <Card className="shadow-lg dark:bg-slate-800/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bangers text-zaca-roxo"><DollarSign className="h-5 w-5"/> Preço e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField name="price" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="19.90" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="quantity" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Quantidade em Estoque</FormLabel><FormControl><Input type="number" step="1" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField name="onPromotion" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Este produto está em promoção?</FormLabel></div></FormItem>
                )} />
                {onPromotionValue && (
                    <FormField name="originalPrice" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Preço Original (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="De: 29.90" {...field} value={field.value ?? ''} /></FormControl><FormDescription>O preço antigo que aparecerá riscado.</FormDescription><FormMessage /></FormItem>
                    )} />
                )}
            </CardContent>
        </Card>

        <Card className="shadow-lg dark:bg-slate-800/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bangers text-zaca-roxo"><Hash className="h-5 w-5"/> Organização</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField name="categoryIds" control={form.control} render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Categorias</FormLabel><Popover open={popoverOpen} onOpenChange={setPopoverOpen}><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value?.length && "text-muted-foreground")}>{field.value?.length > 0 ? field.value.map(id => availableCategories.find(c => c.id === id)?.name).join(', ') : "Selecione as categorias"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Buscar categoria..." /><CommandList><CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty><CommandGroup>{availableCategories.map((category) => (<CommandItem value={category.name} key={category.id} onSelect={() => { const currentIds = form.getValues("categoryIds") || []; const newIds = currentIds.includes(category.id) ? currentIds.filter(id => id !== category.id) : [...currentIds, category.id]; form.setValue("categoryIds", newIds, { shouldValidate: true });}}><Check className={cn("mr-2 h-4 w-4", field.value?.includes(category.id) ? "opacity-100" : "opacity-0")} />{category.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
            </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="lg" className="bg-zaca-azul hover:bg-zaca-azul/90 text-white shadow-lg">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Cadastrando...</> : "Cadastrar Achadinho"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
