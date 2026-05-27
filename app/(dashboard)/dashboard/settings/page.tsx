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
import { User, Store, Image as ImageIconLucide, Save, UserCircle2, Loader2, Lock, Crown, Settings2, Mail, Phone, Link as LinkIcon, Building2 } from 'lucide-react'; 
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubscriptionStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  customRedirectUrl: z.string().url({
    message: 'Insira uma URL de redirecionamento válida.',
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
  customRedirectUrl?: string | null;
  storeName?: string | null;
  sellerBannerImageUrl?: string | null;
  profileDescription?: string | null;
  showInSellersPage?: boolean | null;
  stripeSubscriptionStatus?: SubscriptionStatus | null;
}

const SubscriptionActionCard = ({ onCheckout, isLoading }: { onCheckout: () => void, isLoading: boolean }) => (
    <Card className="shadow-lg border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 w-48 h-48 bg-amber-400/20 blur-[50px] rounded-full pointer-events-none" />
        <CardHeader className="flex flex-row items-start sm:items-center gap-4 pb-4">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-md shrink-0">
                <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
                <CardTitle className="text-xl text-amber-900 dark:text-amber-300">
                    Ative o seu Catálogo Público!
                </CardTitle>
                <CardDescription className="text-amber-700/80 dark:text-amber-500/80 mt-1 max-w-sm">
                    Assine o plano "Meu Catálogo no Zaca" para exibir a sua loja de forma destacada na página oficial de vendedores.
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/20" onClick={onCheckout} disabled={isLoading}>
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

  const isPremiumSeller = session?.user?.email === process.env.NEXT_PUBLIC_EMAIL_PREMIUM;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
    defaultValues: {
      name: '',
      email: '',
      whatsappLink: '',
      customRedirectUrl: '',
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
            if (!res.ok) throw new Error('Falha ao buscar dados do utilizador.');
            return res.json();
          })
          .then((data: UserData) => {
              setUserData(data);
              form.reset({
                  name: data.name || '',
                  email: data.email || '',
                  whatsappLink: data.whatsappLink || '',
                  customRedirectUrl: data.customRedirectUrl || '',
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
      whatsappLink: isPremiumSeller ? null : values.whatsappLink || null,
      customRedirectUrl: isPremiumSeller ? values.customRedirectUrl || null : null,
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
      toast.success('O seu perfil foi atualizado com sucesso!');
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

  const cardStyle = "shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden";
  const headerStyle = "bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4";

  if (initialDataLoading || status === 'loading') {
    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full animate-pulse">
            <Skeleton className="h-48 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 space-y-8">
                <Skeleton className="h-72 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="md:col-span-2 space-y-8">
                <Skeleton className="h-64 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
        </div>
    );
  }
  
  if (!session || !userData) return null;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
        
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-slate-600/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start text-left">
                <Badge variant="outline" className="text-white border-white/20 bg-white/5 mb-4 px-3 py-1">
                    Preferências
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Configurações da Conta</h1>
                <p className="text-slate-300 max-w-xl">
                    Faça a gestão dos seus dados pessoais, informações públicas da loja e a sua assinatura de catálogo no Zaca.
                </p>
            </div>
            <div className="relative z-10 shrink-0">
                 <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-inner">
                    <Settings2 className="w-12 h-12 text-slate-400" />
                 </div>
            </div>
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* COLUNA ESQUERDA (Mídia) */}
            <div className="md:col-span-1 space-y-8">
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserCircle2 className="h-5 w-5 text-slate-400" /> Avatar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-5 p-6">
                        <Avatar className="h-40 w-40 border-4 border-slate-100 dark:border-slate-800 shadow-md text-4xl">
                            <AvatarImage src={profileImageUrl || undefined} alt={form.getValues('name') || userData.name || 'Avatar'} />
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400">{getAvatarFallbackText()}</AvatarFallback>
                        </Avatar>
                        <ImageUpload
                            onUploadComplete={(urls) => urls.length > 0 && setProfileImageUrl(urls[0])}
                            userId={userData.id} maxFiles={1} storagePath={`profile_pictures/`}
                            currentFiles={profileImageUrl ? [profileImageUrl] : []}
                            onRemoveFile={() => setProfileImageUrl(null)}
                        />
                    </CardContent>
                </Card>

                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIconLucide className="h-5 w-5 text-slate-400" /> Banner da Loja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6">
                        {sellerBannerImageUrlState ? (
                        <div className="aspect-video w-full relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Image src={sellerBannerImageUrlState} alt="Banner da loja" fill className="object-cover" />
                        </div>
                        ) : (
                            <div className="aspect-video w-full relative rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                                <ImageIconLucide className="w-8 h-8 text-slate-300" />
                            </div>
                        )}
                        <ImageUpload
                            onUploadComplete={(urls) => urls.length > 0 && setSellerBannerImageUrlState(urls[0])}
                            userId={userData.id} maxFiles={1} storagePath={`seller_banners/`}
                            currentFiles={sellerBannerImageUrlState ? [sellerBannerImageUrlState] : []}
                            onRemoveFile={() => setSellerBannerImageUrlState(null)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* COLUNA DIREITA (Dados) */}
            <div className="md:col-span-2 space-y-8">
                
                {/* INFORMAÇÕES PESSOAIS */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-400" /> Dados do Vendedor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">Nome Completo</FormLabel>
                                <FormControl><Input placeholder="Zacarias da Silva" {...field} value={field.value ?? ''} className="bg-white dark:bg-slate-950" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400"/> Endereço de Email
                                </FormLabel>
                                <FormControl><Input placeholder="zaca@exemplo.com" {...field} disabled className="bg-slate-50 dark:bg-slate-900 disabled:opacity-70 cursor-not-allowed" /></FormControl>
                                <FormDescription className="text-xs">O email de registo não pode ser alterado por motivos de segurança.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        {isPremiumSeller ? (
                            <FormField control={form.control} name="customRedirectUrl" render={({ field }) => (
                                <FormItem className="rounded-lg border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-900/10 p-5 mt-4">
                                    <FormLabel className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300"><LinkIcon className="h-4 w-4" /> Link de Redirecionamento Padrão</FormLabel>
                                    <FormControl><Input placeholder="https://sua-loja-externa.com" {...field} value={field.value ?? ''} className="bg-white dark:bg-slate-950 border-indigo-200 dark:border-indigo-800" /></FormControl>
                                    <FormDescription className="text-indigo-700/60 dark:text-indigo-400/60 text-xs mt-2">Link padrão para o botão de compra de todos os seus produtos (funcionalidade Premium).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        ) : (
                            <FormField control={form.control} name="whatsappLink" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-[#25D366]"/> Link do WhatsApp (Contato)
                                    </FormLabel>
                                    <FormControl><Input placeholder="https://wa.me/55..." {...field} value={field.value ?? ''} className="bg-white dark:bg-slate-950 focus-visible:ring-[#25D366]/50" /></FormControl>
                                    <FormDescription className="text-xs">Formato ideal: https://wa.me/55NUMERO (usado para clientes lhe enviarem mensagem).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                    </CardContent>
                </Card>

                {/* DETALHES DA LOJA E ASSINATURA */}
                <Card className={cardStyle}>
                    <CardHeader className={headerStyle}>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="h-5 w-5 text-slate-400" /> Perfil Público da Loja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <FormField control={form.control} name="storeName" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" /> Nome da Loja
                                </FormLabel>
                                <FormControl><Input placeholder="Ex: Paraíso dos Achadinhos" {...field} value={field.value ?? ''} className="bg-white dark:bg-slate-950" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="profileDescription" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Sobre a Loja</FormLabel>
                                <FormControl><Textarea placeholder="Faça uma breve apresentação da sua loja, o que vende e onde se localiza..." {...field} value={field.value ?? ''} rows={4} className="bg-white dark:bg-slate-950 resize-none" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800">
                            <FormField
                            control={form.control}
                            name="showInSellersPage"
                            render={({ field }) => (
                                <FormItem className={cn("flex flex-row items-center justify-between rounded-xl border p-5 transition-colors", hasActiveSubscription ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50" : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800")}>
                                <div className="space-y-1">
                                    <FormLabel className={cn("text-base flex items-center gap-2", hasActiveSubscription ? "text-amber-900 dark:text-amber-400" : "text-slate-700 dark:text-slate-300")}>
                                        Catálogo Público Ativo
                                    </FormLabel>
                                    <FormDescription className={hasActiveSubscription ? "text-amber-700/70 dark:text-amber-400/70" : "text-slate-500"}>
                                        Permitir que a loja apareça no diretório público de vendedores.
                                    </FormDescription>
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
                                                        className={cn("data-[state=checked]:bg-amber-500")}
                                                    />
                                                </FormControl>
                                            </div>
                                        </TooltipTrigger>
                                        {!hasActiveSubscription && (
                                            <TooltipContent>
                                                <p className="flex items-center gap-2">
                                                    <Lock className="h-4 w-4" /> Assine o plano para habilitar.
                                                </p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                                </FormItem>
                            )}
                            />
                        </div>
                        
                        {!hasActiveSubscription && (
                            <div className="pt-2">
                                <SubscriptionActionCard onCheckout={handleSubscriptionCheckout} isLoading={isCheckoutLoading} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {/* FOOTER ACTIONS */}
            <div className="md:col-span-3 flex items-center justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    size="lg"
                    className="min-w-[200px] shadow-lg shadow-primary/20"
                >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Guardar Configurações
                </Button>
            </div>
            </form>
        </Form>
    </div>
  );
}
