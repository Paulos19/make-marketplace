'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver, useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea'; 
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { User, Store, Image as ImageIconLucide, Save, UserCircle2, Loader2 } from 'lucide-react';
import Navbar from '@/app/components/layout/Navbar'; 
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';

// Schema Zod Atualizado para incluir showInSellersPage
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }).max(50, {
    message: 'O nome não pode ter mais de 50 caracteres.',
  }).optional().nullable(),
  email: z.string().email({ 
    message: 'Por favor, insira um email válido.',
  }),
  whatsappLink: z.string().url({
    message: 'Insira uma URL válida (ex: https://wa.me/SEUNUMERO).',
  }).or(z.literal('')).optional().nullable(),
  storeName: z.string().min(2, {
    message: 'O nome da loja deve ter pelo menos 2 caracteres.',
  }).max(70, {
    message: 'O nome da loja não pode ter mais de 70 caracteres.',
  }).optional().nullable(),
  profileDescription: z.string().max(500, {
    message: 'A descrição do perfil não pode ter mais de 500 caracteres.',
  }).optional().nullable(),
  showInSellersPage: z.boolean().default(false), // Novo campo
});

// Interface UserData Atualizada
interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  whatsappLink?: string | null;
  storeName?: string | null;
  sellerBannerImageUrl?: string | null;
  profileDescription?: string | null;
  showInSellersPage?: boolean | null; // Novo campo
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [pageError, setPageError] = useState<string | null>(null); 
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null); 
  const [sellerBannerImageUrlState, setSellerBannerImageUrlState] = useState<string | null>(null); 
  const [initialDataLoading, setInitialDataLoading] = useState(true); 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
    defaultValues: {
      name: '',
      email: '',
      whatsappLink: '',
      storeName: '',
      profileDescription: '',
      showInSellersPage: false,
    },
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setInitialDataLoading(true);
      fetch('/api/user') 
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao buscar dados do usuário para edição.');
          return res.json();
        })
        .then((data: UserData) => {
          if (data) {
            setUserData(data);
            form.reset({
              name: data.name || '',
              email: data.email || '',
              whatsappLink: data.whatsappLink || '',
              storeName: data.storeName || '',
              profileDescription: data.profileDescription || '',
              showInSellersPage: data.showInSellersPage || false,
            });
            setProfileImageUrl(data.image || null);
            setSellerBannerImageUrlState(data.sellerBannerImageUrl || null);
          } else {
            throw new Error("Dados do usuário não encontrados ou inválidos na resposta.");
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar dados do usuário:', err);
          setPageError(err.message || 'Falha ao carregar dados do perfil.');
          toast.error(err.message || 'Não foi possível carregar os dados do perfil.');
        })
        .finally(() => setInitialDataLoading(false));
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, form, router]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setPageError(null);

    const dataToUpdate: Partial<UserData> = { 
      name: values.name,
      whatsappLink: values.whatsappLink || null,
      storeName: values.storeName || null,
      profileDescription: values.profileDescription || null,
      image: profileImageUrl, 
      sellerBannerImageUrl: sellerBannerImageUrlState,
      showInSellersPage: values.showInSellersPage,
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
      
      const sessionUpdateData: any = {};
      if (responseData.name !== session?.user?.name) sessionUpdateData.name = responseData.name;
      if (responseData.image !== session?.user?.image) sessionUpdateData.image = responseData.image;
      
      if (Object.keys(sessionUpdateData).length > 0) {
        await update({ user: { ...session?.user, ...sessionUpdateData } });
      }

      toast.success('Seu perfil foi atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no onSubmit settings:', error);
      const errMsg = error.errors ? JSON.stringify(error.errors) : error.message;
      setPageError(errMsg);
      toast.error(errMsg || 'Ocorreu um erro ao atualizar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getAvatarFallbackText = () => {
    const nameToUse = form.getValues('name') || userData?.name || session?.user?.name;
    if (nameToUse) {
      const initials = nameToUse.trim().split(' ').map(n => n[0]).join('').toUpperCase();
      return initials.substring(0, 2) || <UserCircle2 />;
    }
    return <UserCircle2 />;
  };

  if (status === 'loading' || initialDataLoading) {
    return (
      <div className="container mx-auto py-8 sm:py-12 px-4">
        <Navbar />
        <header className="mb-8 sm:mb-10">
          <Skeleton className="h-10 w-3/4 sm:w-1/2 rounded-md bg-slate-200 dark:bg-slate-700" />
          <Skeleton className="h-4 w-full sm:w-3/4 mt-3 rounded-md bg-slate-200 dark:bg-slate-700" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-lg dark:bg-slate-800/50">
              <CardHeader><Skeleton className="h-6 w-1/2 rounded-md bg-slate-300 dark:bg-slate-600" /><Skeleton className="h-4 w-3/4 mt-2 rounded-md bg-slate-200 dark:bg-slate-700" /></CardHeader>
              <CardContent className="space-y-4">
                {i === 0 && <Skeleton className="h-32 w-32 rounded-full mx-auto bg-slate-300 dark:bg-slate-600" />}
                <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                {i !== 0 && <Skeleton className="h-10 w-full rounded-md bg-slate-200 dark:bg-slate-700" />}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!session || !userData) { 
     return (
        <>
            <Navbar />
            <p className="text-center py-20 text-lg text-zaca-vermelho">
                Você precisa estar logado para ver esta página ou houve um erro ao carregar os dados. Ai, pastor!
            </p>
        </>
     );
  }

  return (
    <>
    <Navbar />
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <header className="mb-8 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas filter drop-shadow-sm">
          Configurações do Zaca
        </h1>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Aqui você dá um " tapa no visual" das suas informações, cumpadi! Deixe tudo nos trinques.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                    <UserCircle2 className="mr-2.5 h-5 w-5 text-zaca-azul" /> Foto de Perfil (Avatar)
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">Sua carinha pra galera te conhecer!</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-5 pt-3">
                  <Avatar className="h-40 w-40 border-4 border-zaca-lilas/50 shadow-lg text-4xl">
                    <AvatarImage src={profileImageUrl || undefined} alt={form.getValues('name') || userData.name || 'Avatar do Usuário'} />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {getAvatarFallbackText()}
                    </AvatarFallback>
                  </Avatar>
                  <ImageUpload
                    onUploadComplete={(urls) => urls.length > 0 && setProfileImageUrl(urls[0])}
                    userId={userData.id}
                    maxFiles={1}
                    storagePath={`profile_pictures/`}
                    currentFiles={profileImageUrl ? [profileImageUrl] : []}
                    onRemoveFile={() => setProfileImageUrl(null)}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                    <ImageIconLucide className="mr-2.5 h-5 w-5 text-zaca-magenta" /> Banner da Loja do Zaca
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">A imagem que aparece no topo da sua página de vendedor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-3">
                  {sellerBannerImageUrlState && (
                    <div className="aspect-video w-full relative rounded-md overflow-hidden border dark:border-slate-700">
                       <Image src={sellerBannerImageUrlState} alt="Banner da loja" layout="fill" objectFit="cover" />
                    </div>
                  )}
                  <ImageUpload
                    onUploadComplete={(urls) => urls.length > 0 && setSellerBannerImageUrlState(urls[0])}
                    userId={userData.id}
                    maxFiles={1}
                    storagePath={`seller_banners/`}
                    currentFiles={sellerBannerImageUrlState ? [sellerBannerImageUrlState] : []}
                    onRemoveFile={() => setSellerBannerImageUrlState(null)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                    <User className="mr-2.5 h-5 w-5 text-zaca-azul" /> Seus Dados, Cumpadi
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">Como a galera vai te achar e te chamar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-300">Seu Nome (pro crachá!)</FormLabel>
                      <FormControl><Input placeholder="Zacarias da Silva" {...field} value={field.value ?? ''} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-300">Email (pra gente te achar)</FormLabel>
                      <FormControl><Input placeholder="zaca@trapalhoes.com" {...field} disabled className="disabled:opacity-70 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-400" /></FormControl>
                       <FormDescription className="dark:text-slate-500 text-xs">Seu email não pode ser alterado aqui, psit!</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="whatsappLink" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-300">Link do Zap do Zaca (WhatsApp)</FormLabel>
                      <FormControl><Input placeholder="https://wa.me/55119..." {...field} value={field.value ?? ''} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" /></FormControl>
                      <FormDescription className="dark:text-slate-500 text-xs">Formato: https://wa.me/SEUNUMEROCOMCODIGOPAIS (ex: https://wa.me/5511987654321)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                    <Store className="mr-2.5 h-5 w-5 text-zaca-magenta" /> Detalhes da Loja do Zaca
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">Como sua "baiuca" vai aparecer pra clientela.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-3">
                  <FormField control={form.control} name="storeName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-300">Nome da Loja (Capricha!)</FormLabel>
                      <FormControl><Input placeholder="Ex: Paraíso dos Achadinhos do Zaca" {...field} value={field.value ?? ''} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="profileDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-300">Descrição da Loja / Perfil (Pro Zaca se apresentar!)</FormLabel>
                      <FormControl><Textarea placeholder="Conte um pouco sobre você e sua loja, seus produtos... (Máx. 500 caracteres)" {...field} value={field.value ?? ''} rows={5} className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-50 dark:placeholder-slate-400" /></FormControl>
                      <FormDescription className="dark:text-slate-500 text-xs">Essa descrição aparecerá na sua página de vendedor.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField
                    control={form.control}
                    name="showInSellersPage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 dark:border-slate-700">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base dark:text-slate-200">
                            Exibir na Página de Vendedores
                          </FormLabel>
                          <FormDescription className="dark:text-slate-400">
                            Ative para que seu card de vendedor apareça na página pública de vendedores.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
            {pageError && <p className="text-sm font-medium text-zaca-vermelho text-center sm:text-left flex-grow animate-pulse">Ô psit, deu erro: {pageError}</p>}
            <Button 
              type="submit" 
              disabled={isSubmitting || status !== 'authenticated'} 
              size="lg"
              className="w-full sm:w-auto bg-zaca-azul hover:bg-zaca-azul/90 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105 font-semibold py-3"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando as 'Zacarias-formações'...</>
              ) : (
                <><Save className="mr-2 h-5 w-5" /> Salvar Alterações do Zaca!</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
    </>
  );
}
