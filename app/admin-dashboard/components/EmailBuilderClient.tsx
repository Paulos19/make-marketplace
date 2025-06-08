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
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Send, ChevronsUpDown, Check, Eye } from "lucide-react";
import Image from "next/image";
import { Label } from "@/components/ui/label";

// Schema de validação para o formulário do email
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
    const router = useRouter();

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

    // <<< LÓGICA DE ENVIO ATUALIZADA AQUI >>>
    async function onSubmit(data: EmailBuilderValues) {
        setIsSending(true);
        try {
            const response = await fetch('/api/admin/marketing/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Falha ao enviar a campanha.");
            }
            
            toast.success("Campanha enviada!", {
                description: result.message,
            });
            // Opcional: resetar o formulário após o envio bem-sucedido
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Coluna do Formulário */}
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader><CardTitle>1. Público-Alvo</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="targetAudience.newsletter" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Inscritos na Newsletter</FormLabel></FormItem>
                                )}/>
                                <FormField control={form.control} name="targetAudience.allUsers" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Todos os Usuários Cadastrados</FormLabel></FormItem>
                                )}/>
                                <FormField control={form.control} name="targetAudience" render={() => <FormMessage />} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>2. Conteúdo do Email</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <ProductSelector products={productsForSelection} onSelect={handleProductSelect} />
                                <FormField name="subject" control={form.control} render={({ field }) => (<FormItem><FormLabel>Assunto do Email</FormLabel><FormControl><Input placeholder="Psit! Temos novidades pra você..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="headline" control={form.control} render={({ field }) => (<FormItem><FormLabel>Título Principal</FormLabel><FormControl><Input placeholder="Uma Oferta que é um Estouro!" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="imageUrl" control={form.control} render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input placeholder="https://exemplo.com/imagem.png" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="body" control={form.control} render={({ field }) => (<FormItem><FormLabel>Corpo do Email</FormLabel><FormControl><Textarea placeholder="Descreva sua oferta ou notícia aqui..." rows={6} {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>3. Chamada para Ação (CTA)</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField name="ctaText" control={form.control} render={({ field }) => (<FormItem><FormLabel>Texto do Botão</FormLabel><FormControl><Input placeholder="Ver Agora!" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField name="ctaLink" control={form.control} render={({ field }) => (<FormItem><FormLabel>Link do Botão</FormLabel><FormControl><Input placeholder="https://seu-site.com/oferta" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </CardContent>
                        </Card>

                        <Button type="submit" size="lg" disabled={isSending}>
                            {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enviando Campanha...</> : <><Send className="mr-2 h-4 w-4"/> Enviar Campanha</>}
                        </Button>
                    </div>

                    {/* Coluna de Pré-visualização */}
                    <div className="sticky top-20">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5"/> Pré-visualização</CardTitle></CardHeader>
                            <CardContent>
                                <div className="border rounded-lg p-4 bg-slate-100 dark:bg-slate-800">
                                    <EmailPreview {...watchedValues} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}

// Componente para selecionar um produto e preencher o formulário
function ProductSelector({ products, onSelect }: { products: ProductForSelection[], onSelect: (product: ProductForSelection) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-2">
            <Label>Preencher com dados de um produto (Opcional)</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                        Selecione um produto...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar produto..."/>
                        <CommandList><CommandEmpty>Nenhum produto encontrado.</CommandEmpty><CommandGroup>
                            {products.map(product => (
                                <CommandItem key={product.id} onSelect={() => { onSelect(product); setOpen(false); }}>
                                    {product.name}
                                </CommandItem>
                            ))}
                        </CommandGroup></CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// Componente para a pré-visualização do email
function EmailPreview({ subject, headline, body, ctaText, ctaLink, imageUrl }: Partial<EmailBuilderValues>) {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
            <p className="text-sm text-slate-500"><strong>Assunto:</strong> {subject || "..."}</p>
            <div className="mt-4 border rounded-lg overflow-hidden bg-white">
                {imageUrl ? (
                    <Image src={imageUrl} alt="Preview" width={500} height={250} className="w-full object-cover"/>
                ) : (
                    <div className="h-48 bg-slate-200 flex items-center justify-center text-slate-500">Imagem do Email</div>
                )}
                <div className="p-6">
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#8A2BE2' }}>{headline || "Título Principal do Email"}</h2>
                    <p style={{ marginTop: '16px' }}>{body || "Corpo da mensagem do seu e-mail de marketing aparecerá aqui. Escreva algo que chame a atenção dos seus clientes!"}</p>
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <a href={ctaLink || '#'} target="_blank" rel="noopener noreferrer" style={{
                            backgroundColor: '#f97316', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block'
                        }}>
                            {ctaText || "Botão de Ação"}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}