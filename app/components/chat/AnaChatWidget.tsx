'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';

// ─── Types ───────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Simple Markdown renderer (links, bold, images, line breaks) ─
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // Images: ![alt](url)
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
            className="rounded-lg max-w-full my-2 border border-white/10"
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
  // Process bold, links
  const parts: React.ReactNode[] = [];
  // Regex: **bold**, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // Bold
      parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
    } else if (match[3]) {
      // Link
      parts.push(
        <a
          key={match.index}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-300 underline underline-offset-2 hover:text-purple-200 transition-colors"
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

// ─── Typing Indicator ────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-purple-400/70"
            style={{
              animation: `ana-bounce 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/40 ml-2">Ana está digitando...</span>
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────
export default function AnaChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || '';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: 'Olá! 👋 Eu sou a **Ana**, sua assistente virtual da Zacaplace! Como posso te ajudar hoje?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !WEBHOOK_URL) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          chatInput: trimmed,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Safe parsing: read as text first, then try JSON
      const rawText = await res.text();
      let assistantText = '';

      if (!rawText || rawText.trim() === '') {
        assistantText = 'Desculpe, não consegui processar sua mensagem. Tente novamente!';
      } else {
        try {
          const data = JSON.parse(rawText);
          // n8n "Respond to Webhook" can return the output in different shapes
          assistantText =
            data?.output ||
            data?.text ||
            data?.response ||
            data?.message ||
            (typeof data === 'string' ? data : JSON.stringify(data));
        } catch {
          // n8n returned plain text (not JSON) — use it directly
          assistantText = rawText;
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AnaChatWidget] Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, tive um probleminha técnico. 😅 Tente novamente em alguns segundos!',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, WEBHOOK_URL, sessionId]);

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes ana-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes ana-fade-in {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ana-pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          id="ana-chat-window"
          className="fixed bottom-24 right-5 z-[9999] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-white/10"
          style={{
            width: 'min(400px, calc(100vw - 2rem))',
            height: 'min(600px, calc(100vh - 8rem))',
            background: 'linear-gradient(145deg, rgba(20,10,40,0.97), rgba(30,15,60,0.95))',
            backdropFilter: 'blur(24px)',
            animation: 'ana-fade-in 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(262 80% 40%), hsl(310 70% 35%))' }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold text-white">
                A
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">Ana do Zaca</p>
              <p className="text-white/50 text-xs">Assistente Virtual • Online</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1"
              aria-label="Fechar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md text-white'
                      : 'rounded-2xl rounded-bl-md text-white/90'
                  }`}
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, hsl(262 80% 50%), hsl(280 70% 45%))'
                        : 'rgba(255,255,255,0.07)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-4 py-3 border-t border-white/10 shrink-0"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 bg-white/10 text-white placeholder-white/30 text-sm rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-purple-500/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsl(262 80% 50%), hsl(310 70% 45%))',
              }}
              aria-label="Enviar mensagem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ─── Floating Action Button ─── */}
      <button
        id="ana-chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[9999] group"
        aria-label={isOpen ? 'Fechar chat da Ana' : 'Abrir chat da Ana'}
      >
        {/* Pulse ring */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(262 80% 50%), hsl(310 70% 45%))',
              animation: 'ana-pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        )}
        <span
          className="relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-active:scale-95"
          style={{
            background: 'linear-gradient(135deg, hsl(262 80% 50%), hsl(310 70% 45%))',
            boxShadow: '0 4px 20px rgba(93, 58, 158, 0.4)',
          }}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </span>
      </button>
    </>
  );
}
