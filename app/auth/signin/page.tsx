// app/auth/signin/page.tsx (ou onde sua página de login estiver)
"use client"; // Pode ser necessário se o Skeleton for um client component complexo

import { Suspense } from 'react';
import Link from 'next/link'; // Usado no skeleton para o logo
import SigninForm from './SigninForm';
// import Image from 'next/image'; // Se for usar no layout ou skeleton

// Componente Skeleton para o fallback do Suspense
const SigninFormSkeleton = () => {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse">
      <div className="text-center lg:text-left">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto lg:mx-0"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mx-auto lg:mx-0 mt-4"></div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-11 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-11 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
        </div>
        <div className="h-12 bg-gray-400 dark:bg-gray-500 rounded w-full"></div>
      </div>
      <div className="relative my-6">
        <div className="h-px bg-gray-300 dark:bg-gray-700"></div>
        <div className="absolute inset-0 flex justify-center -mt-[10px]">
            <span className="bg-white dark:bg-gray-950 px-3 h-5 w-10 rounded-full"></span>
        </div>
      </div>
      <div className="h-12 bg-gray-400 dark:bg-gray-500 rounded w-full"></div>
      <div className="text-center space-y-2 mt-6">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
};


export default function LoginPageContainer() {
  return (
    <section className="bg-white dark:bg-gray-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        {/* Seção da Imagem (Conforme você configurou) */}
        <section className="relative flex h-32 items-end bg-gray-900 lg:col-span-6 lg:h-full xl:col-span-7">
          {/* Usar next/image aqui é altamente recomendado para a imagem principal */}
          <img 
            alt="Painel de maquiagem e produtos de beleza MakeStore"
            src="/signin.jpg" // Certifique-se que esta imagem está em /public/signin.jpg
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="hidden lg:relative lg:block lg:p-12">
            <Link className="block text-white" href="/">
              <span className="sr-only">Home</span>
              {/* Exemplo: Nome da marca sobreposto (estilizar conforme necessário) */}
            </Link>
          </div>
        </section>

        {/* Seção do Formulário de Login com Suspense */}
        <main
          aria-label="Formulário de Login"
          className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-6 lg:px-16 lg:py-12 xl:col-span-5"
        >
          <Suspense fallback={<SigninFormSkeleton />}>
            <SigninForm />
          </Suspense>
        </main>
      </div>
    </section>
  );
}