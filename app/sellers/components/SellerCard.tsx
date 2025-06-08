'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User, MessageSquare } from 'lucide-react';

// Tipagem para os dados do vendedor que o card irá receber
interface Seller {
  id: string;
  name: string | null;
  image: string | null;
  storeName: string | null;
  whatsappLink: string | null;
  sellerBannerImageUrl: string | null;
  profileDescription: string | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function SellerCard({ seller }: { seller: Seller }) {
  const displayName = seller.storeName || seller.name || "Vendedor Zaca";
  
  const getAvatarFallback = () => {
    if (!seller.name) return <User className="h-8 w-8"/>;
    return seller.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <motion.div variants={cardVariants} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 transform hover:-translate-y-1.5">
        
        {/* Banner e Avatar */}
        <div className="relative h-36">
          <div className="absolute inset-0 bg-gradient-to-br from-zaca-lilas to-zaca-roxo">
            {seller.sellerBannerImageUrl && (
              <Image
                src={seller.sellerBannerImageUrl}
                alt={`Banner de ${displayName}`}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-md">
              <AvatarImage src={seller.image || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {getAvatarFallback()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <CardContent className="flex-grow flex flex-col items-center text-center p-6 pt-14">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{displayName}</h3>
          {seller.storeName && seller.name && (
              <p className="text-xs text-slate-500 dark:text-slate-400">por {seller.name}</p>
          )}
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 flex-grow">
            {seller.profileDescription || 'Descubra os achadinhos incríveis que este Zaca tem a oferecer!'}
          </p>
        </CardContent>
        
        {/* Botões de Ação */}
        <div className="p-4 border-t dark:border-slate-700/50 mt-auto flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/seller/${seller.id}`}>
              <User className="mr-2 h-4 w-4"/> Ver Perfil
            </Link>
          </Button>
          {seller.whatsappLink && (
            <Button asChild className="w-full bg-purple-700 hover:bg-purple-900 text-white">
              <a href={seller.whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-4 w-4"/> Contatar
              </a>
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
