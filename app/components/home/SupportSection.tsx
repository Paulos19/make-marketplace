
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';

const SupportSection = () => {
  return (
    <div className="relative w-full py-20 overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(45deg, #002244, #004488, #002244)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          ease: 'linear',
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 123, 255, 0.3), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 5,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Precisa de Ajuda?</h2>
        <p className="text-lg mb-8 max-w-2xl">
          Nossa equipe de suporte está pronta para ajudar com qualquer dúvida ou problema que você possa ter. Entre em contato conosco a qualquer momento.
        </p>
        <Button
          asChild
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          <a href="https://wa.me/553197490093" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp className="mr-2" />
            Contatar Suporte
          </a>
        </Button>
      </div>
    </div>
  );
};

export default SupportSection;
