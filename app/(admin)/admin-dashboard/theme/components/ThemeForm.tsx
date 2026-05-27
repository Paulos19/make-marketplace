"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ThemeSettings } from "@prisma/client";

const hslRegex = /^\s*\d{1,3}\s+\d{1,3}%\s+\d{1,3}%\s*$/;

const themeFormSchema = z.object({
  zaca_roxo: z.string().regex(hslRegex, { message: "Formato HSL inválido." }).or(z.literal("")).optional(),
  zaca_azul: z.string().regex(hslRegex, { message: "Formato HSL inválido." }).or(z.literal("")).optional(),
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

export function ThemeForm({ currentTheme }: { currentTheme: Partial<ThemeSettings> }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      zaca_roxo: currentTheme.zaca_roxo || "",
      zaca_azul: currentTheme.zaca_azul || "",
    },
  });

  async function onSubmit(data: ThemeFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error((await response.json()).message || "Falha ao salvar.");
      toast.success("Tema atualizado com sucesso! As alterações serão aplicadas a todo o site.");
      // router.refresh() não é necessário aqui, pois as mudanças são aplicadas no layout global
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocorreu um erro.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cores da Marca</CardTitle>
        <CardDescription>Defina as cores que representam sua identidade visual.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField name="zaca_roxo" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Cor Roxa (Principal)</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl><Input placeholder="Padrão: 262 64% 49%" {...field} /></FormControl>
                  <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: `hsl(${field.value})` }}/>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            
            <FormField name="zaca_azul" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Cor Azul (Destaque)</FormLabel>
                <div className="flex items-center gap-4">
                  <FormControl><Input placeholder="Padrão: 217 91% 60%" {...field} /></FormControl>
                  <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: `hsl(${field.value})` }}/>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}