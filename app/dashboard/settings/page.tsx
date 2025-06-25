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
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; 
import { Skeleton } from '@/components/ui/skeleton'; 
import { User, Store, Image as ImageIconLucide, Save, UserCircle2, Loader2, Lock, Crown } from 'lucide-react'; 
import Navbar from '@/app/components/layout/Navbar'; 
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubscriptionStatus } from '@prisma/client';
import Footer from '@/app/components/layout/Footer';
import { Separator } from '@/components/ui/separator';

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
  showInSellersPage: z.boolean().default(false),
});

interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  whatsappLink?: string | null;
  storeName?: string | null;
  sellerBannerImageUrl?: string | null;
  profileDescription?: string | null;
  showInSellersPage?: boolean | null;
  stripeSubscriptionStatus?: SubscriptionStatus | null;
}

const SubscriptionActionCard = ({ onCheckout, isLoading }: { onCheckout: () => void, isLoading: boolean }) => (
    <Card className="shadow-xl border-amber-400 border-2 bg-gradient-to-tr from-yellow-50 via-amber-50 to-white dark:from-slate-900 dark:via-amber-900/20 dark:to-slate-900">
        <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 bg-amber-400/20 rounded-full">
                <Crown className="h-8 w-8 text-amber-500" />
            </div>
            <div>
                <CardTitle className="text-xl text-amber-900 dark:text-amber-300">
                    Ative seu Catálogo Público!
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                    Assine o plano "Meu Catálogo no Zaca" para exibir sua loja na página de vendedores.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-amber-900 font-bold" onClick={onCheckout} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Crown className="mr-2 h-5 w-5" />}
                Assinar Agora (R$ 19,90/mês)
            </Button>
        </CardContent>
    </Card>
);

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
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
  
  const hasActiveSubscription = userData?.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE;

  const fetchUserData = useCallback(() => {
    if (status === 'authenticated' && session?.user?.id) {
        setInitialDataLoading(true);
        fetch('/api/user')
          .then((res) => {
            if (!res.ok) throw new Error('Falha ao buscar dados do usuário.');
            return res.json();
          })
          .then((data: UserData) => {
              setUserData(data);
              form.reset({
                  name: data.name || '',
                  email: data.email || '',
                  whatsappLink: data.whatsappLink || '',
                  storeName: data.storeName || '',
                  profileDescription: data.profileDescription || '',
                  showInSellersPage: data.stripeSubscriptionStatus === SubscriptionStatus.ACTIVE && data.showInSellersPage || false,
              });
              setProfileImageUrl(data.image || null);
              setSellerBannerImageUrlState(data.sellerBannerImageUrl || null);
          })
          .catch((err) => {
            toast.error(err.message || 'Não foi possível carregar os dados do perfil.');
          })
          .finally(() => setInitialDataLoading(false));
      } else if (status === 'unauthenticated') {
        router.push('/auth/signin');
      }
  }, [session, status, form, router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSubscriptionCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
        const response = await fetch('/api/stripe/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID,
                type: 'subscription'
            })
        });
        const { url, error } = await response.json();
        if (!response.ok || !url) {
            throw new Error(error || "Não foi possível iniciar o checkout.");
        }
        window.location.href = url;
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
        setIsCheckoutLoading(false);
    }
  }


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
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
      if (!response.ok) throw new Error(responseData.message || 'Falha ao atualizar perfil');
      await update({ user: { ...session?.user, name: responseData.name, image: responseData.image } });
      toast.success('Seu perfil foi atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao atualizar o perfil.');
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

  if (initialDataLoading || status === 'loading') {
    return (
      <div className='flex flex-col min-h-screen'>
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto py-12 px-4 max-w-4xl animate-pulse">
            <header className="mb-10 text-center">
              <Skeleton className="h-12 w-3/4 mx-auto rounded-lg bg-slate-200 dark:bg-slate-700" />
              <Skeleton className="h-5 w-1/2 mx-auto mt-4 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 space-y-8">
                <Card className="dark:bg-slate-800/50">
                  <CardHeader><Skeleton className="h-6 w-3/4 rounded-md bg-slate-300 dark:bg-slate-600" /></CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4 pt-3">
                    <Skeleton className="h-40 w-40 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <Skeleton className="h-24 w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800/50">
                  <CardHeader><Skeleton className="h-6 w-3/4 rounded-md bg-slate-300 dark:bg-slate-600" /></CardHeader>
                  <CardContent className="pt-3">
                    <Skeleton className="aspect-video w-full rounded-md bg-slate-200 dark:bg-slate-700" />
                    <Skeleton className="h-10 w-full mt-4 rounded-md bg-slate-200 dark:bg-slate-700" />
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-2 space-y-8">
                <Card className="dark:bg-slate-800/50">
                  <CardHeader><Skeleton className="h-6 w-1/2 rounded-md bg-slate-300 dark:bg-slate-600" /></CardHeader>
                  <CardContent className="space-y-6 pt-3">
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700" /><Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-700" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700" /><Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-700" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700" /><Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-700" /></div>
                  </CardContent>
                </Card>
                <Card className="dark:bg-slate-800/50">
                  <CardHeader><Skeleton className="h-6 w-1/2 rounded-md bg-slate-300 dark:bg-slate-600" /></CardHeader>
                  <CardContent className="space-y-6 pt-3">
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700" /><Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-700" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700" /><Skeleton className="h-20 w-full bg-slate-200 dark:bg-slate-700" /></div>
                    <Skeleton className="h-16 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-3 flex justify-end"><Skeleton className="h-12 w-48 rounded-md bg-slate-300 dark:bg-slate-600" /></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!session || !userData) { 
     return null;
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <header className="mb-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Configurações do Vendedor
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              Ajuste as informações da sua loja e perfil.
            </p>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 space-y-8">
                <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                      <UserCircle2 className="mr-2.5 h-5 w-5 text-zaca-azul" /> Foto de Perfil
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-5 pt-3">
                    <Avatar className="h-40 w-40 border-4 border-zaca-lilas/50 shadow-lg text-4xl">
                      <AvatarImage src={profileImageUrl || undefined} alt={form.getValues('name') || userData.name || 'Avatar'} />
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700">{getAvatarFallbackText()}</AvatarFallback>
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
                      <ImageIconLucide className="mr-2.5 h-5 w-5 text-zaca-magenta" /> Banner da Loja
                    </CardTitle>
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

              <div className="md:col-span-2 space-y-8">
                <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                      <User className="mr-2.5 h-5 w-5 text-zaca-azul" /> Seus Dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-3">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Seu Nome</FormLabel><FormControl><Input placeholder="Zacarias da Silva" {...field} value={field.value ?? ''} className="dark:bg-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="zaca@trapalhoes.com" {...field} disabled className="disabled:opacity-70" /></FormControl><FormDescription className="text-xs">Seu email não pode ser alterado.</FormDescription><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="whatsappLink" render={({ field }) => (<FormItem><FormLabel>Link do WhatsApp</FormLabel><FormControl><Input placeholder="https://wa.me/55..." {...field} value={field.value ?? ''} className="dark:bg-slate-700" /></FormControl><FormDescription className="text-xs">Formato: https://wa.me/SEUNUMEROCOMCODIGOPAIS</FormDescription><FormMessage /></FormItem>)} />
                  </CardContent>
                </Card>

                <Card className="shadow-xl dark:bg-slate-800/70 border dark:border-slate-700/60">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center text-slate-800 dark:text-slate-100">
                      <Store className="mr-2.5 h-5 w-5 text-zaca-magenta" /> Detalhes e Visibilidade da Loja
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-3">
                    {/* <<< CAMPOS ADICIONADOS AQUI >>> */}
                    <FormField control={form.control} name="storeName" render={({ field }) => (<FormItem><FormLabel>Nome da Loja</FormLabel><FormControl><Input placeholder="Ex: Paraíso dos Achadinhos" {...field} value={field.value ?? ''} className="dark:bg-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="profileDescription" render={({ field }) => (<FormItem><FormLabel>Descrição da Loja</FormLabel><FormControl><Textarea placeholder="Conte sobre sua loja..." {...field} value={field.value ?? ''} rows={4} className="dark:bg-slate-700" /></FormControl><FormMessage /></FormItem>)} />
                    <Separator />
                    <FormField
                      control={form.control}
                      name="showInSellersPage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 dark:border-slate-700">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base dark:text-slate-200">Exibir na Página de Vendedores</FormLabel>
                            <FormDescription className="dark:text-slate-400 text-xs">Ative para que sua loja apareça na página pública.</FormDescription>
                          </div>
                          <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <div className="flex items-center">
                                          <FormControl>
                                              <Switch
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  disabled={!hasActiveSubscription || isSubmitting}
                                                  aria-readonly={!hasActiveSubscription}
                                              />
                                          </FormControl>
                                      </div>
                                  </TooltipTrigger>
                                  {!hasActiveSubscription && (
                                      <TooltipContent>
                                          <p className="flex items-center gap-2">
                                              <Lock className="h-4 w-4" /> Assine o plano "Meu Catálogo" para habilitar.
                                          </p>
                                      </TooltipContent>
                                  )}
                              </Tooltip>
                          </TooltipProvider>
                        </FormItem>
                      )}
                    />
                    
                    {!hasActiveSubscription && (
                        <SubscriptionActionCard onCheckout={handleSubscriptionCheckout} isLoading={isCheckoutLoading} />
                    )}
                  </CardContent>
                </Card>
              </div>
            
              <div className="md:col-span-3 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  size="lg"
                  className="bg-zaca-azul hover:bg-zaca-azul/90 text-white shadow-md"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Salvar Alterações
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