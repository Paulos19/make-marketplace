'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; 
import { toast } from 'sonner';
import ImageUpload from '@/app/components/ImageUpload';
import { Loader2, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Category {
  id: string;
  name: string;
}

const productFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: 'O preço deve ser um número positivo.' }),
  quantity: z.coerce.number().int().min(0, { message: 'A quantidade não pode ser negativa.' }).default(0), // Adicionado quantity ao schema
  onPromotion: z.boolean().default(false),
  originalPrice: z.coerce.number().positive({ message: 'O preço original deve ser positivo.' }).optional().nullable(),
  imageUrls: z.array(z.string().url({ message: 'Por favor, insira URLs válidas.' })).default([]),
  categoryIds: z.array(z.string()).default([]),
}).refine(data => {
  if (data.onPromotion && (data.originalPrice === null || data.originalPrice === undefined || data.originalPrice <= data.price)) {
    return false;
  }
  return true;
}, {
  message: 'Se em promoção, o preço original deve ser informado e maior que o preço promocional.',
  path: ['originalPrice'], 
}).refine(data => {
  if (!data.onPromotion && data.originalPrice !== null && data.originalPrice !== undefined) {
  }
  return true;
});


type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductData extends ProductFormValues {
  id: string;
  userId: string;
  categories?: Category[];
  quantity: number; // Garantir que quantity esteja na interface
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0, // Adicionado valor padrão para quantity
      onPromotion: false,
      originalPrice: null,
      imageUrls: [],
      categoryIds: [],
    },
  });

  const onPromotionValue = form.watch('onPromotion');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Falha ao buscar categorias.');
        const data: Category[] = await response.json();
        setAvailableCategories(data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar categorias.');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            throw new Error('Falha ao buscar dados do produto.');
          }
          const data: ProductData = await response.json();
          setProduct(data);
          
          const currentCategoryIds = data.categories?.map(cat => cat.id) || [];
          form.reset({
            name: data.name,
            description: data.description || '',
            price: data.price,
            quantity: data.quantity || 0, // Adicionado quantity ao reset do formulário
            onPromotion: data.onPromotion || false,
            originalPrice: data.originalPrice || null,
            imageUrls: data.imageUrls || [],
            categoryIds: currentCategoryIds,
          });
          setUploadedImageUrls(data.imageUrls || []);
          setSelectedCategories(new Set(currentCategoryIds));
        } catch (error) {
          console.error(error);
          toast.error(error instanceof Error ? error.message : 'Erro ao carregar produto.');
          router.push('/dashboard');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [productId, form, router]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...data, // data já inclui quantity devido ao schema
        imageUrls: uploadedImageUrls,
        categoryIds: Array.from(selectedCategories),
        originalPrice: data.onPromotion ? data.originalPrice : null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar produto.');
      }

      toast.success('Produto atualizado com sucesso!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      if (errorMessage.includes("originalPrice")) {
        form.setError("originalPrice", { type: "manual", message: errorMessage });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploadComplete = (urls: string[]) => {
    const newUrls = urls.filter(url => !uploadedImageUrls.includes(url));
    setUploadedImageUrls(prevUrls => [...prevUrls, ...newUrls]);
    form.setValue('imageUrls', [...uploadedImageUrls, ...newUrls], { shouldValidate: true });
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setUploadedImageUrls(prevUrls => prevUrls.filter(url => url !== urlToRemove));
    form.setValue('imageUrls', uploadedImageUrls.filter(url => url !== urlToRemove), { shouldValidate: true });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(categoryId)) {
      newSelectedCategories.delete(categoryId);
    } else {
      newSelectedCategories.add(categoryId);
    }
    setSelectedCategories(newSelectedCategories);
    form.setValue('categoryIds', Array.from(newSelectedCategories), { shouldValidate: true });
  };
  
  const selectedCategoriesText = useMemo(() => {
    if (selectedCategories.size === 0) return "Selecione as categorias";
    if (selectedCategories.size > 2) return `${selectedCategories.size} categorias selecionadas`;
    return Array.from(selectedCategories)
      .map(id => availableCategories.find(cat => cat.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [selectedCategories, availableCategories]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-sky-600" />
        <p className="ml-4 text-lg">Carregando dados do produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-xl text-red-500">Produto não encontrado.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Voltar ao Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Editar Produto</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Atualize os detalhes do seu produto abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input id="name" {...form.register('name')} className="mt-1" />
              {form.formState.errors.name && <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea id="description" {...form.register('description')} rows={4} className="mt-1" />
            </div>
            
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="number" step="0.01" {...form.register('price')} className="mt-1" />
                {form.formState.errors.price && <p className="text-sm text-red-500 mt-1">{form.formState.errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade em Estoque</Label>
                <Input id="quantity" type="number" {...form.register('quantity')} className="mt-1" />
                {form.formState.errors.quantity && <p className="text-sm text-red-500 mt-1">{form.formState.errors.quantity.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6 md:mt-0">
              <div className="space-y-2 pt-1 md:pt-0">
                 <div className="flex items-center space-x-2 mt-1 md:mt-7"> 
                    <Controller
                        name="onPromotion"
                        control={form.control}
                        render={({ field }) => (
                            <Checkbox
                                id="onPromotion"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label htmlFor="onPromotion" className="font-medium">
                        Produto em Promoção?
                    </Label>
                </div>
                {form.formState.errors.onPromotion && <p className="text-sm text-red-500 mt-1">{form.formState.errors.onPromotion.message}</p>}
              </div>
            </div>

            {onPromotionValue && (
              <div>
                <Label htmlFor="originalPrice">Preço Original (R$) - Antes da Promoção</Label>
                <Input id="originalPrice" type="number" step="0.01" {...form.register('originalPrice')} className="mt-1" />
                {form.formState.errors.originalPrice && <p className="text-sm text-red-500 mt-1">{form.formState.errors.originalPrice.message}</p>}
              </div>
            )}

            {}
            <div>
              <Label>Categorias</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between mt-1"
                  >
                    {selectedCategoriesText}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar categoria..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandGroup>
                        {availableCategories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name} 
                            onSelect={() => {
                              handleCategoryToggle(category.id);
                            }}
                          >
                            <Checkbox
                              className="mr-2"
                              checked={selectedCategories.has(category.id)}
                              onCheckedChange={() => handleCategoryToggle(category.id)}
                              onClick={(e) => e.stopPropagation()} 
                            />
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.categoryIds && <p className="text-sm text-red-500 mt-1">{form.formState.errors.categoryIds.message}</p>}
            </div>

            <div>
              <Label>Imagens do Produto</Label>
              <ImageUpload
                onUploadComplete={handleImageUploadComplete}
                maxFiles={5} 
                storagePath={`products/${product.userId}/${productId}`}
                currentFiles={uploadedImageUrls}
                onRemoveFile={handleRemoveImage}
              />
              {form.formState.errors.imageUrls && <p className="text-sm text-red-500 mt-1">{form.formState.errors.imageUrls.message}</p>}
              {uploadedImageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedImageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Imagem do produto ${index + 1}`} className="rounded-md object-cover h-32 w-full" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CardFooter className="flex justify-end pt-8 px-0">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="mr-3">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}