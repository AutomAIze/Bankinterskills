import { useNavigate } from 'react-router-dom';
import { useRolesDashboard } from '@/hooks/useSkillsData';
import { PIPELINE_CONFIG, PIPELINE_ORDER } from '@/data/mockData';
import type { PipelineStage } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, ArrowRight,
} from 'lucide-react';

function ConfidenceBar({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'bg-score-high' : pct >= 50 ? 'bg-score-medium' : 'bg-score-low';
  const h = size === 'md' ? 'h-2' : 'h-1.5';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} bg-muted overflow-hidden`}>
        <div className={`${h} ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

function PipelineBar({ pipeline, total }: { pipeline: Record<string, number>; total: number }) {
  if (total === 0) return <div className="h-3 bg-muted w-full" />;

  const stages = PIPELINE_ORDER.filter((s) => (pipeline[s] ?? 0) > 0);
  const rejected = pipeline['rejected'] ?? 0;

  return (
    <div className="space-y-1.5">
      <div className="flex h-3 overflow-hidden">
        {stages.map((stage, i) => {
          const count = pipeline[stage] ?? 0;
          const pct = (count / total) * 100;
          const cfg = PIPELINE_CONFIG[stage];
          return (
            <div
              key={stage}
              className={`${cfg.bgClass} transition-all relative group`}
              style={{ width: `${pct}%`, minWidth: count > 0 ? '4px' : '0' }}
              title={`${cfg.label}: ${count}`}
            />
          );
        })}
        {rejected > 0 && (
          <div
            className="bg-destructive/40 transition-all"
            style={{ width: `${(rejected / total) * 100}%`, minWidth: '4px' }}
            title={`Descartado: ${rejected}`}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5">
        {stages.map((stage) => {
          const count = pipeline[stage] ?? 0;
          const cfg = PIPELINE_CONFIG[stage];
          return (
            <div key={stage} className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 ${cfg.bgClass}`} />
              <span className="text-[10px] text-muted-foreground">{cfg.shortLabel} <strong className="text-foreground">{count}</strong></span>
            </div>
          );
        })}
        {rejected > 0 && (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 bg-destructive/40" />
            <span className="text-[10px] text-muted-foreground">Desc <strong className="text-foreground">{rejected}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

const RolView = () => {
  const navigate = useNavigate();
  const { data: roles = [], isLoading } = useRolesDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalPositions = roles.reduce((s, r) => s + r.positionsCount, 0);
  const totalCandidates = roles.reduce((s, r) => s + r.totalCandidates, 0);
  const totalValidated = roles.reduce((s, r) => s + r.validatedCount, 0);
  const globalAvgConf = totalCandidates > 0
    ? roles.reduce((s, r) => s + r.avgConfidence * r.totalCandidates, 0) / totalCandidates
    : 0;
  const globalValidatedPct = totalCandidates > 0 ? Math.round((totalValidated / totalCandidates) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Gestión de Posiciones</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          Pipeline de candidatos con scoring dual (declarativo + validación científica)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-navy tabular-nums">{totalPositions}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Posiciones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-navy tabular-nums">{totalCandidates}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Candidatos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-navy tabular-nums">{globalValidatedPct}%</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Validados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-3 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-navy tabular-nums">{Math.round(globalAvgConf * 100)}%</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Confianza</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="shadow-card hover:shadow-card-hover transition-all duration-300 group">
            <CardContent className="p-3 sm:pt-5 sm:pb-5 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="text-[13px] sm:text-sm font-bold text-navy">{role.name}</h3>
                    <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold bg-primary/8 text-primary uppercase tracking-wider">
                      {role.positionsCount} {role.positionsCount === 1 ? 'pos.' : 'pos.'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{role.unit}</p>
                </div>
                <button
                  onClick={() => navigate(`/ranking?role=${role.id}`)}
                  className="shrink-0 flex items-center justify-center gap-1.5 bg-navy px-3 py-1.5 text-[10px] font-bold text-white hover:opacity-90 transition-all duration-200 w-full sm:w-auto sm:ml-3 active:scale-[0.98]"
                >
                  Ver candidatos
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <PipelineBar pipeline={role.pipeline} total={role.totalCandidates} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Candidatos</p>
                  <p className="text-base sm:text-lg font-extrabold text-navy tabular-nums">{role.totalCandidates}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Declarativo</p>
                  <p className="text-base sm:text-lg font-extrabold text-navy tabular-nums">{role.avgDeclarative}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Validado</p>
                  <p className="text-base sm:text-lg font-extrabold text-navy tabular-nums">
                    {role.avgValidated ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Combinado</p>
                  <p className="text-base sm:text-lg font-extrabold text-navy tabular-nums">{role.avgCombined}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Confianza ({role.validatedPercent}% validados)
                </p>
                <ConfidenceBar value={role.avgConfidence} size="md" />
              </div>

              {role.topCandidate && (
                <div className="mt-3 flex items-center gap-2 bg-secondary/30 border px-2 sm:px-3 py-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Top:</span>
                  <span className="text-xs font-semibold text-navy">{role.topCandidate.name}</span>
                  <span className="text-[11px] font-bold text-accent tabular-nums ml-auto">{role.topCandidate.score}/100</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-3 sm:pt-4 sm:pb-4 sm:px-6">
          <h3 className="text-xs font-bold text-navy mb-1.5">Modelo de scoring dual</h3>
          <p className="text-[11px] sm:text-xs text-foreground/70 leading-relaxed">
            El <strong className="text-foreground/75">score declarativo</strong> se obtiene del análisis de CV/LinkedIn mediante IA,
            contrastando skills declaradas vs. requeridas por el rol.
            El <strong className="text-foreground/75">score validado</strong> proviene de sesiones Panorama (telemetría conductual),
            que pondera cualidades blandas y ajusta la evaluación con dato científico.
            El <strong className="text-foreground/75">score combinado</strong> aplica ponderación probabilística
            (40% declarativo + 60% científico) para maximizar la fiabilidad de la decisión.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolView;
