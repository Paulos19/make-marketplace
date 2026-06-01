import { redirect } from 'next/navigation';
import { checkAgentAccess } from '@/app/actions/checkSubscription';
import SellerAgentChat from './components/SellerAgentChat';
import { BotMessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Agente Ana - Inteligência Artificial | Zacaplace',
  description: 'Gerencie seu catálogo com o poder da Inteligência Artificial.',
};

export default async function SellerAgentPage() {
  const access = await checkAgentAccess();

  if (!access.hasAccess) {
    return (
      <div className="p-8 text-center text-red-500">
        <h1>Acesso Negado</h1>
        <p>Motivo: {access.error || 'Desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1200px] mx-auto w-full">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary text-white shadow-lg p-8 flex flex-col items-start gap-2 border border-white/10">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-80 h-80 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4 mb-2">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
            <BotMessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agente Ana</h1>
            <p className="text-white/80 text-sm">IA Exclusiva para o Meu Catálogo no Zaca</p>
          </div>
        </div>
        
        <p className="text-white/90 max-w-2xl text-sm md:text-base relative z-10 mt-2 leading-relaxed">
          Peça para a Ana listar seus produtos, verificar métricas de desempenho ou **cadastrar novos produtos**. 
          Se ela precisar das fotos, ela pedirá para você enviá-las diretamente aqui pelo chat!
        </p>
      </div>

      {/* CHAT INTERFACE */}
      <div className="w-full">
        <SellerAgentChat />
      </div>
    </div>
  );
}
