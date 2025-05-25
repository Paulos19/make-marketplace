"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload'; 
import { Button } from '@/components/ui/button'; // Usando Button do Shadcn
import { Input } from '@/components/ui/input';   // Usando Input do Shadcn
import { Textarea } from '@/components/ui/textarea'; // Usando Textarea do Shadcn
import { Label } from '@/components/ui/label';     // Usando Label do Shadcn
import { Checkbox } from '@/components/ui/checkbox'; // Usando Checkbox do Shadcn
import { toast } from 'sonner'; // Para notificações
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function AddProductPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1'); // Novo estado para quantidade, inicializado como '1'
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const router = useRouter();

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const handleImageUploadComplete = (urls: string[]) => {
    setImageUrls(prev => [...prev, ...urls.filter(url => !prev.includes(url))]);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('O nome da nova categoria não pode estar vazio.');
      return;
    }
    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar categoria.');
      }
      const createdCategory: Category = await response.json();
      setAvailableCategories(prev => [...prev, createdCategory]);
      setSelectedCategoryIds(prev => new Set(prev).add(createdCategory.id)); // Auto-seleciona a nova categoria
      setNewCategoryName('');
      toast.success(`Categoria "${createdCategory.name}" adicionada!`);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast.error(error instanceof Error ? error.message : 'Ocorreu um problema ao criar a categoria.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (imageUrls.length === 0) {
      toast.error('Por favor, carregue pelo menos uma imagem para o produto.');
      setIsSubmitting(false);
      return;
    }
    if (selectedCategoryIds.size === 0) {
      toast.error('Por favor, selecione pelo menos uma categoria para o produto.');
      setIsSubmitting(false);
      return;
    }
    if (parseInt(quantity) <= 0) { // Validação da quantidade
      toast.error('A quantidade em estoque deve ser maior que zero.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          quantity: parseInt(quantity), // Adicionar quantidade ao payload
          imageUrls,
          categoryIds: Array.from(selectedCategoryIds),
          // Adicione onPromotion e originalPrice aqui se necessário para novos produtos
          // onPromotion: false, // Exemplo de valor padrão
          // originalPrice: null, // Exemplo de valor padrão
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar o produto');
      }

      toast.success('Produto criado com sucesso!');
      router.push('/dashboard');
      router.refresh(); // Para atualizar a lista de produtos no dashboard
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um problema.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Adicionar Novo Produto</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              step="0.01"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantidade em Estoque</Label>
            <Input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1" // Garante que a quantidade seja pelo menos 1
              className="mt-1"
            />
          </div>

          {/* Seção de Categorias */}
          <div className="space-y-2">
            <Label>Categorias</Label>
            <div className="space-y-2 p-3 border rounded-md max-h-40 overflow-y-auto">
              {availableCategories.length === 0 && <p className="text-sm text-gray-500">Carregando categorias...</p>}
              {availableCategories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategoryIds.has(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label htmlFor={`category-${category.id}`} className="font-normal">
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Input
                type="text"
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-grow"
              />
              <Button type="button" onClick={handleAddNewCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
                {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Adicionar Categoria
              </Button>
            </div>
          </div>

          <div>
            <Label>Imagens do Produto (Max: 5)</Label>
            <ImageUpload 
              onUploadComplete={handleImageUploadComplete} 
              maxFiles={5} 
              storagePath={`products/temp_user_id/temp_product_id`} // Idealmente, obtenha userId e gere um productId temporário ou use um caminho genérico
              currentFiles={imageUrls}
              onRemoveFile={handleRemoveImage}
            />
             {imageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imageUrls.map((url) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="Product image" className="w-full h-32 object-cover rounded-md" />
                      <Button 
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 h-auto"
                        onClick={() => handleRemoveImage(url)}
                      >
                        X
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || imageUrls.length === 0 || selectedCategoryIds.size === 0}
            className="w-full text-lg py-3"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {isSubmitting ? 'Salvando Produto...' : 'Salvar Produto'}
          </Button>
        </form>
      </div>
    </div>
  );
}