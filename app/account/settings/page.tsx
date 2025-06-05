"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; 
import { User, Save, UserCircle2, Loader2 } from 'lucide-react'; 
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Label } from '@/components/ui/label';

// Schema Zod simplificado para esta página
const userSettingsSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }).max(50, {
    message: 'O nome não pode ter mais de 50 caracteres.',
  }).optional().nullable(),
});

type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;

interface SimpleUserData {
  id: string;
  name?: string | null;
  image?: string | null;
}

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [userData, setUserData] = useState<SimpleUserData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); 
  const [isLoadingData, setIsLoadingData] = useState(true); 

  const form = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setIsLoadingData(true);
      fetch('/api/user') // Reutiliza a mesma API para buscar os dados
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao buscar seus dados, cumpadi.');
          return res.json();
        })
        .then((data: SimpleUserData) => {
          setUserData(data);
          form.reset({ name: data.name || '' });
          setProfileImageUrl(data.image || null);
        })
        .catch((err) => {
          toast.error(err.message || 'Não foi possível carregar os dados do perfil.');
        })
        .finally(() => setIsLoadingData(false));
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, form, router]);

  const onSubmit = async (values: UserSettingsFormValues) => {
    setIsSubmitting(true);

    const dataToUpdate: Partial<SimpleUserData> = { 
      name: values.name,
      image: profileImageUrl, 
    };

    try {
      const response = await fetch('/api/user', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Falha ao atualizar perfil');
      }
      
      // Atualiza a sessão do NextAuth localmente
      await update({ user: { ...session?.user, name: responseData.name, image: responseData.image } });

      toast.success('Seu perfil foi atualizado com sucesso, Zé!');
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao atualizar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAvatarFallbackText = () => {
    const nameToUse = form.getValues('name') || userData?.name;
    if (nameToUse) {
      const initials = nameToUse.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };

  if (isLoadingData || status === 'loading') {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-12 px-4 max-w-2xl animate-pulse">
            <Skeleton className="h-10 w-3/4 mb-2 rounded-md" />
            <Skeleton className="h-4 w-1/2 mb-10 rounded-md" />
            <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-12 w-40 rounded-md self-end" />
            </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (!session || !userData) { 
    return null; // ou uma mensagem de erro
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <header className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Configurações da Conta
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Mude seu nome e sua foto de "Zaca-presentação"!
            </p>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                    <User className="mr-2.5 h-5 w-5 text-zaca-azul" /> Suas Informações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  {/* Campo de Nome */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Seu Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome, carinho!" {...field} value={field.value ?? ''} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50" />
                        </FormControl>
                        <FormDescription className="dark:text-slate-500 text-xs">Como você aparecerá no Zacaplace.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload de Imagem */}
                  <div>
                    <Label className="mb-2 block text-sm font-medium dark:text-slate-300">Sua Foto de Perfil</Label>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-zaca-lilas/50 shadow-md text-3xl">
                            <AvatarImage src={profileImageUrl || undefined} alt={userData.name || 'Avatar'} />
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-700">{getAvatarFallbackText()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 w-full">
                            <ImageUpload
                                onUploadComplete={(urls) => urls.length > 0 && setProfileImageUrl(urls[0])}
                                userId={userData.id}
                                maxFiles={1}
                                storagePath={`profile_pictures/`}
                                currentFiles={profileImageUrl ? [profileImageUrl] : []}
                                onRemoveFile={() => setProfileImageUrl(null)}
                            />
                        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  size="lg"
                  className="bg-zaca-azul hover:bg-zaca-azul/90 text-white shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="mr-2 h-5 w-5" /> Salvar Alterações</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}