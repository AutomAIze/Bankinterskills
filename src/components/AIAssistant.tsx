import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Bot, X, Send, Loader2, Trash2 } from 'lucide-react';
import { generateResponse } from '@/lib/ai-engine';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  '¿Quién es el mejor candidato para Gestor Oficina Empresas?',
  'Compara los candidatos para Analista de Riesgo',
  '¿Qué gaps de skills hay en Banca Personal?',
  '¿Cuántas horas ahorra el sistema?',
];

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const response = await generateResponse(content.trim(), getContext());
      setMessages([...updated, { role: 'assistant', content: response }]);
    } catch {
      setMessages([
        ...updated,
        { role: 'assistant', content: 'Lo siento, ha ocurrido un error al consultar los datos. Inténtalo de nuevo.' },
      ]);
    } finally {
      setLoading(false);
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
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center shadow-float transition-all duration-200 ${
          open
            ? 'bg-muted text-foreground'
            : 'gradient-navy text-white hover:opacity-90'
        }`}
        title="Asistente IA"
      >
        {open ? <X className="h-4 w-4" /> : <Bot className="h-4.5 w-4.5" />}
      </button>

      <div
        className={`fixed bottom-22 right-6 z-50 flex flex-col border bg-card shadow-float overflow-hidden transition-all duration-200 origin-bottom-right ${
          open
            ? 'w-[400px] h-[560px] opacity-100 scale-100'
            : 'w-0 h-0 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between bg-navy px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white leading-tight">Skills Intelligence</h3>
            <p className="text-[9px] text-white/50 font-medium">Asistente de selección</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors duration-200"
              title="Limpiar conversación"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <h4 className="text-sm font-bold text-navy mb-1">
                ¿En qué puedo ayudarte?
              </h4>
              <p className="text-[11px] text-muted-foreground mb-4 max-w-[260px]">
                Consulta datos sobre roles, candidatos, skills o métricas.
              </p>
              <div className="space-y-1.5 w-full">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-[11px] border px-3 py-2 text-foreground/75 hover:bg-primary/[0.03] hover:border-primary/20 transition-colors duration-200 font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'gradient-teal text-white'
                    : 'bg-secondary/50 text-foreground border border-border/50'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <FormattedMarkdown content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary/50 border border-border/50 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-primary/50 animate-pulse" />
                  <span className="h-1.5 w-1.5 bg-primary/50 animate-pulse [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 bg-primary/50 animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              className="flex-1 resize-none border bg-secondary/30 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
              style={{ maxHeight: '100px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-[36px] w-[36px] items-center justify-center gradient-teal text-white disabled:opacity-40 hover:opacity-90 transition-all duration-200 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="font-semibold text-[13px] mt-2 mb-1">{formatInline(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="font-semibold text-sm mt-2 mb-1">{formatInline(line.slice(3))}</h3>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-0.5">
          <span className="text-muted-foreground shrink-0 mt-px">-</span>
          <span>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-1.5 ml-0.5">
            <span className="text-muted-foreground shrink-0">{match[1]}.</span>
            <span>{formatInline(match[2])}</span>
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
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="my-0.5">{formatInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index} className="text-muted-foreground">{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const parseRow = (line: string) =>
    line.split('|').filter(Boolean).map((c) => c.trim());
  const isSeparator = (line: string) => /^\|[\s\-:|]+\|$/.test(line);

  const headers = parseRow(lines[0]);
  const dataLines = lines.filter((_, i) => i > 0 && !isSeparator(lines[i]));

  return (
    <div className="overflow-x-auto my-2 -mx-1">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border-b border-border/50 px-1.5 py-1 text-left font-semibold text-foreground/80 whitespace-nowrap">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, ri) => (
            <tr key={ri} className="border-b border-border/20 last:border-0">
              {parseRow(line).map((cell, ci) => (
                <td key={ci} className="px-1.5 py-1 text-foreground/70 whitespace-nowrap">
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

export default AIAssistant;
