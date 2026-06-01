'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import ImageUpload from '@/app/components/ImageUpload';
import { useSession } from 'next-auth/react';

// ─── Types ───────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isImageRequest?: boolean;
}

// ─── Simple Markdown renderer (links, bold, images, line breaks) ─
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    const imgMatches: { index: number; length: number; alt: string; src: string }[] = [];
    while ((match = imgRegex.exec(line)) !== null) {
      imgMatches.push({ index: match.index, length: match[0].length, alt: match[1], src: match[2] });
    }

    if (imgMatches.length > 0) {
      let cursor = 0;
      imgMatches.forEach((img, i) => {
        if (img.index > cursor) {
          elements.push(<span key={`${lineIdx}-t${i}`}>{renderInlineMarkdown(line.slice(cursor, img.index))}</span>);
        }
        elements.push(
          <img
            key={`${lineIdx}-img${i}`}
            src={img.src}
            alt={img.alt}
            className="rounded-lg max-w-full my-2 border border-slate-200 dark:border-slate-800 shadow-sm"
            style={{ maxHeight: 200 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        );
        cursor = img.index + img.length;
      });
      if (cursor < line.length) {
        elements.push(<span key={`${lineIdx}-tail`}>{renderInlineMarkdown(line.slice(cursor))}</span>);
      }
    } else {
      elements.push(<span key={`${lineIdx}`}>{renderInlineMarkdown(line)}</span>);
    }

    if (lineIdx < lines.length - 1) {
      elements.push(<br key={`br-${lineIdx}`} />);
    }
  });

  return <>{elements}</>;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <a
          key={match.index}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {match[4]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? <>{parts}</> : text;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-primary/70 animate-bounce"
            style={{
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Ana está analisando...</span>
    </div>
  );
}

export default function SellerAgentChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `seller-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  
  // Imagens temporárias durante o request da Ana
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_SELLER_AGENT_WEBHOOK_URL || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingImages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: 'Olá! Sou a **Ana**, sua assistente de catálogo inteligente. Posso listar seus produtos, excluir itens ou te ajudar a **cadastrar novos produtos** rapidinho. O que deseja fazer hoje?',
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [messages.length]);

  const sendMessageToWebhook = async (textToSend: string, hiddenMsg: boolean = false) => {
    if (!WEBHOOK_URL || !session?.user?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          sellerId: session.user.id,
          chatInput: textToSend,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const rawText = await res.text();
      let assistantText = '';

      if (!rawText || rawText.trim() === '') {
        assistantText = 'Desculpe, não consegui processar sua requisição no momento.';
      } else {
        try {
          const data = JSON.parse(rawText);
          assistantText = data?.output || data?.text || data?.response || data?.message || (typeof data === 'string' ? data : JSON.stringify(data));
        } catch {
          assistantText = rawText;
        }
      }

      // Check for special action tags from n8n
      const isImageRequest = assistantText.includes('[ACTION: REQUEST_IMAGE_UPLOAD]');
      
      // Clean up the text for display
      const displayText = assistantText.replace(/\[ACTION: REQUEST_IMAGE_UPLOAD\]/g, '').trim();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: displayText || 'Por favor, envie as fotos do produto abaixo:',
        timestamp: new Date(),
        isImageRequest,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[SellerAgentChat] Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Tivemos um problema ao conectar com a inteligência. Tente novamente.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    
    await sendMessageToWebhook(trimmed);
  }, [input, isLoading, session]);

  const handleSendImages = async () => {
    if (pendingImages.length === 0) return;
    
    // We show a user message indicating images were sent
    const msg: ChatMessage = {
      id: `user-img-${Date.now()}`,
      role: 'user',
      content: `[Imagens enviadas: ${pendingImages.length} foto(s)]\n\n${pendingImages.map(url => `![Imagem](${url})`).join('\n')}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    
    // Send raw URLs to the webhook so the agent can use them
    const textToSend = `[EVENT: IMAGES_UPLOADED]\n${JSON.stringify(pendingImages)}`;
    setPendingImages([]);
    
    await sendMessageToWebhook(textToSend);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm relative">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
            A
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">Agente Ana (Gestão de Catálogo)</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs">Acessando os dados da sua loja...</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, index) => (
          <div key={msg.id} className="space-y-4">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-5 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                }`}
                style={{ wordBreak: 'break-word' }}
              >
                {renderMarkdown(msg.content)}
              </div>
            </div>

            {/* Render Image Upload Widget if this message requested it and it's the last message */}
            {msg.isImageRequest && index === messages.length - 1 && !isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 w-full animate-in fade-in zoom-in-95">
                  <p className="text-sm font-medium mb-4 text-slate-700 dark:text-slate-300">
                    Selecione as fotos do produto para enviar:
                  </p>
                  <ImageUpload 
                    currentFiles={pendingImages} 
                    onUploadComplete={setPendingImages} 
                    maxFiles={5} 
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSendImages}
                      disabled={pendingImages.length === 0}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                      Enviar {pendingImages.length > 0 ? `${pendingImages.length} fotos` : 'Fotos'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: Cadastre uma blusa azul por R$50..."
          disabled={isLoading || messages[messages.length - 1]?.isImageRequest}
          className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || messages[messages.length - 1]?.isImageRequest}
          className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95"
          aria-label="Enviar mensagem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
