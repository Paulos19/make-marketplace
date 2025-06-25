'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Trash2, Link as LinkIcon, Loader2, PlusCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import Navbar from '@/app/components/layout/Navbar'

// Tipo para os dados dos links, agora incluindo a URL da imagem
type ShortLink = {
  id: string
  originalUrl: string
  shortCode: string
  clicks: number
  createdAt: string
  title?: string | null
  imageUrl?: string | null // <-- Imagem adicionada
}

// Schema de validação para o formulário de criação manual
const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Por favor, insira uma URL válida.' }),
  title: z.string().optional(),
})

export default function LinkShortenerPage() {
  const { data: session, status } = useSession()
  const [links, setLinks] = useState<ShortLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<ShortLink | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { originalUrl: '', title: '' },
  })

  // Função para buscar os links do utilizador
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/shortener')
      if (!response.ok) throw new Error('Falha ao buscar links.')
      const data = await response.json()
      setLinks(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLinks()
    }
  }, [status])

  // Função para criar um novo link manualmente
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/shortener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao criar link.')
      toast.success('Link encurtado criado com sucesso!')
      form.reset()
      fetchLinks() // Atualiza a lista de links
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Função para copiar o link encurtado
  const copyShortLink = (shortCode: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortCode}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!linkToDelete) return
    setIsSubmitting(true)
    try {
        await fetch(`/api/shortener/${linkToDelete.id}`, { method: 'DELETE' });
        toast.success(`Link para "${linkToDelete.originalUrl}" foi excluído.`);
        setLinks(links.filter(link => link.id !== linkToDelete.id));
        setLinkToDelete(null);
    } catch (error) {
        toast.error("Falha ao excluir o link.");
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
    <Navbar/>
      <div className="m-4 md:m-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <LinkIcon className="h-6 w-6" />
              Encurtador de Links do Zaca
            </CardTitle>
            <CardDescription>
              Crie links curtos para as suas campanhas ou para partilhar os seus produtos de forma mais fácil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="originalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Original</FormLabel>
                        <FormControl>
                          <Input placeholder="https://seusite.com/produto-incrivel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Promoção Dia das Mães" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Criar Link
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seus Links Encurtados</CardTitle>
            <CardDescription>
              Acompanhe o desempenho dos seus links de partilha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 hidden sm:table-cell">Imagem</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="hidden md:table-cell">Destino Original</TableHead>
                    <TableHead className="text-center">Cliques</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : links.length > 0 ? (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="hidden sm:table-cell">
                          <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {link.imageUrl ? (
                              <Image
                                src={link.imageUrl}
                                alt={link.title || 'Imagem do link'}
                                width={40}
                                height={40}
                                className="rounded-md object-cover aspect-square"
                              />
                            ) : (
                                <LinkIcon className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <a href={`${process.env.NEXT_PUBLIC_APP_URL}/s/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            {`${process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '')}/s/${link.shortCode}`}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {link.title && <p className="text-xs text-muted-foreground">{link.title}</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{link.originalUrl}</TableCell>
                        <TableCell className="text-center font-bold">{link.clicks}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyShortLink(link.shortCode)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setLinkToDelete(link)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Você ainda não criou nenhum link.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!linkToDelete} onOpenChange={(isOpen) => !isOpen && setLinkToDelete(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                    Tem certeza que deseja excluir permanentemente este link? A ação não pode ser desfeita.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setLinkToDelete(null)} disabled={isSubmitting}>Cancelar</Button>
                <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Confirmar Exclusão
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
