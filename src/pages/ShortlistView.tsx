import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRoles, useShortlist } from '@/hooks/useSkillsData';
import { getScoreLabel, PIPELINE_CONFIG } from '@/data/mockData';
import type { PipelineStage } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowRight } from 'lucide-react';
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

// Fotos corporativas locales: 1,3,4,5 mujeres | 2 = hombre (para Javier)
const CORPORATE_PHOTOS = ['/images/corporate-1.png', '/images/corporate-2.png', '/images/corporate-3.png', '/images/corporate-4.png', '/images/corporate-5.png'];
const PHOTO_MAN = CORPORATE_PHOTOS[1]; // corporate-2
const PHOTOS_OTHERS = [CORPORATE_PHOTOS[0], CORPORATE_PHOTOS[2], CORPORATE_PHOTOS[3], CORPORATE_PHOTOS[4]]; // 1,3,4,5

function getStockPhotoUrl(candidate: { id: string; name: string }, shortlist: { id: string; name: string }[]): string {
  const isJavier = candidate.name.toLowerCase().includes('javier');
  if (isJavier) return PHOTO_MAN;
  const nonJavier = shortlist.filter((c) => !c.name.toLowerCase().includes('javier'));
  const myOrder = nonJavier.findIndex((c) => c.id === candidate.id);
  return PHOTOS_OTHERS[myOrder % PHOTOS_OTHERS.length];
}

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

function CandidateCard({ candidate, rank, shortlist, onViewDetail }: { candidate: ShortlistCandidate; rank: number; shortlist: ShortlistCandidate[]; onViewDetail: () => void }) {
  const rec = RECOMMENDATION_CONFIG[candidate.recommendation];
  const { color } = getScoreLabel(candidate.combinedScore);
  const scoreBg = color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low';
  const confPct = Math.round(candidate.confidence * 100);

  return (
    <Card
      className="shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={onViewDetail}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-background">
              <AvatarImage src={getStockPhotoUrl(candidate, shortlist)} alt={candidate.name} className="object-cover object-[center_20%]" />
              <AvatarFallback className="text-xs font-bold text-muted-foreground">
                {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-extrabold text-white ${rank <= 3 ? 'gradient-shine' : 'bg-muted-foreground'}`}>
              {rank}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-bold text-navy truncate">{candidate.name}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium truncate">
                  {candidate.currentPosition || 'Sin puesto actual'}
                </span>
                <StageBadge stage={candidate.pipelineStage} />
                <span className={`sm:hidden inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide ${rec.badge}`}>
                  {candidate.recommendation === 'hire' ? 'Entrevista' : candidate.recommendation === 'potential' ? 'Potencial' : 'Bajo'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            <DualScoreBadge declarative={candidate.declarativeScore} validated={candidate.validatedScore} combined={candidate.combinedScore} />
            <span className={`inline-flex items-center justify-center w-10 h-10 text-sm font-extrabold text-white shrink-0 ${scoreBg}`}>
              {candidate.combinedScore}
            </span>
            <span className={`hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide shrink-0 ${rec.badge}`}>
              {candidate.recommendation === 'hire' ? 'Entrevista' : candidate.recommendation === 'potential' ? 'Potencial' : 'Bajo'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-10 sm:w-12 h-1.5 bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${confPct >= 75 ? 'bg-score-high' : confPct >= 50 ? 'bg-score-medium' : 'bg-score-low'}`}
                  style={{ width: `${confPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-7 sm:w-8">{confPct}%</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
              className="flex items-center gap-1.5 bg-navy px-3 py-1.5 text-[10px] font-bold text-white hover:opacity-90 transition-all duration-200 tracking-wide shrink-0 group-hover:bg-navy/90 active:scale-[0.98] ml-auto sm:ml-0"
            >
              Ver detalle
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
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
              shortlist={shortlist}
              onViewDetail={() => navigate(`/candidato/${candidate.id}?role=${candidate.roleId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShortlistView;
