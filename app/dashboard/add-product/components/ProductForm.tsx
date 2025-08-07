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
import { Loader2, Tag, Wrench, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSession } from 'next-auth/react'

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
  price: z.coerce.number().optional(),
  priceType: z.enum(['FIXED', 'ON_BUDGET']).default('FIXED'),
  onPromotion: z.boolean().default(false),
  originalPrice: z.coerce.number().optional().nullable(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é necessária.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser de pelo menos 1.'),
  condition: z.nativeEnum(ProductCondition, {
    required_error: "Selecione a condição do produto."
  }),
  isService: z.boolean().default(false),
  productUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal('')).optional().nullable(),
}).refine((data) => {
    if (data.isService && data.priceType === 'FIXED' && (!data.price || data.price <= 0)) {
        return false;
    }
    if (!data.isService && (!data.price || data.price <= 0)) {
        return false;
    }
    return true;
}, {
    message: "O preço é obrigatório para este tipo de anúncio.",
    path: ["price"],
}).refine((data) => {
    if (data.onPromotion && (!data.originalPrice || data.originalPrice <= 0)) {
        return false;
    }
    return true;
}, {
    message: "O preço original é obrigatório para promoções.",
    path: ["originalPrice"],
}).refine((data) => {
    if (data.onPromotion && data.originalPrice && data.price && data.price >= data.originalPrice) {
        return false;
    }
    return true;
}, {
    message: "O preço promocional deve ser menor que o original.",
    path: ["price"],
});

interface ProductFormProps {
  initialData?: (Product & { productUrl?: string | null }) | null;
  availableCategories: Category[];
}

export const ProductForm = ({ initialData, availableCategories }: ProductFormProps) => {
  const router = useRouter()
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPremiumSeller = session?.user?.email === process.env.NEXT_PUBLIC_EMAIL_PREMIUM;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      priceType: 'FIXED',
      originalPrice: null,
      images: [],
      categoryId: '',
      quantity: 1,
      condition: ProductCondition.NEW,
      onPromotion: false,
      isService: false,
      productUrl: '',
    },
  })
  
  const onPromotion = form.watch('onPromotion');
  const isService = form.watch('isService');

  useEffect(() => {
    if (initialData) {
      const valuesToSet = {
        ...initialData,
        price: initialData.price ? Number(initialData.price) : undefined,
        priceType: (initialData.priceType as 'FIXED' | 'ON_BUDGET') || 'FIXED',
        originalPrice: initialData.originalPrice ? Number(initialData.originalPrice) : null,
        quantity: Number(initialData.quantity),
        isService: !!initialData.isService,
        productUrl: initialData.productUrl || '',
      };
      form.reset(valuesToSet);
    }
  }, [initialData, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const dataToSend = {
          ...values,
          price: values.priceType === 'ON_BUDGET' ? null : values.price,
          originalPrice: values.onPromotion ? values.originalPrice : null,
          quantity: values.isService ? 1 : values.quantity,
          condition: values.isService ? ProductCondition.OTHER : values.condition,
          productUrl: isPremiumSeller ? values.productUrl : null,
      };

      const url = initialData ? `/api/products/${initialData.id}` : '/api/products'
      const method = initialData ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao ${initialData ? 'atualizar' : 'criar'} o item.`);
      }

      const itemType = values.isService ? 'Serviço' : 'Produto';
      toast.success(`${itemType} ${initialData ? 'atualizado' : 'criado'} com sucesso!`);
      
      router.push('/dashboard');
      router.refresh();

    } catch (error) {
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
                
                {isPremiumSeller && (
                  <FormField
                    control={form.control}
                    name="productUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary" /> Link de Redirecionamento do Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="https://link-externo.com/produto-123" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>
                          (Opcional) Link específico para este item. Se deixado em branco, será usado o link padrão da sua loja.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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

                 <AnimatePresence>
                {isService ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <FormField control={form.control} name="priceType" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Como você quer definir o preço?</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl><RadioGroupItem value="FIXED" /></FormControl>
                                            <FormLabel className="font-normal">Preço Fixo</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl><RadioGroupItem value="ON_BUDGET" /></FormControl>
                                            <FormLabel className="font-normal">Orçamento a combinar</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </motion.div>
                ) : (
                    <>
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
                    </>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {(form.watch('priceType') === 'FIXED' && !onPromotion) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <FormField control={form.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Preço Padrão (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="19,90" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {onPromotion && !isService && (
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
