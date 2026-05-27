// app/auth/verify-email/page.tsx
import { Suspense } from 'react'; // << IMPORTAR Suspense
import VerifyEmailClientComponent from './VerifyEmailClientComponent';
import Navbar from '@/app/components/layout/Navbar'; // Opcional, mas bom para consistência
import Footer from '@/app/components/layout/Footer';   // Opcional
import { Loader2 } from 'lucide-react';

// Componente de Fallback para o Suspense
function VerificationLoading() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <Loader2 className="h-16 w-16 text-zaca-azul animate-spin mb-6" />
      <h2 className="text-2xl font-bangers text-slate-700 dark:text-slate-300">
        Carregando informações de verificação...
      </h2>
      <p className="text-slate-500 dark:text-slate-400">Só um instantinho, psit!</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Suspense fallback={<VerificationLoading />}>
          <VerifyEmailClientComponent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}