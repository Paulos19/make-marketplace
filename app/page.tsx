"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import { motion, Variants } from 'framer-motion';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton'; 
import Navbar from './components/layout/Navbar'; 
import Footer from './components/layout/Footer'; 
import { ArrowRight, ShoppingCart, Sparkles, Gift, Star, MessageSquare, Zap, Palette, Badge } from 'lucide-react';
import heroBg from './assets/carousel/1.jpg'; 
import collectionImg1 from './assets/carousel/2.jpg'; 
import collectionImg2 from './assets/carousel/3.jpg'; 

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[];
  userId?: string; 
  categories?: { id: string; name: string }[];
  onPromotion?: boolean;
  originalPrice?: number;
}

const LandingProductCard = ({ product, delay = 0 }: { product: Product; delay?: number }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
    }}
    className="h-full"
  >
    <Card className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out h-full flex flex-col dark:bg-gray-800 border dark:border-gray-700/80">
      <Link href={`/products/${product.id}`} className="block absolute inset-0 z-10" aria-label={product.name} />
      <CardHeader className="p-0 border-b dark:border-gray-700/50">
        <div className="aspect-[1/1] w-full relative overflow-hidden"> {}
          <Image
            src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '/img-placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
          />
          {product.onPromotion && (
            <Badge className="absolute top-3 right-3 bg-pink-500 text-white border-pink-500 shadow-md text-xs px-2.5 py-1">OFERTA</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <CardTitle className="text-base sm:text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-2">
          {product.name}
        </CardTitle>
        {}
      </CardContent>
      <CardFooter className="p-4 pt-2 mt-auto bg-gray-50/50 dark:bg-gray-800/30">
         <div className="w-full">
            {product.onPromotion && product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 line-through">
                R$ {product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className={`font-bold text-lg ${product.onPromotion ? 'text-pink-600 dark:text-pink-500' : 'text-gray-900 dark:text-gray-50'}`}>
              R$ {product.price.toFixed(2)}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto text-gray-500 group-hover:text-pink-600 dark:text-gray-400 dark:group-hover:text-pink-400 transition-colors -mr-2 relative z-20">
            <ShoppingCart className="h-5 w-5" />
          </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    }
  },
};

export default function HomePage() {
  const { data: session } = useSession(); 
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products?limit=4&sort=createdAt:desc'); 
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Falha ao buscar produtos em destaque');
        }
        const data = await response.json();
        setFeaturedProducts(Array.isArray(data) ? data : (data.products && Array.isArray(data.products) ? data.products : []));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const valueProps = [
    { icon: Sparkles, title: "Qualidade Premium", description: "Ingredientes selecionados e marcas renomadas para sua total satisfação." },
    { icon: Zap, title: "Tendências Atuais", description: "Fique por dentro das últimas novidades e lançamentos do mundo da beleza." },
    { icon: Palette, title: "Variedade Incrível", description: "Uma vasta gama de cores, texturas e produtos para todos os estilos." },
  ];

  const collections = [
    { name: "Essenciais do Dia a Dia", description: "Tudo o que você precisa para um look impecável e prático.", image: collectionImg1, href: "/products?category=essenciais" },
    { name: "Glamour Noturno", description: "Brilhe em qualquer evento com nossa seleção para festas.", image: collectionImg2, href: "/products?category=festa" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeIn} 
        className="flex-grow"
      >
        {}
        <motion.section className="relative h-[85vh] min-h-[600px] md:h-screen flex items-center justify-center text-white overflow-hidden">
          <Image src={heroBg} alt="MakeStore Hero Banner" fill className="object-cover z-0" priority placeholder="blur" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent z-10"></div>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-20 container mx-auto px-6 text-center space-y-6 max-w-3xl"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight !leading-tight drop-shadow-xl"
            >
              <span className="block">Sua Beleza,</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">Nossa Inspiração.</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-200/90 max-w-xl mx-auto drop-shadow-lg"
            >
              Descubra um universo de cores, texturas e possibilidades. Produtos de alta qualidade para realçar o que há de mais belo em você.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button size="lg" asChild className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-lg font-semibold px-10 py-7 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 ease-in-out group">
                <Link href="/products">
                  Explorar Coleção <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.section>

        {}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          className="py-16 sm:py-20 md:py-24 bg-white dark:bg-slate-800"
        >
          <div className="container mx-auto px-6">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-white">
              Por que escolher a <span className="text-pink-500">MakeStore</span>?
            </motion.h2>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8 sm:gap-10">
              {valueProps.map((prop, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="text-center p-6 sm:p-8 h-full shadow-lg hover:shadow-xl dark:bg-slate-700/50 dark:border-slate-600 transition-all transform hover:-translate-y-1">
                    <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-800/30 dark:to-purple-800/30">
                      <prop.icon className="w-8 h-8 text-pink-500 dark:text-pink-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">{prop.title}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">{prop.description}</CardDescription>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
          className="py-16 sm:py-20 md:py-24"
        >
          <div className="container mx-auto px-6">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-white">
              ✨ Nossas Estrelas ✨
            </motion.h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {[...Array(4)].map((_, i) => ( // Added underscore for unused element
                  <div key={`skeleton-${i}`} className="rounded-xl overflow-hidden shadow-lg dark:bg-gray-800"> {/* Added unique key */}
                    <Skeleton className="w-full aspect-[1/1]" /> <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4 rounded" /><Skeleton className="h-4 w-1/2 rounded" /><Skeleton className="h-8 w-1/3 rounded mt-1" /></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-500">Erro ao carregar produtos: {error}</p>
            ) : featuredProducts.length > 0 ? (
              <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {featuredProducts.map((product, i) => (
                  <LandingProductCard key={product.id} product={product} delay={i * 0.1} />
                ))}
              </motion.div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400">Nenhum produto em destaque no momento.</p>
            )}
            <motion.div variants={fadeInUp} className="text-center mt-12">
              <Button size="lg" asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-10 py-7 rounded-full shadow-xl transform hover:scale-105 transition-all duration-300 group">
                <Link href="/products">
                  Ver Todos os Produtos <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {}
        {collections.map((collection, index) => (
          <motion.section
            key={collection.name}
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            className={`py-16 sm:py-20 md:py-24 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800/50'}`}
          >
            <div className="container mx-auto px-6">
              <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${index % 2 === 0 ? '' : 'md:grid-flow-col-dense'}`}>
                <motion.div variants={fadeInUp} className={`rounded-xl overflow-hidden shadow-2xl aspect-video md:aspect-[5/4] ${index % 2 === 0 ? '' : 'md:col-start-2'}`}>
                  <Image src={collection.image} alt={collection.name} width={700} height={560} className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500" />
                </motion.div>
                <motion.div variants={fadeInUp} className="text-center md:text-left">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-pink-500 mb-4 mx-auto md:mx-0" />
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{collection.name}</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{collection.description}</p>
                  <Button size="lg" asChild className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all group">
                    <Link href={collection.href}>
                      Explorar <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.section>
        ))}
        
        {}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          className="py-16 sm:py-20 md:py-24"
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              O que Nossas Clientes Dizem
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              A satisfação de quem confia na MakeStore é nossa maior recompensa.
            </motion.p>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <motion.div key={i} variants={fadeInUp}>
                  <Card className="p-6 sm:p-8 text-left shadow-lg hover:shadow-xl dark:bg-slate-800 dark:border-slate-700 transition-shadow h-full">
                    <Star className="w-6 h-6 text-yellow-400 mb-3" fill="currentColor" />
                    <p className="italic text-gray-700 dark:text-gray-300 mb-4">"Simplesmente amei! Os produtos são de altíssima qualidade e a entrega foi super rápida. Com certeza comprarei novamente!"</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">- Cliente Satisfeita {i}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          className="py-20 sm:py-24 md:py-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
        >
          <div className="container mx-auto px-6 text-center text-white">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">
              Pronta para Brilhar?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-indigo-100/90 max-w-xl mx-auto mb-10 drop-shadow-md">
              Sua jornada de beleza começa aqui. Explore nossa coleção completa e encontre seus novos favoritos.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button size="lg" asChild className="bg-white text-purple-600 hover:bg-purple-50 text-lg font-bold px-12 py-7 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                <Link href="/products">
                  Ver Todos os Produtos <ShoppingCart className="ml-2.5 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

      </motion.main>

      <Footer />
    </div>
  );
}