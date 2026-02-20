import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ResponseMeta } from '@/lib/ai-engine';
import { Loader2 } from 'lucide-react';

type Decision = 'advance' | 'hold' | 'reject';

interface CandidateDecision {
  decision: Decision;
  note: string;
}

const NEXT_STAGE: Record<string, string> = {
  applied: 'screened',
  screened: 'validated',
  validated: 'shortlisted',
  shortlisted: 'interview',
  interview: 'offer',
  offer: 'hired',
};

const STAGE_LABELS: Record<string, string> = {
  applied: 'Aplicado',
  screened: 'Filtrado',
  validated: 'Validado',
  shortlisted: 'Shortlist',
  interview: 'Entrevista',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Descartado',
};

interface Props {
  meta: ResponseMeta;
  onClose: () => void;
  onSaved: () => void;
}

export default function ValidationPanel({ meta, onClose, onSaved }: Props) {
  const candidates = meta.candidates ?? [];
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>(() => {
    const init: Record<string, CandidateDecision> = {};
    for (const c of candidates) {
      init[c.id] = { decision: 'hold', note: '' };
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], decision } }));
  };

  const setNote = (id: string, note: string) => {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], note } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = candidates
        .filter((c) => decisions[c.id]?.decision !== 'hold')
        .map((c) => {
          const d = decisions[c.id];
          const newStage = d.decision === 'reject' ? 'rejected' : NEXT_STAGE[c.stage] ?? c.stage;
          return supabase
            .from('candidate_roles')
            .update({
              pipeline_stage: newStage,
              ...(d.note ? {} : {}),
            })
            .eq('candidate_id', c.id)
            .eq('role_id', meta.roleId!);
        });

      await Promise.all(updates);

      const notesUpdates = candidates
        .filter((c) => decisions[c.id]?.note.trim())
        .map((c) =>
          supabase
            .from('candidates')
            .update({ notes: decisions[c.id].note.trim() })
            .eq('id', c.id)
        );

      await Promise.all(notesUpdates);
      setSaved(true);
      onSaved();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const changeCount = candidates.filter((c) => decisions[c.id]?.decision !== 'hold').length;

  if (saved) {
    return (
      <div className="border border-border bg-card p-5 mt-4 animate-fadeIn">
        <div className="text-center py-3">
          <p className="text-sm font-semibold text-navy mb-1">Validacion guardada</p>
          <p className="text-xs text-muted-foreground">
            {changeCount} candidato{changeCount !== 1 ? 's' : ''} actualizado{changeCount !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card mt-4 animate-fadeIn">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
        <div>
          <p className="text-xs font-bold text-navy uppercase tracking-wider">Validar resultados</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {meta.roleName} — {candidates.length} candidatos
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Cancelar
        </button>
      </div>

      <div className="divide-y divide-border/50">
        {candidates.map((c) => {
          const d = decisions[c.id];
          return (
            <div key={c.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Score: {c.score} — {STAGE_LABELS[c.stage] ?? c.stage}
                    {d.decision === 'advance' && (
                      <span className="text-accent font-medium ml-1">
                        → {STAGE_LABELS[NEXT_STAGE[c.stage] ?? ''] ?? ''}
                      </span>
                    )}
                    {d.decision === 'reject' && (
                      <span className="text-destructive font-medium ml-1">→ Descartado</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setDecision(c.id, 'advance')}
                    className={`px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      d.decision === 'advance'
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'border-border text-muted-foreground hover:border-accent/30 hover:text-accent'
                    }`}
                  >
                    Avanzar
                  </button>
                  <button
                    onClick={() => setDecision(c.id, 'hold')}
                    className={`px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      d.decision === 'hold'
                        ? 'bg-secondary border-border text-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    Mantener
                  </button>
                  <button
                    onClick={() => setDecision(c.id, 'reject')}
                    className={`px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                      d.decision === 'reject'
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'border-border text-muted-foreground hover:border-destructive/30 hover:text-destructive'
                    }`}
                  >
                    Descartar
                  </button>
                </div>
              </div>
              {d.decision !== 'hold' && (
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={d.note}
                  onChange={(e) => setNote(c.id, e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs border border-border/60 bg-background placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/20">
        <p className="text-[11px] text-muted-foreground">
          {changeCount > 0 ? `${changeCount} cambio${changeCount !== 1 ? 's' : ''} pendiente${changeCount !== 1 ? 's' : ''}` : 'Sin cambios'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || changeCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 disabled:opacity-30 transition-all active:scale-[0.98]"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Confirmar validacion
        </button>
      </div>
    </div>
  );
}
