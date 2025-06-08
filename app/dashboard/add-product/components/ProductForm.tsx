"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import ImageUpload from "@/app/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Hash, Edit, DollarSign, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name: string;
}

// CORREÇÃO APLICADA AQUI: Adicionado .default(false) ao onPromotion
const productFormSchema = z.object({
  name: z.string().min(3, "O nome do produto precisa ter no mínimo 3 caracteres."),
  description: z.string().optional(),
  price: z.coerce.number({ invalid_type_error: "O preço deve ser um número." }).positive("O preço deve ser um valor positivo."),
  quantity: z.coerce.number({ invalid_type_error: "A quantidade deve ser um número." }).int().min(1, "A quantidade deve ser no mínimo 1."),
  imageUrls: z.array(z.string().url()).min(1, "É necessário pelo menos uma imagem."),
  categoryId: z.string({ required_error: "Por favor, selecione uma categoria." }).min(1, "A categoria é obrigatória."),
  onPromotion: z.boolean().default(false), // Garante que o tipo seja sempre booleano
  originalPrice: z.coerce.number().optional().nullable(),
}).refine(data => {
  if (data.onPromotion) {
    return data.originalPrice !== null && data.originalPrice !== undefined && data.originalPrice > data.price;
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

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      quantity: 1,
      imageUrls: [],
      categoryId: "",
      onPromotion: false, 
      originalPrice: undefined,
    },
  });
  
  const onPromotionValue = form.watch('onPromotion');

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    try {
      // Usa o categoryId singular, como corrigido anteriormente
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
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Edit/> Detalhes do Produto</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon/> Mídia</CardTitle></CardHeader>
          <CardContent>
            <FormField name="imageUrls" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Imagens</FormLabel><FormControl><ImageUpload onUploadComplete={(urls) => form.setValue('imageUrls', [...field.value, ...urls])} onRemoveFile={(url) => form.setValue('imageUrls', field.value.filter(u => u !== url))} maxFiles={5} currentFiles={field.value}/></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign/> Preço e Estoque</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField name="price" control={form.control} render={({ field }) => (<FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField name="quantity" control={form.control} render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField name="onPromotion" control={form.control} render={({ field }) => (
              <FormItem className="flex items-center space-x-2 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><Label>Marcar como promoção</Label></FormItem>
            )} />
            {onPromotionValue && (
              <FormField name="originalPrice" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Preço Original (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} /></FormControl><FormDescription>O preço antigo que aparecerá riscado.</FormDescription><FormMessage /></FormItem>
              )} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Hash/> Organização</CardTitle></CardHeader>
          <CardContent>
            <FormField name="categoryId" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger></FormControl>
                  <SelectContent>{availableCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Cadastrar Achadinho
          </Button>
        </div>
      </form>
    </Form>
  );
}
