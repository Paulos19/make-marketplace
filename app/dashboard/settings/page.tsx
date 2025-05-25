'use client';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; 
import { User, Mail, Link as LinkIcon, UploadCloud, Trash2, Save, UserCircle2 } from 'lucide-react'; 
import Navbar from '@/app/components/layout/Navbar';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }).max(50, {
    message: 'O nome não pode ter mais de 50 caracteres.',
  }),
  email: z.string().email({ 
    message: 'Por favor, insira um email válido.',
  }),
  whatsappLink: z.string().url({
    message: 'Por favor, insira uma URL válida para o WhatsApp (ex: https://wa.me/SEUNUMERO).',
  }).or(z.literal('')).optional(), 
});

interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  whatsappLink?: string | null;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [pageError, setPageError] = useState<string | null>(null); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); 
  const [initialDataLoading, setInitialDataLoading] = useState(true); 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsappLink: '',
    },
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setInitialDataLoading(true);
      fetch('/api/user') 
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao buscar dados do usuário');
          return res.json();
        })
        .then((data: UserData) => {
          if (data) {
            setUserData(data);
            form.reset({
              name: data.name || '',
              email: data.email || '',
              whatsappLink: data.whatsappLink || '',
            });
            if (data.image) {
              setProfileImageUrl(data.image);
            }
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar dados do usuário:', err);
          setPageError('Falha ao carregar dados do perfil.');
          toast.error('Não foi possível carregar os dados do perfil.');
        })
        .finally(() => setInitialDataLoading(false));
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, form, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setPageError(null);

    const dataToUpdate: Partial<UserData> & { image?: string | null } = { 
      name: values.name,
      whatsappLink: values.whatsappLink || null, 
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
        throw new Error(responseData.message || 'Falha ao atualizar perfil');
      }
      
      await update({ 
        user: { 
          ...session?.user, 
          name: responseData.name, 
          image: responseData.image,
        },
      });

      toast.success('Seu perfil foi atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no onSubmit settings:', error);
      setPageError(error.message);
      toast.error(error.message || 'Ocorreu um erro ao atualizar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAvatarFallback = () => {
    const nameToUse = userData?.name || session?.user?.name;
    if (nameToUse) {
      const initials = nameToUse.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };


  if (status === 'loading' || initialDataLoading) {
    return (
      <div className="container mx-auto py-8 sm:py-12 px-4">
        <header className="mb-8 sm:mb-10">
          <Skeleton className="h-10 w-3/4 sm:w-1/2 rounded-md" />
          <Skeleton className="h-4 w-full sm:w-3/4 mt-3 rounded-md" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/2 rounded-md" /><Skeleton className="h-4 w-3/4 mt-2 rounded-md" /></CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-8 w-1/2 rounded-md" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/2 rounded-md" /><Skeleton className="h-4 w-3/4 mt-2 rounded-md" /></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Skeleton className="h-4 w-1/4 rounded-md" /><Skeleton className="h-10 w-full rounded-md" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-1/4 rounded-md" /><Skeleton className="h-10 w-full rounded-md" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-1/2 rounded-md" /><Skeleton className="h-4 w-3/4 mt-2 rounded-md" /></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Skeleton className="h-4 w-1/4 rounded-md" /><Skeleton className="h-10 w-full rounded-md" /></div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex justify-end pt-8"><Skeleton className="h-12 w-40 rounded-md" /></div>
      </div>
    );
  }
  
  if (!session || !userData) { 
    return <p className="text-center py-10">Você precisa estar logado para ver esta página ou houve um erro ao carregar os dados.</p>; 
  }

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Configurações do Perfil
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais, de contato e foto de perfil.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0"> {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {}
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-lg dark:bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center dark:text-gray-200">
                    <UserCircle2 className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-500" /> Foto de Perfil
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">Atualize sua foto para que todos te reconheçam.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-6 pt-2">
                  <Avatar className="h-36 w-36 border-4 border-sky-500/30 shadow-md">
                    <AvatarImage src={profileImageUrl || undefined} alt={userData.name || 'User avatar'} />
                    <AvatarFallback className="text-3xl bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                  {}
                  <ImageUpload
                    onUploadComplete={(urls) => {
                      if (urls && urls.length > 0) {
                        setProfileImageUrl(urls[0]);
                        toast.info("Nova imagem selecionada. Clique em 'Salvar Alterações' para aplicar.");
                      } else {
                        setProfileImageUrl(null);
                      }
                    }}
                    userId={userData.id}
                    maxFiles={1}
                    storagePath={`profile_pictures/${userData.id}`}
                  />
                  {profileImageUrl && profileImageUrl !== userData.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setProfileImageUrl(userData.image || null)} 
                      className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400"
                    >
                      Cancelar alteração de imagem
                    </Button>
                  )}
                   {profileImageUrl && ( 
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setProfileImageUrl(null);
                        toast.info("Imagem removida. Clique em 'Salvar Alterações' para aplicar.");
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3"/> Remover Imagem
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg dark:bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center dark:text-gray-200">
                    <User className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-500" /> Informações Pessoais
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">Atualize seu nome e verifique seu email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 dark:placeholder-gray-400" />
                        </FormControl>
                        <FormDescription className="dark:text-gray-500">Este será seu nome de exibição público.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu email" {...field} disabled className="disabled:opacity-70 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-400" />
                        </FormControl>
                        <FormDescription className="dark:text-gray-500">Seu email não pode ser alterado por aqui.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-lg dark:bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center dark:text-gray-200">
                    <LinkIcon className="mr-2 h-5 w-5 text-sky-600 dark:text-sky-500" /> Contato e Redes Sociais
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">Adicione seu link do WhatsApp para facilitar o contato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="whatsappLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Link do WhatsApp (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://wa.me/55119XXXXXXXX" {...field} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 dark:placeholder-gray-400" />
                        </FormControl>
                        <FormDescription className="dark:text-gray-500">
                          Facilita o contato de clientes ou outros usuários.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {}
          <div className="pt-8 flex flex-col sm:flex-row justify-end items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {pageError && <p className="text-sm font-medium text-destructive text-center sm:text-left flex-grow">{pageError}</p>}
            <Button 
              type="submit" 
              disabled={isSubmitting || status !== 'authenticated'} 
              size="lg"
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}