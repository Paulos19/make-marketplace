"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';
import { Headset } from 'lucide-react';

const SupportSection = () => {
  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-slate-950 text-white">
      {/* Fundo Texturizado (Padrão de Grade/Pontos) */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} 
      />
      
      {/* Efeitos de Luz de Fundo (Glow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-zaca-roxo/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto bg-slate-900/40 backdrop-blur-md border border-white/10 p-10 md:p-16 rounded-[3rem] shadow-2xl"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-8 border border-indigo-500/30">
            <Headset className="w-10 h-10 text-indigo-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Precisa de Ajuda?
          </h2>
          
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-medium">
            A nossa equipa de suporte especializada está sempre pronta para ajudar com qualquer dúvida. Uma experiência premium merece um atendimento de excelência.
          </p>
          
          <Button
            asChild
            size="lg"
            className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-7 px-10 rounded-full text-lg shadow-[0_0_40px_-10px_rgba(37,211,102,0.8)] transition-all hover:scale-105 border border-[#25D366]/50"
          >
            <a href="https://wa.me/553197490093" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <FaWhatsapp className="w-7 h-7" />
              Falar no WhatsApp
            </a>
          </Button>

          <p className="mt-6 text-sm text-slate-500 font-medium">
            Tempo médio de resposta: <span className="text-green-400 font-bold">5 minutos</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
