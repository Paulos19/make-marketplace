'use client'

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

// Tipagem para o serviço com os dados do profissional e categoria
type ServiceWithDetails = Prisma.ProductGetPayload<{
  include: {
    user: true;
    category: true;
  };
}>;

interface ServiceDetailsClientProps {
  service: ServiceWithDetails;
}

export function ServiceDetailsClient({ service }: ServiceDetailsClientProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Função para abrir o WhatsApp com uma mensagem pré-definida
    const handleContact = () => {
        const professionalName = service.user.storeName || service.user.name || 'o profissional';
        const serviceName = service.name;
        const message = encodeURIComponent(`Olá, ${professionalName}! Vi o seu serviço "${serviceName}" no Zacaplace e gostaria de mais informações.`);
        
        if (service.user.whatsappLink) {
            window.open(`https://wa.me/${service.user.whatsappLink.replace(/\D/g, '')}?text=${message}`, '_blank');
        } else {
            toast.error("O profissional não forneceu um número de WhatsApp para contato.");
        }
    };
    
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Coluna da Esquerda: Galeria de Imagens */}
        <div>
            <Carousel className="w-full rounded-lg overflow-hidden">
                <CarouselContent>
                    {service.images.map((image, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-square relative bg-slate-100 dark:bg-slate-800">
                                <Image
                                    src={image}
                                    alt={`${service.name} - imagem ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-3" />
                <CarouselNext className="absolute right-3" />
            </Carousel>
        </div>

        {/* Coluna da Direita: Detalhes do Serviço */}
        <div className="space-y-6">
            <div>
                <Badge variant="outline" className="mb-2 text-primary border-primary">
                    <Link href={`/categories/${service.category.id}`}>{service.category.name}</Link>
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{service.name}</h1>
            </div>

            <p className="text-3xl font-bold text-primary">{formatCurrency(service.price)}</p>

            <div className="text-slate-600 dark:text-slate-300 prose max-w-none">
                <p>{service.description}</p>
            </div>
            
            <Separator />
            
            {/* Card do Profissional */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">Sobre o Profissional</h3>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={service.user.image || undefined} />
                            <AvatarFallback>{service.user.name?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Link href={`/seller/${service.user.id}`} className="font-bold text-lg hover:underline">{service.user.storeName || service.user.name}</Link>
                            {/* Aqui pode adicionar a média de avaliações se tiver */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão de Ação Principal */}
            <Button size="lg" className="w-full text-lg py-6" onClick={handleContact}>
                <MessageCircle className="mr-2 h-5 w-5" />
                Contactar Profissional
            </Button>
            
        </div>
    </div>
  )
}
