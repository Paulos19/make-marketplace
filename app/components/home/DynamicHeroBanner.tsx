'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
}

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

export function DynamicHeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const response = await fetch('/api/banners');
        if (!response.ok) throw new Error('Falha ao buscar banners');
        const data = await response.json();
        setBanners(data);
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    }
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  if (isLoading) {
    return <Skeleton className="w-full h-screen" />;
  }

  if (banners.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-zaca-lilas to-zaca-roxo">
        <h1 className="text-5xl font-bangers text-white">Bem-vindo ao Zacaplace!</h1>
      </div>
    );
  }

  const currentBanner = banners[current];

  return (
    <section className="h-screen w-full relative">
      <Carousel setApi={setApi} opts={{ loop: true }} plugins={[Autoplay({ delay: 8000, stopOnInteraction: true })]} className="w-full h-full">
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="w-full h-screen relative">
                <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority={index === 0} />
                <div className="absolute inset-0 bg-black/50" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-6 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex" />
        <CarouselNext className="absolute right-6 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex" />
      </Carousel>
      <div className="absolute inset-0 flex items-center justify-center z-10 text-white text-center p-4">
        <AnimatePresence mode="wait">
          {currentBanner && (
            <motion.div key={currentBanner.id} variants={textVariants} initial="hidden" animate="visible" exit="exit">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bangers tracking-wider drop-shadow-lg">{currentBanner.title}</h2>
              {currentBanner.linkUrl && (
                <Button asChild size="lg" className="mt-6 bg-white text-zaca-roxo hover:bg-slate-200">
                  <Link href={currentBanner.linkUrl}>Ver Oferta <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
