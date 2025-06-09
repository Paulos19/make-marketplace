'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/app/components/ImageUpload';

const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  linkUrl: z.string().url({ message: 'Por favor, insira uma URL válida.' }).optional().or(z.literal('')),
  imageUrl: z.string().min(1, { message: 'Por favor, envie uma imagem.' }),
});

type BannerFormValues = z.infer<typeof formSchema>;

interface BannerFormProps {
    onSuccess: () => void;
}

export function BannerForm({ onSuccess }: BannerFormProps) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      linkUrl: '',
      imageUrl: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: BannerFormValues) => {
    try {
      await axios.post('/api/admin/banners', values);
      toast.success('Banner criado com sucesso!');
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error('Ocorreu um erro ao criar o banner.');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Banner</CardTitle>
        <CardDescription>Preencha os dados para adicionar um novo banner à homepage.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Banner</FormLabel>
                  <FormControl>
                    {/* <<< INÍCIO DA CORREÇÃO >>> */}
                    <ImageUpload
                      maxFiles={1}
                      // A prop para arquivos existentes é `currentFiles`
                      currentFiles={field.value ? [field.value] : []}
                      // A prop para quando o upload termina é `onUploadComplete`
                      onUploadComplete={(urls) => {
                        // O uploader retorna um array de URLs, pegamos a primeira
                        if (urls.length > 0) {
                          field.onChange(urls[0]);
                        }
                      }}
                      // A prop para remover um arquivo é `onRemoveFile`
                      onRemoveFile={() => field.onChange('')}
                    />
                    {/* <<< FIM DA CORREÇÃO >>> */}
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
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Promoção de Verão" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link de Redirecionamento (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/produtos-em-promocao" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A criar...' : 'Criar Banner'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
