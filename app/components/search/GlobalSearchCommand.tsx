// app/components/search/GlobalSearchCommand.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  images: string[];
  price: number;
}

export function GlobalSearchCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // Aguarda 300ms após o usuário parar de digitar
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Atalho de teclado (Cmd+K ou Ctrl+K) para abrir/fechar a busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Busca os resultados quando o termo de busca (debounced) muda
  useEffect(() => {
    if (debouncedSearchTerm.length > 1) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/search?q=${debouncedSearchTerm}`);
          if (!response.ok) throw new Error('Falha ao buscar resultados da pesquisa');
          const data = await response.json();
          setResults(data);
        } catch (error) {
          console.error(error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  // Navega para a página do produto ao selecionar um item
  const handleSelect = useCallback((productId: string) => {
    setIsOpen(false);
    setSearchTerm('');
    router.push(`/products/${productId}`);
  }, [router]);
  
  // Limpa o termo de busca quando a caixa de diálogo é fechada
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <>
      {/* Botão que aciona a busca */}
      <Button
        variant="ghost"
        className={cn(
          ""
        )}
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
      </Button>

      {/* Caixa de diálogo com os resultados */}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Digite o nome de um produto..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : (
            <>
              {results.length === 0 && debouncedSearchTerm.length > 1 && (
                 <CommandEmpty>Nenhum resultado encontrado para "{debouncedSearchTerm}".</CommandEmpty>
              )}
              {results.length > 0 && (
                <CommandGroup heading="Produtos">
                  {results.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => handleSelect(product.id)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={product.images?.[0] || '/img-placeholder.png'}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">R$ {product.price.toFixed(2)}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
