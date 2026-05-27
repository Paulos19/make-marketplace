"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Send, ChevronsUpDown, Check, Eye, Users, MousePointerClick, Mail, Image as ImageIcon, LayoutTemplate, AtSign, Package } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const emailBuilderSchema = z.object({
    targetAudience: z.object({
        newsletter: z.boolean(),
        allUsers: z.boolean(),
    }).refine(data => data.newsletter || data.allUsers, {
        message: "Selecione pelo menos um público-alvo.",
    }),
    subject: z.string().min(5, "O assunto deve ter no mínimo 5 caracteres."),
    headline: z.string().min(5, "O título deve ter no mínimo 5 caracteres."),
    body: z.string().min(20, "O corpo do email deve ter no mínimo 20 caracteres."),
    ctaText: z.string().min(3, "O texto do botão deve ter no mínimo 3 caracteres."),
    ctaLink: z.string().url("Insira uma URL válida."),
    imageUrl: z.string().url("Insira uma URL de imagem válida."),
});

type EmailBuilderValues = z.infer<typeof emailBuilderSchema>;
type ProductForSelection = Pick<Product, 'id' | 'name' | 'images'>;

interface EmailBuilderClientProps {
    productsForSelection: ProductForSelection[];
}

export function EmailBuilderClient({ productsForSelection }: EmailBuilderClientProps) {
    const [isSending, setIsSending] = useState(false);

    const form = useForm<EmailBuilderValues>({
        resolver: zodResolver(emailBuilderSchema),
        defaultValues: {
            targetAudience: { newsletter: true, allUsers: false },
            subject: "",
            headline: "",
            body: "",
            ctaText: "Ver Oferta",
            ctaLink: process.env.NEXT_PUBLIC_APP_URL || "https://",
            imageUrl: "",
        },
    });

    const watchedValues = form.watch();

    const handleProductSelect = (product: ProductForSelection) => {
        form.setValue('headline', product.name);
        if (product.images.length > 0) {
            form.setValue('imageUrl', product.images[0]);
        }
        form.setValue('ctaLink', `${process.env.NEXT_PUBLIC_APP_URL || ''}/products/${product.id}`);
        toast.info(`Dados do produto "${product.name}" preenchidos no formulário.`);
    }

    async function onSubmit(data: EmailBuilderValues) {
        setIsSending(true);
        try {
            const response = await fetch('/api/admin/marketing/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Falha ao enviar a campanha.");

            toast.success("Campanha enviada com sucesso!", { description: result.message });
            form.reset();
        } catch (error) {
            toast.error("Erro ao enviar campanha", {
                description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
            {/* HERO BANNER - MARKETING (INDIGO/BLUE THEME) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-900/50">
                <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/3 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-start text-left">
                    <Badge variant="outline" className="text-indigo-300 border-indigo-500/30 bg-indigo-950/50 mb-4 px-3 py-1 flex items-center gap-1.5 shadow-inner">
                        <Send className="w-3 h-3" /> Comunicação Ativa
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Campanhas de Email</h1>
                    <p className="text-indigo-100/70 max-w-xl text-lg">
                        Crie e dispare e-mails de marketing em massa para os seus inscritos na newsletter ou para toda a base de utilizadores.
                    </p>
                </div>

                <div className="relative z-10 shrink-0 hidden md:flex">
                    <div className="p-5 bg-black/40 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                        <Mail className="w-16 h-16 text-indigo-400" />
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_450px] gap-8 items-start">

                    {/* ESQUERDA: EDITOR (Blocos) */}
                    <div className="grid gap-8">

                        {/* 1. Audiência */}
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    <Users className="h-5 w-5 text-indigo-500" /> 1. Público-Alvo
                                </CardTitle>
                                <CardDescription>Quem vai receber esta campanha?</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <FormField control={form.control} name="targetAudience.newsletter" render={({ field }) => (
                                    <FormItem className={cn("flex flex-row items-center space-x-3 space-y-0 p-4 rounded-xl border transition-colors", field.value ? "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/50" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800")}>
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" /></FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Inscritos na Newsletter</FormLabel>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Pessoas que subscreveram voluntariamente os emails de marketing.</p>
                                        </div>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="targetAudience.allUsers" render={({ field }) => (
                                    <FormItem className={cn("flex flex-row items-center space-x-3 space-y-0 p-4 rounded-xl border transition-colors", field.value ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800")}>
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" /></FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">Todos os Utilizadores (Cuidado)</FormLabel>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Inclui quem tem conta mas não subscreveu ativamente emails de marketing.</p>
                                        </div>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="targetAudience" render={() => <FormMessage />} />
                            </CardContent>
                        </Card>

                        {/* 2. Conteúdo Visual */}
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    <LayoutTemplate className="h-5 w-5 text-indigo-500" /> 2. Composição Visual
                                </CardTitle>
                                <CardDescription>Estruture a mensagem principal do email.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                    <ProductSelector products={productsForSelection} onSelect={handleProductSelect} />
                                </div>

                                <FormField name="subject" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><AtSign className="w-4 h-4 text-slate-400" /> Assunto do Email (Header)</FormLabel>
                                        <FormControl><Input placeholder="Ex: Última Oportunidade: Promoção de Inverno!" {...field} className="bg-white dark:bg-slate-950" /></FormControl>
                                        <FormDescription>Texto que aparece na caixa de entrada do utilizador.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <FormField name="headline" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Título Principal (Corpo)</FormLabel>
                                            <FormControl><Input placeholder="Uma Oferta Inacreditável!" {...field} className="bg-white dark:bg-slate-950" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField name="imageUrl" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-slate-400" /> URL da Imagem Destaque</FormLabel>
                                            <FormControl><Input placeholder="https://exemplo.com/imagem.png" {...field} className="bg-white dark:bg-slate-950" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField name="body" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Texto Principal</FormLabel>
                                        <FormControl><Textarea placeholder="Descreva os detalhes da campanha, porque o cliente deve clicar e comprar agora..." rows={5} {...field} className="bg-white dark:bg-slate-950 resize-none" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* 3. Call to Action */}
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    <MousePointerClick className="h-5 w-5 text-indigo-500" /> 3. Call to Action (CTA)
                                </CardTitle>
                                <CardDescription>O botão principal que converte a leitura em ação.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
                                <FormField name="ctaText" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Texto do Botão</FormLabel>
                                        <FormControl><Input placeholder="Ex: Ver Agora!" {...field} className="bg-white dark:bg-slate-950" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="ctaLink" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link de Destino (URL)</FormLabel>
                                        <FormControl><Input placeholder="https://seu-site.com/oferta" {...field} className="bg-white dark:bg-slate-950" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                    </div>

                    {/* DIREITA: PREVIEW & AÇÕES */}
                    <div className="flex flex-col gap-6 sticky top-[90px]">

                        {/* Ação de Envio (Destacada) */}
                        <Card className="shadow-lg border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                <div>
                                    <h3 className="font-bold text-indigo-900 dark:text-indigo-400 text-lg">Pronto para Enviar?</h3>
                                    <p className="text-xs text-indigo-700/80 dark:text-indigo-500/80 mt-1">
                                        Reveja o layout abaixo antes de disparar. Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                                <Button type="submit" size="lg" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold h-12 text-md">
                                    {isSending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Disparo...</> : <><Send className="mr-2 h-5 w-5" /> Enviar Campanha Agora</>}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Caixa de Preview */}
                        <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
                            <CardHeader className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    </div>
                                    <span className="ml-2 text-xs font-medium text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3" /> Pré-visualização do Cliente</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 bg-slate-50 dark:bg-slate-950">
                                <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">De:</span> Zaca Marketing &lt;noreply@zaca.com&gt;
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Assunto:</span> <span className="font-medium text-slate-900 dark:text-white truncate">{watchedValues.subject || "..."}</span>
                                    </div>
                                </div>
                                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 flex justify-center min-h-[400px]">
                                    <div className="w-full max-w-sm">
                                        <EmailPreview {...watchedValues} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </Form>
        </div>
    );
}

// Componente para selecionar um produto e preencher o formulário
function ProductSelector({ products, onSelect }: { products: ProductForSelection[], onSelect: (product: ProductForSelection) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-3">
            <Label className="text-indigo-900 dark:text-indigo-300 font-semibold">Preenchimento Mágico (Opcional)</Label>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80">Escolha um produto da loja para pré-preencher automaticamente o título, link e imagem da campanha.</p>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-white dark:bg-slate-950 border-indigo-200 dark:border-indigo-800">
                        Selecione um produto para divulgar...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-indigo-200 dark:border-indigo-800">
                    <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                            <CommandGroup>
                                {products.map(product => (
                                    <CommandItem key={product.id} onSelect={() => { onSelect(product); setOpen(false); }} className="cursor-pointer">
                                        <Package className="w-4 h-4 mr-2 text-indigo-500 opacity-50" />
                                        <span className="truncate">{product.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// Componente para a pré-visualização do email (Mockup real)
function EmailPreview({ headline, body, ctaText, ctaLink, imageUrl }: Partial<EmailBuilderValues>) {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 w-full" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {imageUrl ? (
                <div className="relative w-full aspect-video bg-slate-100">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
            ) : (
                <div className="w-full aspect-video bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 border-b border-slate-100">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-medium uppercase tracking-wider">Espaço da Imagem</span>
                </div>
            )}
            <div className="p-6 md:p-8 text-center flex flex-col items-center">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                    {headline || "O Título da Oferta Aparece Aqui"}
                </h2>
                <div className="w-12 h-1 bg-indigo-500 mx-auto mt-4 mb-5 rounded-full"></div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {body || "Esta é a área onde o corpo do seu email será renderizado. Escreva uma mensagem persuasiva para convencer os seus clientes a clicarem no botão abaixo."}
                </p>
                <div className="mt-8 w-full">
                    <a href={ctaLink || '#'} target="_blank" rel="noopener noreferrer"
                        className="block w-full sm:w-auto sm:inline-block bg-orange-500 hover:bg-orange-600 transition-colors text-white py-3 px-8 rounded-lg font-bold shadow-md shadow-orange-500/20 text-sm">
                        {ctaText || "Botão de Ação"}
                    </a>
                </div>
            </div>
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} Zacaplace. Todos os direitos reservados.</p>
            </div>
        </div>
    );
}