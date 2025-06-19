"use client"; // <<< ADICIONADO para permitir o uso de hooks

import { useState } from 'react';
import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// A metadata estática pode ser movida para um arquivo layout.tsx nesta rota se necessário,
// mas para simplicidade, a deixamos aqui (será ignorada em Client Components sem exportação 'generateMetadata').
// Para SEO ideal, considere criar um componente cliente para o formulário.

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao enviar a mensagem.');
      }
      
      toast.success("Mensagem enviada!", { description: data.message });
      // Limpa o formulário
      setName('');
      setEmail('');
      setMessage('');

    } catch (err: any) {
      toast.error("Ops, deu xabu!", { description: err.message || 'Não foi possível enviar sua mensagem.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bangers tracking-wider text-zaca-roxo dark:text-zaca-lilas">
              Fale com o Zaca!
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Tem alguma dúvida, sugestão ou só quer mandar um "oi"? Use os canais abaixo!
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Formulário de Contato Funcional */}
            <Card className="shadow-lg dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <MessageSquare className="text-zaca-azul" />
                  Mande uma Mensagem
                </CardTitle>
                <CardDescription>Preencha o formulário e retornaremos o mais rápido possível.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Seu Nome</Label>
                    <Input id="name" type="text" placeholder="Zacarias da Silva" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="email">Seu Email</Label>
                    <Input id="email" type="email" placeholder="zacarias@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="message">Sua Mensagem</Label>
                    <Textarea id="message" placeholder="Escreva sua mensagem aqui..." rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required disabled={isLoading} />
                  </div>
                  <Button type="submit" className="w-full bg-zaca-azul hover:bg-zaca-azul/90 text-white" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Informações de Contato (inalterado) */}
            <div className="space-y-8">
              <Card className="shadow-lg dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Mail className="text-zaca-magenta" />
                    Email de Suporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">
                    Para questões gerais, parcerias ou suporte técnico, envie um e-mail para:
                  </p>
                  <a href="mailto:zacaplaceoficial@gmail.com" className="font-semibold text-zaca-azul hover:underline break-words">
                    zacaplaceoficial@gmail.com
                  </a>
                </CardContent>
              </Card>

              <Card className="shadow-lg dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Phone className="text-zaca-vermelho" />
                        Telefone (WhatsApp)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-600 dark:text-slate-300">
                        Para um contacto mais direto, fale connosco pelo WhatsApp:
                    </p>
                    <a href="https://wa.me/5561986446934" target="_blank" rel="noopener noreferrer" className="font-semibold text-zaca-azul hover:underline">
                        +55 (61) 986446934
                    </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
