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
import { Badge } from '@/components/ui/badge'
import { Copy, Trash2, Link as LinkIcon, Loader2, PlusCircle, AlertTriangle, ExternalLink, MousePointerClick, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type ShortLink = {
  id: string
  originalUrl: string
  shortCode: string
  clicks: number
  createdAt: string
  title?: string | null
  imageUrl?: string | null
}

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
      fetchLinks()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocorreu um erro.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const copyShortLink = (shortCode: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/s/${shortCode}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

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

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
  const totalLinks = links.length

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
        
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start text-left">
                <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4 px-3 py-1">
                    Marketing & SEO
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Encurtador de Links</h1>
                <p className="text-white/70 max-w-xl">
                    Crie links curtos personalizados para partilhar os seus produtos nas redes sociais. Monitorize quantos cliques cada campanha gera em tempo real.
                </p>
            </div>

            <div className="relative z-10 shrink-0 flex gap-4">
                 <div className="flex flex-col items-center justify-center bg-black/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner min-w-[120px]">
                    <span className="font-black text-3xl leading-none text-blue-300">{totalLinks}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 mt-1 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Links Ativos</span>
                 </div>
                 <div className="flex flex-col items-center justify-center bg-blue-600/20 px-5 py-3 rounded-xl backdrop-blur-sm border border-blue-400/20 shadow-inner min-w-[120px]">
                    <span className="font-black text-3xl leading-none text-white">{totalClicks}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 mt-1 flex items-center gap-1"><MousePointerClick className="w-3 h-3"/> Total Cliques</span>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: CREATE LINK FORM */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 sticky top-24">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <PlusCircle className="h-5 w-5 text-blue-500" />
                            Novo Link Encurtado
                        </CardTitle>
                        <CardDescription>Cole um URL longo e crie uma versão otimizada para partilha.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="originalUrl"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-slate-300">URL Destino (Original)</FormLabel>
                                    <FormControl>
                                    <Input className="bg-white dark:bg-slate-950" placeholder="https://seusite.com/produto-longo-123" {...field} />
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
                                    <FormLabel className="text-slate-700 dark:text-slate-300">Título para Identificação (Opcional)</FormLabel>
                                    <FormControl>
                                    <Input className="bg-white dark:bg-slate-950" placeholder="Ex: Campanha Instagram Fev" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                                Gerar Link Curto
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: LINKS TABLE */}
            <div className="lg:col-span-2">
                <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full overflow-hidden flex flex-col">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-slate-400" />
                            Performance dos Links
                        </CardTitle>
                        <CardDescription>
                            Os seus links mais recentes e as respetivas estatísticas de cliques.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow className="bg-slate-50/30 dark:bg-slate-900/20 hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                                <TableHead className="w-16 hidden sm:table-cell"></TableHead>
                                <TableHead>Link Encurtado</TableHead>
                                <TableHead className="text-center w-24">Cliques</TableHead>
                                <TableHead className="text-right w-28">Ações</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32 mb-2" />
                                        <Skeleton className="h-3 w-48" />
                                    </TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-10 mx-auto rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                                ))
                            ) : links.length > 0 ? (
                                links.map((link) => (
                                <TableRow key={link.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                    <TableCell className="hidden sm:table-cell py-4">
                                        <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                            {link.imageUrl ? (
                                            <Image
                                                src={link.imageUrl}
                                                alt={link.title || 'Imagem do link'}
                                                fill
                                                className="object-cover"
                                            />
                                            ) : (
                                                <LinkIcon className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-1">
                                            {link.title && <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-[300px]">{link.title}</span>}
                                            <a href={`${process.env.NEXT_PUBLIC_APP_URL}/s/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-medium text-sm">
                                                {`${process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '')}/s/${link.shortCode}`}
                                                <ExternalLink className="h-3 w-3 opacity-50" />
                                            </a>
                                            <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[300px]" title={link.originalUrl}>{link.originalUrl}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                        <Badge variant="secondary" className={cn(
                                            "font-bold text-sm min-w-[32px] justify-center px-2", 
                                            link.clicks > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            {link.clicks}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-4">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" onClick={() => copyShortLink(link.shortCode)} title="Copiar">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={() => setLinkToDelete(link)} title="Excluir">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <LinkIcon className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                                        <p className="font-medium text-slate-900 dark:text-slate-100">Sem links gerados</p>
                                        <p className="text-sm mt-1">Crie o seu primeiro link encurtado usando o formulário ao lado.</p>
                                    </div>
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* DELETE MODAL */}
        <Dialog open={!!linkToDelete} onOpenChange={(isOpen) => !isOpen && setLinkToDelete(null)}>
            <DialogContent className="sm:max-w-md border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5"/>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja excluir permanentemente o link para <strong className="text-slate-900 dark:text-slate-100 truncate inline-block max-w-[200px] align-bottom">{linkToDelete?.originalUrl}</strong>? A ação não pode ser desfeita e qualquer pessoa que clique no link antigo receberá um erro 404.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={() => setLinkToDelete(null)} disabled={isSubmitting}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Confirmar Exclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
