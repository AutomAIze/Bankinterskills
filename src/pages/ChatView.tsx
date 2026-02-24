import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Bot, Loader2, Trash2, ArrowUp, RotateCcw, ExternalLink } from 'lucide-react';
import { generateResponse } from '@/lib/ai-engine';
import type { ResponseMeta } from '@/lib/ai-engine';
import { brandConfig } from '@/config/brand';
import { chatLabels } from '@/config/labels';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  meta?: ResponseMeta;
}

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

const ChatView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const params = useParams();

  const getContext = useCallback(() => ({
    roleId: searchParams.get('role') || undefined,
    candidateId: params.candidateId || undefined,
  }), [searchParams, params]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);


  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: Message = { id: nextId(), role: 'user', content: content.trim(), timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const result = await generateResponse(content.trim(), getContext());
      setMessages([...updated, {
        id: nextId(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        meta: result.meta,
      }]);
    } catch {
      setMessages([
        ...updated,
        { id: nextId(), role: 'assistant', content: 'Lo siento, ha ocurrido un error al consultar los datos. Inténtalo de nuevo.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      setMessages(messages.filter((m) => m.id !== messages[messages.length - 1].id));
      sendMessage(lastUser.content);
    }
  };

  const handleInternalLink = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[data-internal]') as HTMLAnchorElement | null;
    if (anchor) {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (href) navigate(href);
    }
  }, [navigate]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" onClick={handleInternalLink}>
        {isEmpty ? (
          <EmptyState onSend={sendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-0">
            {messages.map((msg, idx) => (
              <MessageBubble key={msg.id} message={msg} isLast={idx === messages.length - 1 && msg.role === 'assistant'} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t bg-card/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {messages.length > 0 && (
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border hover:bg-secondary/50 transition-all active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nueva conversación</span>
                  <span className="sm:hidden">Nueva</span>
                </button>
                {messages.length >= 2 && (
                  <button
                    onClick={retryLast}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border hover:bg-secondary/50 transition-all active:scale-95 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reintentar</span>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {messages.length} mensajes
              </span>
            </div>
          )}

          <div className="relative flex items-end gap-0 border-2 border-border bg-background shadow-sm focus-within:shadow-lg focus-within:border-primary/40 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Busca por posición, skill o consulta..."
              rows={1}
              className="flex-1 resize-none bg-transparent pl-4 sm:pl-5 pr-3 py-3 sm:py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              style={{ maxHeight: '140px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 140) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center m-1.5 sm:m-2 bg-navy text-white disabled:opacity-20 hover:opacity-90 transition-all active:scale-90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-2 tracking-widest uppercase">
            {chatLabels.footerSignature}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty State ──────────────────────────────────────────────────── */

const FEATURE_QUERIES = [
  {
    label: 'Potencial alto',
    query: '¿Qué personas muestran mayor potencial en este colectivo?',
  },
  {
    label: 'Desempeño sostenido',
    query: '¿Qué empleados tienen desempeño sostenido en los últimos ciclos?',
  },
  {
    label: 'Riesgo sucesorio',
    query: '¿Qué puestos críticos tienen riesgo sucesorio alto?',
  },
  {
    label: 'Recomendación formativa',
    query: '¿Qué acciones de formación recomiendas según la última evaluación?',
  },
  {
    label: 'Objetivos bonus',
    query: 'Muéstrame el estado de objetivos importados desde M50.',
  },
  {
    label: 'Trayectorias',
    query: '¿Qué trayectorias profesionales sugeridas hay para este perfil?',
  },
];

function EmptyState({ onSend }: { onSend: (query: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto h-full">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-4 sm:mb-5">
          <img
            src={brandConfig.logoPath}
            alt={brandConfig.logoAlt}
            className="h-7 sm:h-8 w-auto mb-3 mx-auto"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-navy mb-1.5 tracking-tight">
            {chatLabels.emptyStateTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {chatLabels.emptyStateSubtitle}
          </p>
        </div>

        {/* Funcionalidades */}
        <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1.5">
          Funcionalidades
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {FEATURE_QUERIES.map((item, i) => (
            <button
              key={i}
              onClick={() => onSend(item.query)}
              className="group p-2.5 sm:p-3 border border-border/60 bg-card text-left hover:border-primary/30 hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
            >
              <p className="text-[11px] font-bold text-navy mb-0.5 group-hover:text-primary transition-colors leading-tight">
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                {item.query}
              </p>
            </button>
          ))}
        </div>

        {/* Módulos */}
        <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1.5">
          Consultas rápidas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { label: 'Riesgo sucesorio', query: '¿Qué posiciones tienen riesgo sucesorio alto?' },
            { label: 'High potential', query: '¿Quiénes son los empleados de alto potencial?' },
            { label: 'Objetivos en riesgo', query: '¿Qué objetivos de bonus están en riesgo?' },
            { label: 'Brechas de skills', query: '¿Cuáles son las principales brechas de skills organizativas?' },
            { label: 'Acciones pendientes', query: '¿Cuántas acciones de desarrollo están pendientes de ejecución?' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onSend(item.query)}
              className="group p-2.5 sm:p-3 border border-border/60 bg-card text-left hover:border-primary/30 hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]"
            >
              <p className="text-[11px] font-bold text-navy mb-0.5 group-hover:text-primary transition-colors leading-tight">
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                {item.query}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Message Bubble ───────────────────────────────────────────────── */

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`py-5 sm:py-6 ${isUser ? '' : 'bg-secondary/25 -mx-4 sm:-mx-6 px-4 sm:px-6'} ${isLast && !isUser ? 'animate-fadeIn' : ''}`}>
      <div className="flex gap-3.5 sm:gap-4">
        <div className={`shrink-0 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center mt-0.5 shadow-sm ${
          isUser ? 'bg-secondary border border-border' : 'bg-primary'
        }`}>
          {isUser ? (
            <span className="text-[11px] font-bold text-navy">TU</span>
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-bold text-navy">
              {isUser ? 'Tu' : brandConfig.platformName}
            </span>
            <span className="text-[11px] text-muted-foreground/70 tabular-nums">
              {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-[13px] sm:text-sm leading-relaxed text-foreground/85 overflow-x-auto">
            {isUser ? (
              <p className="whitespace-pre-wrap break-words font-medium text-foreground">{message.content}</p>
            ) : (
              <FormattedMarkdown content={message.content} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Typing Indicator ─────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="py-5 sm:py-6 bg-secondary/25 -mx-4 sm:-mx-6 px-4 sm:px-6 animate-fadeIn">
      <div className="flex gap-3.5 sm:gap-4">
        <div className="shrink-0 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center mt-0.5 bg-primary shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-bold text-navy">{brandConfig.platformName}</span>
          </div>
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-primary/50 animate-pulse" />
              <span className="h-2 w-2 bg-primary/50 animate-pulse [animation-delay:200ms]" />
              <span className="h-2 w-2 bg-primary/50 animate-pulse [animation-delay:400ms]" />
            </div>
            <span className="text-xs text-muted-foreground">Consultando base de datos...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Markdown Renderer ────────────────────────────────────────────── */

function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="font-bold text-sm text-navy mt-5 mb-2 tracking-tight">
          {formatInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="font-bold text-base sm:text-lg text-navy mt-5 mb-2 tracking-tight border-b border-border/50 pb-2">
          {formatInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <h4 key={i} className="font-bold text-sm text-navy mt-4 mb-1.5">{formatInline(line)}</h4>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-3 ml-1 my-1">
          <span className="shrink-0 mt-[8px] h-1.5 w-1.5 bg-primary/40" />
          <span className="flex-1">{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-2.5 ml-1 my-1">
            <span className="text-primary/60 shrink-0 text-xs font-bold tabular-nums w-5 text-right">{match[1]}.</span>
            <span className="flex-1">{formatInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      elements.push(<MarkdownTable key={i} lines={tableLines} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2.5" />);
    } else {
      elements.push(<p key={i} className="my-1">{formatInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

/* ─── Inline Formatting (bold, italic, links) ──────────────────────── */

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    if (match[2] && match[3]) {
      const linkText = match[2];
      const href = match[3];
      const isInternal = href.startsWith('/');
      parts.push(
        <a
          key={match.index}
          href={href}
          data-internal={isInternal ? 'true' : undefined}
          target={isInternal ? undefined : '_blank'}
          rel={isInternal ? undefined : 'noopener noreferrer'}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors cursor-pointer"
        >
          {linkText}
          {!isInternal && <ExternalLink className="h-3 w-3 inline" />}
        </a>
      );
    } else if (match[4]) {
      parts.push(<strong key={match.index} className="font-semibold text-navy">{match[4]}</strong>);
    } else if (match[5]) {
      parts.push(<em key={match.index} className="text-muted-foreground not-italic text-xs">{match[5]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/* ─── Markdown Table ───────────────────────────────────────────────── */

function MarkdownTable({ lines }: { lines: string[] }) {
  const parseRow = (line: string) =>
    line.split('|').filter(Boolean).map((c) => c.trim());
  const isSeparator = (line: string) => /^\|[\s\-:|]+\|$/.test(line);

  const headers = parseRow(lines[0]);
  const dataLines = lines.filter((_, i) => i > 0 && !isSeparator(lines[i]));

  return (
    <div className="overflow-x-auto my-4 border border-border/70 shadow-sm">
      <table className="w-full text-xs sm:text-[13px] border-collapse">
        <thead>
          <tr className="bg-navy/[0.05]">
            {headers.map((h, i) => (
              <th key={i} className="border-b-2 border-r last:border-r-0 border-border/50 px-3 sm:px-4 py-2.5 text-left font-bold text-navy whitespace-nowrap uppercase tracking-wider text-[11px]">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, ri) => (
            <tr key={ri} className="hover:bg-primary/[0.03] transition-colors border-b last:border-b-0 border-border/30">
              {parseRow(line).map((cell, ci) => (
                <td key={ci} className="border-r last:border-r-0 border-border/20 px-3 sm:px-4 py-2 text-foreground/80 whitespace-nowrap">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ChatView;
