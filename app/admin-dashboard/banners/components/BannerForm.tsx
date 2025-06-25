'use client';

import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/app/components/ImageUpload';

// Schema para validação (o mesmo do componente pai BannersClient)
const formSchema = z.object({
  title: z.string().optional(),
  imageUrl: z.string().url({ message: 'Por favor, suba uma imagem para o banner.' }),
  linkUrl: z.string().url({ message: 'URL inválida. Se não houver link, deixe em branco.' }).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof formSchema>;

// A interface agora espera receber a instância do formulário via props
interface BannerFormProps {
  form: UseFormReturn<BannerFormValues>;
}

// O componente agora é apenas a UI do formulário, recebendo a lógica do pai.
export function BannerForm({ form }: BannerFormProps) {
  return (
    <Form {...form}>
      {/* A tag <form> e o botão de submit estão no componente pai (BannersClient) */}
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Banner (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Promoção de Verão" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do Banner</FormLabel>
              <FormControl>
                <ImageUpload
                  onUploadComplete={(urls) => urls.length > 0 && field.onChange(urls[0])}
                  currentFiles={field.value ? [field.value] : []}
                  onRemoveFile={() => field.onChange('')}
                  maxFiles={1}
                  storagePath="banners/"
                />
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
              <FormLabel>URL do Link (para onde o banner aponta)</FormLabel>
              <FormControl>
                <Input placeholder="https://seusite.com/promocao" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Banner Ativo</FormLabel>
                <FormDescription>Desative para ocultar o banner sem o excluir.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
