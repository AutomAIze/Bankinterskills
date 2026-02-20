import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getScoreLabel, PIPELINE_CONFIG, getPipelineLabel } from '@/data/mockData';
import type { Candidate, PipelineStage } from '@/data/mockData';
import { useRoles, useCandidatesForRole, useAdvanceStage, useRejectCandidate, useRequestValidation } from '@/hooks/useSkillsData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import {
  Eye, X, Loader2, Filter, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const STAGE_TABS: Array<{ key: string; label: string; shortLabel: string }> = [
  { key: 'all', label: 'Todos', shortLabel: 'Todos' },
  { key: 'applied', label: 'Aplicados', shortLabel: 'Aplic.' },
  { key: 'screened', label: 'Filtrados', shortLabel: 'Filtr.' },
  { key: 'validated', label: 'Validados', shortLabel: 'Valid.' },
  { key: 'shortlisted', label: 'Shortlist', shortLabel: 'Short.' },
  { key: 'interview', label: 'Entrevista', shortLabel: 'Entrev.' },
];

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'text-score-high bg-score-high/10' : pct >= 50 ? 'text-score-medium bg-score-medium/10' : 'text-score-low bg-score-low/10';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${color}`}>
      {pct}%
    </span>
  );
}

function ScoreCell({ value, label }: { value: number | null; label: string }) {
  if (value == null) {
    return (
      <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-xs text-muted-foreground/60">—</span>
      </div>
    );
  }
  const { color } = getScoreLabel(value);
  const scoreClass = color === 'high' ? 'text-score-high' : color === 'medium' ? 'text-score-medium' : 'text-score-low';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className={`text-sm font-extrabold tabular-nums ${scoreClass}`}>{value}</span>
    </div>
  );
}

function StageBadge({ stage }: { stage: PipelineStage }) {
  const cfg = PIPELINE_CONFIG[stage];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${cfg.textClass} border ${cfg.borderClass}`}
      style={{ backgroundColor: `${cfg.color}10` }}
    >
      {cfg.label}
    </span>
  );
}

function MobileCard({ candidate, role, navigate, onAction }: { candidate: Candidate; role: any; navigate: any; onAction: (c: Candidate, a: string) => void }) {
  const { color } = getScoreLabel(candidate.combinedScore);
  const scoreBg = color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low';

  return (
    <div className="border bg-card p-3 space-y-2 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-navy">{candidate.name}</p>
          {candidate.skills.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              {candidate.skills.slice(0, 3).map((s) => s.name).join(' · ')}
            </p>
          )}
        </div>
        <span className={`shrink-0 flex h-9 w-9 items-center justify-center text-xs font-extrabold text-white ${scoreBg}`}>
          {candidate.combinedScore}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-navy tabular-nums">{candidate.declarativeScore}</span>
          <span className="text-[10px] text-muted-foreground">CV</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-navy tabular-nums">{candidate.validatedScore ?? '—'}</span>
          <span className="text-[10px] text-muted-foreground">Pan</span>
        </div>
        <ConfidenceBadge value={candidate.confidence} />
        <StageBadge stage={candidate.pipelineStage} />
      </div>

      <div className="flex items-center gap-1 pt-1 border-t">
        <button
          onClick={() => navigate(`/candidato/${candidate.id}?role=${role.id}`)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-primary border hover:bg-primary/5 transition-colors"
        >
          <Eye className="h-3 w-3" /> Ver
        </button>
        {candidate.validatedScore == null && (
          <button
            onClick={() => onAction(candidate, 'validate')}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-accent border hover:bg-accent/5 transition-colors"
          >
            <ShieldCheck className="h-3 w-3" /> Validar
          </button>
        )}
        <button
          onClick={() => onAction(candidate, 'discard')}
          className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-destructive border hover:bg-destructive/5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

const RankingView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [minScore, setMinScore] = useState(0);
  const [stageFilter, setStageFilter] = useState('all');

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const selectedRoleId = searchParams.get('role') || roles[0]?.id || '';
  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const { data: allCandidates = [], isLoading: candidatesLoading } = useCandidatesForRole(role?.id);

  const advanceMut = useAdvanceStage();
  const rejectMut = useRejectCandidate();
  const validationMut = useRequestValidation();

  let candidates = allCandidates;
  if (minScore > 0) candidates = candidates.filter((c) => c.combinedScore >= minScore);
  if (stageFilter !== 'all') candidates = candidates.filter((c) => c.pipelineStage === stageFilter);

  const stageCounts: Record<string, number> = {};
  for (const c of allCandidates) {
    stageCounts[c.pipelineStage] = (stageCounts[c.pipelineStage] ?? 0) + 1;
  }

  const handleAction = (candidate: Candidate, action: string) => {
    if (!role) return;
    if (action === 'recommend') {
      advanceMut.mutate(
        { candidateId: candidate.id, roleId: role.id, currentStage: candidate.pipelineStage },
        { onSuccess: (nextStage) => toast.success(`${candidate.name} avanzado a ${getPipelineLabel(nextStage as PipelineStage)}`),
          onError: () => toast.error(`Error al avanzar a ${candidate.name}`) }
      );
    } else if (action === 'validate') {
      validationMut.mutate(
        { candidateId: candidate.id, roleId: role.id },
        { onSuccess: () => toast.success(`Sesión Panorama solicitada para ${candidate.name}`),
          onError: () => toast.error(`Error al solicitar validación para ${candidate.name}`) }
      );
    } else if (action === 'discard') {
      rejectMut.mutate(
        { candidateId: candidate.id, roleId: role.id },
        { onSuccess: () => toast.success(`${candidate.name} descartado`),
          onError: () => toast.error(`Error al descartar a ${candidate.name}`) }
      );
    }
  };

  if (rolesLoading || candidatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Pipeline de Candidatos</h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Scoring dual: declarativo (CV) + validado (Panorama)
          </p>
        </div>
        <Select value={selectedRoleId} onValueChange={(v) => { setSearchParams({ role: v }); setStageFilter('all'); }}>
          <SelectTrigger className="w-full sm:w-72 bg-card shadow-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card z-50 shadow-float">
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-0.5 bg-card border shadow-card p-1 min-w-max sm:min-w-0">
          {STAGE_TABS.map((tab) => {
            const count = tab.key === 'all' ? allCandidates.length : (stageCounts[tab.key] ?? 0);
            const active = stageFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStageFilter(tab.key)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  active
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`text-[10px] px-1 py-px tabular-nums font-bold rounded ${
                  active ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-3 sm:pt-3 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filtros</span>
            </div>
            <div className="w-full sm:w-56">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Score combinado mín: <span className="text-foreground">{minScore}</span>
              </label>
              <Slider
                value={[minScore]}
                onValueChange={([v]) => setMinScore(v)}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <span className="sm:ml-auto text-xs font-semibold text-navy tabular-nums">
              {candidates.length} <span className="font-normal text-muted-foreground">de {allCandidates.length}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="md:hidden space-y-2">
        {candidates.map((c) => (
          <MobileCard key={c.id} candidate={c} role={role} navigate={navigate} onAction={handleAction} />
        ))}
        {candidates.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground border bg-card">
            No hay candidatos que coincidan con los filtros seleccionados
          </div>
        )}
      </div>

      <div className="hidden md:block bg-card shadow-card border overflow-hidden">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b bg-navy/[0.03]">
              <th className="text-left px-3 lg:px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Candidato</th>
              <th className="text-center px-2 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Declarativo</th>
              <th className="text-center px-2 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Validado</th>
              <th className="text-center px-2 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Combinado</th>
              <th className="text-center px-2 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Confianza</th>
              <th className="text-center px-2 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fase</th>
              <th className="text-right px-3 lg:px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c.id} className={`border-b last:border-0 transition-colors duration-150 hover:bg-primary/[0.02] ${i % 2 === 0 ? '' : 'bg-secondary/15'}`}>
                <td className="px-3 lg:px-4 py-3">
                  <div>
                    <span className="font-semibold text-navy text-[13px]">{c.name}</span>
                    {c.skills.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {c.skills.slice(0, 3).map((s) => s.name).join(' · ')}
                      </p>
                    )}
                  </div>
                </td>
                <td className="text-center px-2 py-3">
                  <ScoreCell value={c.declarativeScore} label="CV" />
                </td>
                <td className="text-center px-2 py-3">
                  <ScoreCell value={c.validatedScore} label="Panorama" />
                </td>
                <td className="text-center px-2 py-3">
                  <ScoreCell value={c.combinedScore} label="Final" />
                </td>
                <td className="text-center px-2 py-3">
                  <ConfidenceBadge value={c.confidence} />
                </td>
                <td className="text-center px-2 py-3">
                  <StageBadge stage={c.pipelineStage} />
                </td>
                <td className="text-right px-3 lg:px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => navigate(`/candidato/${c.id}?role=${role.id}`)}
                      className="p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {c.validatedScore == null && (
                      <button
                        onClick={() => handleAction(c, 'validate')}
                        className="p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        title="Solicitar validación Panorama"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {c.pipelineStage !== 'interview' && c.pipelineStage !== 'rejected' && (
                      <button
                        onClick={() => handleAction(c, 'recommend')}
                        className="p-1.5 text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                        title="Avanzar fase"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(c, 'discard')}
                      className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Descartar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-xs text-muted-foreground">
                  No hay candidatos que coincidan con los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground"><strong className="text-foreground">Declarativo:</strong> Score basado en CV/LinkedIn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground"><strong className="text-foreground">Validado:</strong> Score de sesión Panorama</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground"><strong className="text-foreground">Combinado:</strong> 40% decl. + 60% científico</span>
        </div>
      </div>
    </div>
  );
};

export default RankingView;
