'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Resolver, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/app/components/ImageUpload'
import type { Category, Product } from '@prisma/client'
import { ProductCondition } from '@prisma/client'
import { Loader2, Tag, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'

const conditionLabels: Record<ProductCondition, string> = {
  NEW: 'Novo',
  GOOD_CONDITION: 'Em boas condições',
  USED: 'Usado',
  REFURBISHED: 'Recondicionado',
  OTHER: 'Outro',
};

const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  price: z.coerce.number().min(0.01, 'O preço deve ser maior que zero.'),
  onPromotion: z.boolean().default(false),
  originalPrice: z.coerce.number().optional().nullable(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é necessária.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser de pelo menos 1.'),
  condition: z.nativeEnum(ProductCondition, {
    required_error: "Selecione a condição do produto."
  }),
  isService: z.boolean().default(false),
}).refine((data) => {
    if (data.onPromotion && (!data.originalPrice || data.originalPrice <= 0)) {
        return false;
    }
    return true;
}, {
    message: "O preço original é obrigatório para promoções.",
    path: ["originalPrice"],
}).refine((data) => {
    if (data.onPromotion && data.originalPrice && data.price >= data.originalPrice) {
        return false;
    }
    return true;
}, {
    message: "O preço promocional deve ser menor que o original.",
    path: ["price"],
});


// CORREÇÃO 1: A interface agora aceita `availableCategories`
interface ProductFormProps {
  initialData?: Product | null;
  availableCategories: Category[];
}

// CORREÇÃO 2: O componente recebe `availableCategories` como prop
export const ProductForm = ({ initialData, availableCategories }: ProductFormProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      originalPrice: null,
      images: [],
      categoryId: '',
      quantity: 1,
      condition: ProductCondition.NEW,
      onPromotion: false,
      isService: false,
    },
  })
  
  const onPromotion = form.watch('onPromotion');
  const isService = form.watch('isService');

  useEffect(() => {
    // A busca de categorias foi removida daqui, pois os dados agora vêm por props.
    if (initialData) {
      form.reset({
        ...initialData,
        price: Number(initialData.price),
        originalPrice: initialData.originalPrice ? Number(initialData.originalPrice) : null,
        quantity: Number(initialData.quantity),
        isService: !!initialData.isService,
      })
    }
  }, [initialData, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const dataToSend = {
          ...values,
          originalPrice: values.onPromotion ? values.originalPrice : null,
          quantity: values.isService ? 1 : values.quantity,
          condition: values.isService ? ProductCondition.OTHER : values.condition,
      };

      const url = initialData ? `/api/products/${initialData.id}` : '/api/products'
      const method = initialData ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        // Lógica de erro melhorada para exibir a mensagem da API
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao ${initialData ? 'atualizar' : 'criar'} o item.`);
      }

      const itemType = values.isService ? 'Serviço' : 'Produto';
      toast.success(`${itemType} ${initialData ? 'atualizado' : 'criado'} com sucesso!`);
      
      // Redireciona para a página correta após o sucesso
      router.push(initialData ? '/dashboard' : (values.isService ? '/services' : '/products'));
      router.refresh();

    } catch (error) {
      // Exibe a mensagem de erro específica no toast
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <Card>
            <CardHeader>
                <CardTitle>Tipo de Anúncio</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="isService" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" />É um Serviço?</FormLabel>
                            <FormDescription>Marque esta opção se você está anunciando um serviço (manicure, aulas, etc.) em vez de um produto físico.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do {isService ? 'Serviço' : 'Produto'}</FormLabel><FormControl><Input placeholder={isService ? "Ex: Manicure e Pedicure Completa" : "Ex: Camiseta Estampada"} {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder={isService ? "Descreva os detalhes do serviço oferecido..." : "Descreva os detalhes do seu produto..."} {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="images" render={({ field }) => ( <FormItem><FormLabel>Imagens de Divulgação</FormLabel><FormControl><ImageUpload onUploadComplete={field.onChange} currentFiles={field.value} maxFiles={5} /></FormControl><FormMessage /></FormItem> )} />
            </CardContent>
        </Card>
        
        <AnimatePresence>
        {!isService && (
            <motion.div initial={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                    <CardHeader><CardTitle>Detalhes e Estoque</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="condition" render={({ field }) => ( <FormItem><FormLabel>Condição do Produto</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o estado do produto" /></SelectTrigger></FormControl><SelectContent>{Object.values(ProductCondition).map((c) => (<SelectItem key={c} value={c}>{conditionLabels[c]}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>Quantidade em Estoque</FormLabel><FormControl><Input type="number" step="1" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </CardContent>
                </Card>
            </motion.div>
        )}
        </AnimatePresence>
        
        <Card>
             <CardHeader><CardTitle>{isService ? 'Preço e Categoria do Serviço' : 'Preço, Promoções e Categoria'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                 <FormField control={form.control} name="categoryId" render={({ field }) => ( 
                    <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        {/* CORREÇÃO 3: Usa `availableCategories` diretamente e remove o estado de loading */}
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={availableCategories.length === 0 ? "Nenhuma categoria encontrada" : "Selecione uma categoria"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem> 
                )} />

                <Separator />

                 <FormField control={form.control} name="onPromotion" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Colocar em Promoção?</FormLabel>
                            <FormDescription>Ative para definir um preço promocional.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />

                <AnimatePresence>
                {onPromotion && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                            <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300"><Tag className="h-5 w-5"/> Preço Promocional</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <FormField control={form.control} name="originalPrice" render={({ field }) => ( <FormItem><FormLabel>Preço Original (De:)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="29,90" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                                 <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço Promocional (Por:)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="19,90" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                </AnimatePresence>

                {!onPromotion && (
                    <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço Padrão (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="19,90" {...field} /></FormControl><FormMessage /></FormItem> )} />
                )}
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Salvar Alterações' : `Adicionar ${isService ? 'Serviço' : 'Produto'}`}
            </Button>
        </div>
      </form>
    </Form>
  )
}
