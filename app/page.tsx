"use client";

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image'; // Mantido para o caso de imagens estáticas em seções futuras
import { motion, Variants } from 'framer-motion';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ArrowRight, ShoppingCart, Sparkles, Gift, Star, Palette, Zap } from 'lucide-react';


import CategoryProductRow from './components/home/CategoryProductRow';
import AchadinhosDoZacaBanner from './components/AchadinhosDoZacaBanner';

// Interfaces (Consistentes com os componentes)
interface UserInfo {
  id: string;
  name?: string | null;
  whatsappLink?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrls: string[];
  user: UserInfo;
  categories?: Category[]; // Importante para o card dentro da CategoryProductRow saber a categoria
  onPromotion?: boolean;
  originalPrice?: number;
}

interface ProductRowData {
  category: Category;
  products: Product[];
}

// Variantes de Animação (pode movê-las para um arquivo utilitário se usadas em mais lugares)
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
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }, // Adicionado delayChildren
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

const NUMBER_OF_PRODUCTS_FOR_BANNER = 5; // 1 principal, 4 para o carrossel secundário do banner
const NUMBER_OF_CATEGORIES_TO_SHOW = 4; // Quantas filas de categorias mostrar
const PRODUCTS_PER_CATEGORY_ROW = 6;    // Quantos produtos por fila de categoria

export default function HomePage() {
  const { data: session } = useSession();
  const [bannerProducts, setBannerProducts] = useState<Product[]>([]);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [categoryRows, setCategoryRows] = useState<ProductRowData[]>([]);
  const [isLoadingCategoryRows, setIsLoadingCategoryRows] = useState(true);
  const [errorCategoryRows, setErrorCategoryRows] = useState<string | null>(null);

  useEffect(() => {
    // Fetch para produtos do banner principal
    const fetchBannerProducts = async () => {
      setIsLoadingBanner(true);
      setErrorBanner(null);
      try {
        const response = await fetch(`/api/products?limit=${NUMBER_OF_PRODUCTS_FOR_BANNER}&sort=createdAt:desc`);
        if (!response.ok) throw new Error('Falha ao buscar Achadinhos do Zaca');
        const data = await response.json();
        const productsData = Array.isArray(data) ? data : (data.products || []);
        setBannerProducts(productsData.filter((p: { user: any; }) => p.user)); // Garante que produtos têm vendedor
      } catch (err) {
        setErrorBanner(err instanceof Error ? err.message : 'Erro ao carregar Achadinhos');
      } finally {
        setIsLoadingBanner(false);
      }
    };

    // Fetch para categorias e seus produtos
    const fetchCategoryProductRows = async () => {
      setIsLoadingCategoryRows(true);
      setErrorCategoryRows(null);
      try {
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) throw new Error('Falha ao buscar categorias');
        const categoriesData: Category[] = await categoriesResponse.json();

        const activeCategories = categoriesData.slice(0, NUMBER_OF_CATEGORIES_TO_SHOW);
        const rowsData: ProductRowData[] = [];

        for (const category of activeCategories) {
          const productsResponse = await fetch(`/api/products?categoryId=${category.id}&limit=${PRODUCTS_PER_CATEGORY_ROW}`);
          if (productsResponse.ok) {
            const productData = await productsResponse.json();
            const categoryProducts = Array.isArray(productData) ? productData : (productData.products || []);
            if (categoryProducts.length > 0) {
              rowsData.push({ category, products: categoryProducts.filter((p: { user: any; }) => p.user) });
            }
          } else {
            console.warn(`Falha ao buscar produtos para a categoria ${category.name}`);
          }
        }
        setCategoryRows(rowsData);
      } catch (err) {
        setErrorCategoryRows(err instanceof Error ? err.message : 'Erro ao carregar filas de produtos');
      } finally {
        setIsLoadingCategoryRows(false);
      }
    };

    fetchBannerProducts();
    fetchCategoryProductRows();
  }, []);

  const valueProps = [
    { icon: Sparkles, title: "Qualidade de Estourar a Boca do Balão!", description: "Ingredientes selecionados e marcas que são um 'Zacapirio' de boas! Ai, pastor!" },
    { icon: Zap, title: "Direto do Forno (da Fama!)", description: "Aqui não tem 'morcegada', só 'Zacarias-novidades' e lançamentos quentinhos!" },
    { icon: Palette, title: "Um Arco-Íris de Opções, Trapalhão!", description: "Cores, texturas e produtos pra todo mundo dar aquela 'zacatraquinada' no visual. Sou Zacarias, carinho, pássaro no ninho!" },
  ];

  const testimonials = [
      { nome: "Maria 'Zacaritástica'", depoimento: "Ai, pastor! Os produtos são um estouro! Chegou tudo direitinho e a qualidade é 'de lascar o cano', Zé! Virei cliente número um!" },
      { nome: "João 'Zacabalau'", depoimento: "'Ô psit!', que maquiagem boa, sô! Minha esposa adorou, agora ela tá 'um nojo' de linda! Vale cada centavo, carinho!" },
      { nome: "Clotilde 'Zacaréia'", depoimento: "Comprei na Zacaplace e 'acertei na mosca, digo, no mosquito!' Atendimento 10 e os preços? Uma pechincha!" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-gray-800 dark:text-gray-100 overflow-x-hidden">
      <Navbar />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex-grow"
      >
        <AchadinhosDoZacaBanner products={bannerProducts} isLoading={isLoadingBanner} />
        {errorBanner && <p className="text-center text-zaca-vermelho py-4">Ai, pastor! Deu chabu pra carregar os achadinhos: {errorBanner}</p>}

        {/* Filas de Produtos por Categoria */}
        {isLoadingCategoryRows && !categoryRows.length && (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="mb-8 animate-pulse">
                        <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-md w-1/3 mb-6"></div>
                        <div className="flex space-x-4 overflow-hidden">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 flex-shrink-0">
                                    <div className="aspect-video bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mt-2 w-3/4"></div>
                                    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded mt-1 w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
        {!isLoadingCategoryRows && errorCategoryRows && (
            <p className="text-center text-zaca-vermelho py-8">Xiii, deu ruim pra buscar as categorias: {errorCategoryRows}</p>
        )}
        {!isLoadingCategoryRows && categoryRows.length > 0 && (
            categoryRows.map((row, index) => (
                <CategoryProductRow
                    key={row.category.id}
                    category={row.category}
                    products={row.products}
                    animationDelay={index * 0.15} // Efeito cascata na animação
                />
            ))
        )}


        {/* Seção "Por que escolher a Zacaplace?" */}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
          className="py-16 sm:py-20 md:py-24 bg-white dark:bg-slate-900" // Alternando fundo
        >
          <div className="container mx-auto px-6">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bangers text-center mb-12 sm:mb-16 text-zaca-roxo dark:text-zaca-lilas">
              Por que a Zacaplace é um Show, Cumpadi?
            </motion.h2>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8 sm:gap-10">
              {valueProps.map((prop, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="text-center p-6 sm:p-8 h-full shadow-xl hover:shadow-2xl bg-zaca-lilas/10 dark:bg-zaca-lilas/5 border-2 border-zaca-lilas/20 hover:border-zaca-magenta transition-all transform hover:-translate-y-1.5 duration-300">
                    <div className="mb-5 inline-flex items-center justify-center p-3.5 rounded-full bg-gradient-to-br from-zaca-magenta/20 to-zaca-roxo/20 dark:from-zaca-magenta/30 dark:to-zaca-roxo/30">
                      <prop.icon className="w-9 h-9 text-zaca-magenta dark:text-zaca-magenta" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100 font-bangers tracking-wide">{prop.title}</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{prop.description}</CardDescription>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
        
        {/* Depoimentos com tom divertido */}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
          className="py-16 sm:py-20 md:py-24 bg-slate-50 dark:bg-slate-800/50" // Alternando fundo
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bangers mb-4 text-slate-900 dark:text-white tracking-wide">
              A Turma do Zaca Aprova e Recomenda!
            </motion.h2>
            <motion.p variants={fadeInUp} transition={{delay:0.1}} className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              Olha só o que a galera anda 'Zacarejando' por aí sobre nossos 'Achadões'!
            </motion.p>
            <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
              {testimonials.map((dep, i) => (
                <motion.div key={i} variants={fadeInUp} transition={{delay: i * 0.1}}>
                  <Card className="p-6 sm:p-8 text-left shadow-xl hover:shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all duration-300 hover:border-zaca-azul transform hover:scale-105 h-full">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-5 h-5 text-yellow-400 dark:text-yellow-500" fill="currentColor" />
                      ))}
                    </div>
                    <blockquote className="italic text-slate-700 dark:text-slate-300 my-4 text-sm sm:text-base">"{dep.depoimento}"</blockquote>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 mt-4">- {dep.nome}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Final com tom divertido */}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}
          className="py-20 sm:py-24 md:py-32 bg-gradient-to-br from-zaca-azul via-zaca-roxo to-zaca-magenta"
        >
          <div className="container mx-auto px-6 text-center text-white">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-bangers mb-6 drop-shadow-lg tracking-wider">
              E aí, Cumpadi? Bora dar um Trato no Visual?
            </motion.h2>
            <motion.p variants={fadeInUp} transition={{delay:0.1}} className="text-lg sm:text-xl text-indigo-100/90 max-w-xl mx-auto mb-10 drop-shadow-md">
              Sua jornada de beleza 'Zacariante' começa aqui. Não é mais nenhum vendedor, é o vendedor número UM do Brasil te esperando! Explore nossos 'Achadões' e encontre seus novos xodós!
            </motion.p>
            <motion.div variants={fadeInUp} transition={{delay:0.2}}>
              <Button size="lg" asChild className="bg-white text-zaca-roxo hover:bg-slate-100 text-lg font-bold px-12 py-3 sm:py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 group">
                <Link href="/products">
                  Ver Todos os Achadinhos <ShoppingCart className="ml-2.5 h-5 w-5 group-hover:animate-bounce" />
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