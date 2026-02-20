import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRoles, useShortlist } from '@/hooks/useSkillsData';
import { getScoreLabel, PIPELINE_CONFIG } from '@/data/mockData';
import type { PipelineStage } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, ArrowRight, Eye,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import type { ShortlistCandidate } from '@/lib/queries';

const RECOMMENDATION_CONFIG = {
  hire: {
    label: 'Recomendado para entrevista',
    icon: null,
    bg: 'bg-accent/[0.04] border-accent/20',
    text: 'text-accent',
    badge: 'bg-accent/10 text-accent border border-accent/20',
  },
  potential: {
    label: 'Con potencial — gaps formables',
    icon: null,
    bg: 'bg-warning/[0.04] border-warning/20',
    text: 'text-warning',
    badge: 'bg-warning/10 text-warning border border-warning/20',
  },
  pass: {
    label: 'Bajo encaje',
    icon: null,
    bg: 'bg-muted/50 border-border',
    text: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground border border-border',
  },
} as const;

const CustomRadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-foreground text-xs mb-1">{payload[0]?.payload?.skill}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  const cfg = PIPELINE_CONFIG[stage];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${cfg.textClass} border ${cfg.borderClass}`}
      style={{ backgroundColor: `${cfg.color}10` }}>
      {cfg.label}
    </span>
  );
}

function DualScoreBadge({ declarative, validated, combined }: { declarative: number; validated: number | null; combined: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-medium">CV</span>
        <span className="text-xs font-bold text-navy tabular-nums">{declarative}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-medium">Pan</span>
        <span className="text-xs font-bold text-navy tabular-nums">{validated ?? '—'}</span>
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? 'bg-score-high' : pct >= 50 ? 'bg-score-medium' : 'bg-score-low';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 sm:w-16 h-1.5 bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function CandidateCard({ candidate, rank, onViewDetail }: { candidate: ShortlistCandidate; rank: number; onViewDetail: () => void }) {
  const rec = RECOMMENDATION_CONFIG[candidate.recommendation];
  const { color } = getScoreLabel(candidate.combinedScore);
  const scoreBg = color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low';

  const radarData = candidate.skills.slice(0, 8).map((s) => ({
    skill: s.name.length > 18 ? s.name.slice(0, 16) + '...' : s.name,
    fullName: s.name,
    Candidato: s.level,
    Rol: s.expected,
  }));

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden">
      <CardHeader className="p-3 sm:p-4 pb-3 border-b bg-secondary/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center text-xs font-extrabold text-white shrink-0 ${rank <= 3 ? 'gradient-shine' : 'bg-muted-foreground'}`}>
              {rank}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-[13px] sm:text-sm font-bold text-navy">{candidate.name}</CardTitle>
              <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                  {candidate.currentPosition || 'Sin puesto actual'}
                </span>
                <StageBadge stage={candidate.pipelineStage} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            <DualScoreBadge declarative={candidate.declarativeScore} validated={candidate.validatedScore} combined={candidate.combinedScore} />
            <span className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-sm font-extrabold text-white ${scoreBg}`}>
              {candidate.combinedScore}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:pt-4 sm:px-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-secondary/20 border px-2 sm:px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confianza</span>
            <ConfidenceBar value={candidate.confidence} />
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold tracking-wide ${rec.badge} self-start sm:self-auto`}>
            {candidate.recommendation === 'hire' ? 'Entrevista' : candidate.recommendation === 'potential' ? 'Potencial' : 'Bajo'}
          </span>
        </div>

        {candidate.notes && (
          <div className="flex items-start gap-2 bg-secondary/30 border p-2 sm:p-2.5">
            <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">{candidate.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Comparativa de Skills</h4>
            </div>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke="hsl(var(--border))" gridType="polygon" strokeOpacity={0.6} />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Candidato" dataKey="Candidato" stroke="hsl(192, 100%, 38%)" fill="hsl(192, 100%, 38%)" fillOpacity={0.2} strokeWidth={2} dot={{ r: 2.5, fill: 'hsl(192, 100%, 38%)', strokeWidth: 0 }} animationDuration={600} />
                  <Radar name="Rol requerido" dataKey="Rol" stroke="hsl(218, 100%, 32%)" fill="hsl(218, 100%, 32%)" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2, fill: 'hsl(218, 100%, 32%)', strokeWidth: 0 }} animationDuration={600} />
                  <Tooltip content={<CustomRadarTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} iconType="circle" iconSize={7} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Detalle por Skill</h4>
            <div className="space-y-1.5">
              {candidate.skills.map((s) => {
                const status = s.gap >= 0 ? 'above' : s.gap >= -10 ? 'aligned' : 'below';
                return (
                  <div key={s.name} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-24 sm:w-40 text-[11px] sm:text-xs font-medium text-foreground leading-tight" title={s.name}>{s.name}</span>
                    <div className="flex-1 h-1.5 bg-muted overflow-hidden relative">
                      <div className={`h-full transition-all duration-500 ${status === 'above' ? 'bg-score-high' : status === 'aligned' ? 'bg-score-medium' : 'bg-score-low'}`} style={{ width: `${s.level}%` }} />
                      <div className="absolute top-0 h-full w-0.5 bg-navy/50" style={{ left: `${s.expected}%` }} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground w-9 sm:w-11 text-right tabular-nums font-semibold">{s.level}/{s.expected}</span>
                    <span className="w-3.5">
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {candidate.strengths.length > 0 && (
            <div className="border border-accent/15 bg-accent/[0.03] p-2 sm:p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Fortalezas</span>
              </div>
              <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">{candidate.strengths.join(', ')}</p>
            </div>
          )}
          {candidate.gaps.length > 0 && (
            <div className="border border-destructive/15 bg-destructive/[0.03] p-2 sm:p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Gaps</span>
              </div>
              <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">{candidate.gaps.join(', ')}</p>
            </div>
          )}
        </div>

        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border p-2 sm:p-3 ${rec.bg}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] sm:text-xs font-semibold ${rec.text}`}>{rec.label}</span>
          </div>
          <button
            onClick={onViewDetail}
            className="flex items-center gap-1.5 bg-navy px-3 py-1.5 text-[10px] font-bold text-white hover:opacity-90 transition-all duration-200 tracking-wide w-full sm:w-auto justify-center sm:justify-start active:scale-[0.98]"
          >
            Ver detalle completo
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

const ShortlistView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const selectedRoleId = searchParams.get('role') || roles[0]?.id || '';
  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const { data: shortlist = [], isLoading: shortlistLoading } = useShortlist(role?.id);

  const isLoading = rolesLoading || shortlistLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return null;

  const hireCount = shortlist.filter((c) => c.recommendation === 'hire').length;
  const potentialCount = shortlist.filter((c) => c.recommendation === 'potential').length;
  const validatedCount = shortlist.filter((c) => c.validatedScore != null).length;
  const avgScore = shortlist.length
    ? Math.round(shortlist.reduce((s, c) => s + c.combinedScore, 0) / shortlist.length)
    : 0;
  const avgConf = shortlist.length
    ? Math.round(shortlist.reduce((s, c) => s + c.confidence, 0) / shortlist.length * 100)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Shortlist</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Candidatos con mayor encaje validado para cada posición
          </p>
        </div>
        <Select value={selectedRoleId} onValueChange={(v) => setSearchParams({ role: v })}>
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
        <div className="grid grid-cols-5 gap-2 sm:gap-3 min-w-[480px] sm:min-w-0">
          <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
            <CardContent className="p-2 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{shortlist.length}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Shortlist</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
            <CardContent className="p-2 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{hireCount}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Entrevista</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
            <CardContent className="p-2 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{validatedCount}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Validados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
            <CardContent className="p-2 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{avgScore}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
            <CardContent className="p-2 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{avgConf}%</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Confianza</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {shortlist.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">No hay candidatos con score suficiente para este rol</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {shortlist.map((candidate, i) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              rank={i + 1}
              onViewDetail={() => navigate(`/candidato/${candidate.id}?role=${candidate.roleId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShortlistView;
