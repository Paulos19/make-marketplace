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
import { Loader2, Tag, Wrench, Link as LinkIcon, Package, FileText, Image as ImageIcon, CircleDollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { AnimatePresence, motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

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
    if (data.isService && data.priceType === 'FIXED' && (!data.price || data.price <= 0)) return false;
    if (!data.isService && (!data.price || data.price <= 0)) return false;
    return true;
}, {
    message: "O preço é obrigatório.",
    path: ["price"],
}).refine((data) => {
    if (data.onPromotion && (!data.originalPrice || data.originalPrice <= 0)) return false;
    return true;
}, {
    message: "O preço original é obrigatório para promoções.",
    path: ["originalPrice"],
}).refine((data) => {
    if (data.onPromotion && data.originalPrice && data.price && data.price >= data.originalPrice) return false;
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

  // Estilos comuns para os Cards
  const cardStyle = "shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden";
  const headerStyle = "bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* MÓDULO: TIPO DE ANÚNCIO */}
        <Card className={cardStyle}>
            <CardContent className="p-6">
                <FormField control={form.control} name="isService" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-violet-100 bg-violet-50/30 dark:border-violet-900/30 dark:bg-violet-900/10 p-5 shadow-sm transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20">
                        <div className="space-y-1">
                            <FormLabel className="text-base flex items-center gap-2 text-violet-900 dark:text-violet-300">
                                <Wrench className="h-5 w-5 text-violet-500" />
                                Oferece um Serviço?
                            </FormLabel>
                            <FormDescription className="text-violet-700/70 dark:text-violet-400/70 max-w-xl">
                                Marque esta opção se o que está a anunciar é um serviço (manicure, reparações, aulas) em vez de um produto físico ou digital.
                            </FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-violet-600" /></FormControl>
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA: INFOS PRINCIPAIS */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* MÓDULO: INFO BÁSICA */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-slate-400"/> Identificação</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <FormField control={form.control} name="name" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Título do {isService ? 'Serviço' : 'Produto'}</FormLabel>
                                <FormControl><Input className="bg-white dark:bg-slate-950" placeholder={isService ? "Ex: Limpeza Profunda de Sofás" : "Ex: Ténis Nike Air Max 90"} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} />
                        
                        <FormField control={form.control} name="description" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Descrição Detalhada</FormLabel>
                                <FormControl><Textarea className="bg-white dark:bg-slate-950 resize-none" placeholder={isService ? "Explique o que inclui o seu serviço, área de atuação e horários..." : "Fale sobre os detalhes, material, tamanho e estado do produto..."} {...field} rows={6} /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} />
                        
                        {isPremiumSeller && (
                        <FormField
                            control={form.control}
                            name="productUrl"
                            render={({ field }) => (
                            <FormItem className="rounded-lg border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-900/10 p-4">
                                <FormLabel className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300"><LinkIcon className="h-4 w-4" /> Link Externo Premium</FormLabel>
                                <FormControl>
                                <Input className="bg-white dark:bg-slate-950 border-indigo-200 dark:border-indigo-800" placeholder="https://sua-loja.com/checkout/123" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormDescription className="text-indigo-700/60 dark:text-indigo-400/60">
                                Ao preencher este campo, o botão "Comprar" redirecionará o cliente para o seu link.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        )}
                    </CardContent>
                </Card>

                {/* MÓDULO: IMAGENS */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon className="h-5 w-5 text-slate-400"/> Galeria de Imagens</CardTitle>
                        <CardDescription>Carregue até 5 imagens de alta qualidade.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <FormField control={form.control} name="images" render={({ field }) => ( 
                            <FormItem>
                                <FormControl><ImageUpload onUploadComplete={field.onChange} currentFiles={field.value} maxFiles={5} /></FormControl>
                                <FormMessage />
                            </FormItem> 
                        )} />
                    </CardContent>
                </Card>

            </div>

            {/* COLUNA DIREITA: PREÇO & CATEGORIA & ESTOQUE */}
            <div className="space-y-6">
                
                {/* MÓDULO: CLASSIFICAÇÃO */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="flex items-center gap-2 text-lg"><Tag className="h-5 w-5 text-slate-400"/> Classificação</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <FormField control={form.control} name="categoryId" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Categoria Principal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white dark:bg-slate-950">
                                            <SelectValue placeholder={availableCategories.length === 0 ? "Nenhuma categoria encontrada" : "Escolha a categoria..."} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem> 
                        )} />
                    </CardContent>
                </Card>

                {/* MÓDULO: PREÇO */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="flex items-center gap-2 text-lg"><CircleDollarSign className="h-5 w-5 text-slate-400"/> Precificação</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <AnimatePresence>
                        {isService && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                <FormField control={form.control} name="priceType" render={({ field }) => (
                                    <FormItem className="space-y-3 mb-5">
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Modelo de Cobrança</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col gap-3">
                                                <FormItem className={cn("flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer transition-colors", field.value === 'FIXED' ? "border-primary bg-primary/5" : "hover:bg-slate-50 dark:hover:bg-slate-900/50")}>
                                                    <FormControl><RadioGroupItem value="FIXED" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer w-full">Preço Fixo</FormLabel>
                                                </FormItem>
                                                <FormItem className={cn("flex items-center space-x-3 space-y-0 p-3 rounded-lg border cursor-pointer transition-colors", field.value === 'ON_BUDGET' ? "border-primary bg-primary/5" : "hover:bg-slate-50 dark:hover:bg-slate-900/50")}>
                                                    <FormControl><RadioGroupItem value="ON_BUDGET" /></FormControl>
                                                    <FormLabel className="font-normal cursor-pointer w-full">Sob Orçamento (A combinar)</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <AnimatePresence>
                        {(form.watch('priceType') === 'FIXED' && !onPromotion) && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                <FormField control={form.control} name="price" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Valor Unitário (R$)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" className="bg-white dark:bg-slate-950 font-medium text-lg" placeholder="0,00" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <AnimatePresence>
                        {!isService && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                <Separator className="my-5" />
                                <FormField control={form.control} name="onPromotion" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10 p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-emerald-900 dark:text-emerald-300">Desconto Especial?</FormLabel>
                                            <FormDescription className="text-emerald-700/70 dark:text-emerald-400/70 text-xs">Ative para mostrar "De / Por".</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" /></FormControl>
                                    </FormItem>
                                )} />
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <AnimatePresence>
                        {onPromotion && !isService && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pt-4">
                                <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <FormField control={form.control} name="originalPrice" render={({ field }) => ( 
                                        <FormItem>
                                            <FormLabel className="text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider font-bold">Preço Original (De:)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="bg-white/80 dark:bg-slate-950/80" placeholder="29,90" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} />
                                    <FormField control={form.control} name="price" render={({ field }) => ( 
                                        <FormItem>
                                            <FormLabel className="text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider font-bold">Preço Promocional (Por:)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="bg-white dark:bg-slate-950 border-emerald-300 dark:border-emerald-700 shadow-sm font-bold text-emerald-700 dark:text-emerald-400" placeholder="19,90" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem> 
                                    )} />
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* MÓDULO: ESTOQUE E CONDIÇÃO */}
                <AnimatePresence>
                {!isService && (
                    <motion.div initial={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <Card className={cardStyle}>
                            <CardHeader className={headerStyle}>
                                <CardTitle className="flex items-center gap-2 text-lg"><Package className="h-5 w-5 text-slate-400"/> Condição</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <FormField control={form.control} name="condition" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Estado de Conservação</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white dark:bg-slate-950">
                                                    <SelectValue placeholder="Selecione o estado..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ProductCondition).map((c) => (<SelectItem key={c} value={c}>{conditionLabels[c]}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                                <FormField control={form.control} name="quantity" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Quantidade Disponível</FormLabel>
                                        <FormControl><Input type="number" step="1" className="bg-white dark:bg-slate-950" placeholder="10" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem> 
                                )} />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                </AnimatePresence>

            </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px] shadow-lg shadow-primary/20">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Salvar Alterações' : `Publicar ${isService ? 'Serviço' : 'Produto'}`}
            </Button>
        </div>
      </form>
    </Form>
  )
}
