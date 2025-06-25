'use client'

import * as React from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Package, Store, Shapes, Loader2 } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

interface SearchResult {
  type: 'product' | 'seller' | 'category'
  id: string
  name: string
  image?: string | null
}

// O componente agora é "controlado", recebendo o estado de abertura como props
interface GlobalSearchCommandProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function GlobalSearchCommand({ open, setOpen }: GlobalSearchCommandProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${searchQuery}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, 300)

  React.useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  const renderIcon = (result: SearchResult) => {
    if (result.image) {
      return <Image src={result.image} alt={result.name} width={24} height={24} className="h-6 w-6 rounded-sm object-cover" />
    }
    switch (result.type) {
      case 'product': return <Package className="h-5 w-5 text-muted-foreground" />;
      case 'seller': return <Store className="h-5 w-5 text-muted-foreground" />;
      case 'category': return <Shapes className="h-5 w-5 text-muted-foreground" />;
      default: return null;
    }
  }

  // O componente agora renderiza apenas o diálogo, sem o botão de gatilho
  return (
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar produtos, vendedores ou categorias..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && <div className='p-4 text-sm flex items-center justify-center'><Loader2 className='h-4 w-4 animate-spin mr-2'/> A buscar...</div>}
          {!loading && results.length === 0 && query.length > 1 && (
            <div className="p-4 text-center text-sm">Nenhum resultado encontrado.</div>
          )}
          
          {results.length > 0 && (
            <CommandGroup heading="Resultados da Busca">
              {results.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  value={`${result.name} ${result.type}`}
                  onSelect={() => {
                    runCommand(() => {
                      let path = ''
                      switch (result.type) {
                        case 'product': path = `/products/${result.id}`; break;
                        case 'seller': path = `/seller/${result.id}`; break;
                        case 'category': path = `/category/${result.id}`; break;
                      }
                      router.push(path)
                    })
                  }}
                  className="flex items-center gap-3"
                >
                  {renderIcon(result)}
                  <span className='flex-grow'>{result.name}</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-muted-foreground">{result.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
  )
}
