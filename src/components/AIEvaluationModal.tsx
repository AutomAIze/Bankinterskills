import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, Send, Loader2 } from 'lucide-react';
import { useSaveAiEvaluation } from '@/hooks/useSkillsData';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
}

const DEFAULT_QUESTIONS = [
  '¿Cómo describes tu capacidad para trabajar en equipo bajo presión?',
  '¿Cuál ha sido una situación en la que tuviste que resolver un conflicto con un compañero?',
  '¿Cómo priorizas tareas cuando tienes múltiples plazos ajustados?',
];

interface AIEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  roleId: string;
  roleName: string;
  onSaved?: () => void;
}

export function AIEvaluationModal({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  roleId,
  roleName,
  onSaved,
}: AIEvaluationModalProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '0',
      role: 'ai',
      content: `Hola. Voy a evaluar las soft skills de ${candidateName} para el puesto de ${roleName}. Responde a las siguientes preguntas como si fueras el candidato.`,
    },
    {
      id: '1',
      role: 'ai',
      content: DEFAULT_QUESTIONS[0],
    },
  ]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const saveMut = useSaveAiEvaluation();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    const nextIdx = questionIndex + 1;
    if (nextIdx < DEFAULT_QUESTIONS.length) {
      setQuestionIndex(nextIdx);
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: 'ai', content: DEFAULT_QUESTIONS[nextIdx] },
        ]);
      }, 500);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const userAnswers = messages.filter((m) => m.role === 'user').map((m) => m.content);
      const summary = `Conversación de evaluación con ${userAnswers.length} respuestas sobre soft skills.`;
      const strengths = userAnswers.length >= 2 ? ['Comunicación clara', 'Experiencia en situaciones de equipo'] : ['Disposición a responder'];
      const weaknesses = userAnswers.length >= 2 ? ['Profundizar en ejemplos concretos'] : [];

      saveMut.mutate(
        {
          candidateId,
          roleId,
          conversationSummary: summary,
          strengths,
          weaknesses,
          adequacyLevel: 'Adecuado',
          adequacyScore: 72,
        },
        {
          onSuccess: () => {
            toast.success('Evaluación IA guardada');
            onSaved?.();
            onOpenChange(false);
          },
          onError: () => toast.error('Error al guardar'),
        }
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze = messages.filter((m) => m.role === 'user').length >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Evaluación IA · {candidateName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Simula una conversación para evaluar soft skills. La IA analizará las respuestas.
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto border border-border/60 bg-muted/20 p-3 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'ai' && (
                <div className="shrink-0 h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 text-[13px] ${
                  m.role === 'ai'
                    ? 'bg-card border border-border/60'
                    : 'bg-primary/10 text-primary-foreground border border-primary/20'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe la respuesta del candidato..."
            className="flex-1 px-3 py-2 text-sm border border-border bg-background"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="default"
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
          >
            {analyzing || saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Analizar y guardar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
