import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getScoreLabel, PIPELINE_CONFIG } from '@/data/mockData';
import type { PipelineStage } from '@/data/mockData';
import { useRoles, useCandidateDetail } from '@/hooks/useSkillsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserCheck, FolderOpen, XCircle, CheckCircle, AlertTriangle, MinusCircle, Loader2, TrendingUp, TrendingDown, Gauge, FileCheck, ShieldCheck } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';

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

const CandidateDetailView = () => {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleId = searchParams.get('role') || undefined;

  const { data: roles = [] } = useRoles();
  const { data, isLoading } = useCandidateDetail(candidateId, roleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Candidato no encontrado</p>
      </div>
    );
  }

  const { candidate, role } = data;
  const { label, color } = getScoreLabel(candidate.globalScore);

  const radarData = candidate.skills.map((s) => ({
    skill: s.name,
    Candidato: s.level,
    Rol: s.expected,
  }));

  const strengths = candidate.skills.filter((s) => s.level >= s.expected);
  const gaps = candidate.skills.filter((s) => s.level < s.expected - 10);

  const getRecommendation = () => {
    if (candidate.globalScore >= 80) {
      return {
        text: 'Recomendado para entrevista',
        detail: 'Alto nivel de encaje con las skills requeridas para este rol. Se recomienda avanzar a fase de entrevista.',
        icon: CheckCircle,
        variant: 'text-accent',
        bg: 'border-accent/20 bg-accent/5',
      };
    }
    const gapNames = gaps.map((g) => g.name).join(', ');
    if (candidate.globalScore >= 60) {
      return {
        text: 'Candidato con potencial — gaps identificados',
        detail: `Gaps en: ${gapNames || 'varias competencias'}. Podrían cubrirse con formación específica.`,
        icon: AlertTriangle,
        variant: 'text-warning',
        bg: 'border-warning/20 bg-warning/5',
      };
    }
    return {
      text: 'Bajo encaje para este rol',
      detail: `Las competencias no se alinean suficientemente con el perfil. Gaps: ${gapNames || 'múltiples'}.`,
      icon: MinusCircle,
      variant: 'text-destructive',
      bg: 'border-destructive/20 bg-destructive/5',
    };
  };

  const recommendation = getRecommendation();

  const alternativeRole = roles.find((r) => r.id !== role.id && r.skills.some((rs) =>
    candidate.skills.some((cs) => cs.name === rs.name && cs.level >= rs.weight)
  ));

  return (
    <div className="space-y-4 sm:space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al ranking
      </button>

      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">{candidate.name}</h2>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
            <p className="text-[11px] sm:text-xs text-muted-foreground">{role.name} · {role.unit}</p>
            {(() => { const cfg = PIPELINE_CONFIG[candidate.pipelineStage]; return cfg ? (
              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${cfg.textClass} border ${cfg.borderClass}`} style={{ backgroundColor: `${cfg.color}10` }}>{cfg.label}</span>
            ) : null; })()}
          </div>
        </div>

        {/* Scores row */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground/50 font-medium">CV</span>
              <div className="flex items-center gap-0.5">
                <FileCheck className="h-3 w-3 text-blue-500" />
                <span className="text-sm font-bold text-navy tabular-nums">{candidate.declarativeScore}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-muted-foreground/50 font-medium">Panorama</span>
              <div className="flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3 text-cyan-600" />
                <span className="text-sm font-bold text-navy tabular-nums">{candidate.validatedScore ?? '—'}</span>
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className={`text-[11px] sm:text-xs font-semibold ${
              color === 'high' ? 'score-high' : color === 'medium' ? 'score-medium' : 'score-low'
            }`}>{label}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Conf. {Math.round(candidate.confidence * 100)}%</p>
          </div>
          <span className={`inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 text-base sm:text-lg font-extrabold text-white ${
            color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low'
          }`}>
            {candidate.globalScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Card className="shadow-card">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs sm:text-sm font-bold text-navy">
                  Comparativa: candidato vs. rol
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid
                      stroke="hsl(var(--border))"
                      gridType="polygon"
                    />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                      tickCount={5}
                    />
                    <Radar
                      name="Candidato"
                      dataKey="Candidato"
                      stroke="hsl(192, 100%, 38%)"
                      fill="hsl(192, 100%, 38%)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: 'hsl(192, 100%, 38%)', strokeWidth: 0 }}
                    />
                    <Radar
                      name="Rol requerido"
                      dataKey="Rol"
                      stroke="hsl(218, 100%, 32%)"
                      fill="hsl(218, 100%, 32%)"
                      fillOpacity={0.06}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={{ r: 2, fill: 'hsl(218, 100%, 32%)', strokeWidth: 0 }}
                    />
                    <Tooltip content={<CustomRadarTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      iconType="square"
                      iconSize={7}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Detalle de skills</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-2.5">
                {candidate.skills.map((s) => {
                  const diff = s.level - s.expected;
                  const status = diff >= 0 ? 'above' : diff >= -10 ? 'aligned' : 'below';
                  return (
                    <div key={s.name} className="flex items-center gap-2 sm:gap-3">
                      <span className="w-24 sm:w-36 text-[10px] sm:text-xs font-medium text-foreground truncate">{s.name}</span>
                      <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                        <div className="flex-1 h-1.5 sm:h-2 bg-muted overflow-hidden relative">
                          <div
                            className={`h-full transition-all ${
                              status === 'above' ? 'bg-score-high' : status === 'aligned' ? 'bg-score-medium' : 'bg-score-low'
                            }`}
                            style={{ width: `${s.level}%` }}
                          />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-navy/60"
                            style={{ left: `${s.expected}%` }}
                            title={`Esperado: ${s.expected}`}
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground w-7 sm:w-8 text-right tabular-nums font-semibold">{s.level}</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">/</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground w-7 sm:w-8 tabular-nums">{s.expected}</span>
                      </div>
                      <span className="w-4">
                        {status === 'above' && <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />}
                        {status === 'aligned' && <MinusCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-warning" />}
                        {status === 'below' && <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Card className="shadow-card">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Recomendación del sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3">
              <div className={`flex items-start gap-2 sm:gap-3 border p-3 sm:p-4 ${recommendation.bg}`}>
                <recommendation.icon className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 ${recommendation.variant} shrink-0`} />
                <div>
                  <p className={`font-semibold text-[13px] sm:text-sm ${recommendation.variant}`}>{recommendation.text}</p>
                  <p className="text-[11px] sm:text-xs text-foreground/65 mt-1 leading-relaxed">{recommendation.detail}</p>
                </div>
              </div>

              {strengths.length > 0 && (
                <div className="border border-accent/15 bg-accent/[0.03] p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-wider">Fortalezas</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed">
                    {strengths.map((s) => s.name).join(', ')}
                  </p>
                </div>
              )}

              {gaps.length > 0 && (
                <div className="border border-destructive/15 bg-destructive/[0.03] p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-destructive uppercase tracking-wider">Gaps identificados</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-foreground/70 leading-relaxed">
                    {gaps.map((s) => s.name).join(', ')}
                  </p>
                </div>
              )}

              {alternativeRole && candidate.globalScore < 80 && (
                <div className="border border-primary/15 bg-primary/[0.03] p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs text-foreground/70">
                    <span className="font-semibold text-primary">Sugerencia:</span> Podría encajar mejor en{' '}
                    <span className="font-semibold">{alternativeRole.name}</span>.
                  </p>
                </div>
              )}

              {gaps.length > 0 && (
                <div className="border bg-secondary/40 p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs text-foreground/70">
                    <span className="font-semibold text-navy">Formación sugerida:</span> Los gaps podrían cubrirse con formación en{' '}
                    {gaps.map((s) => s.name).join(', ')}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
              {candidate.validatedScore == null && (
                <button
                  onClick={() => toast.success(`Sesión Panorama solicitada para ${candidate.name}`)}
                  className="w-full flex items-center gap-2 sm:gap-3 border border-cyan-200 bg-cyan-50 p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-cyan-800 hover:bg-cyan-100 transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
                  Solicitar validación Panorama
                </button>
              )}
              <button
                onClick={() => toast.success(`${candidate.name} invitado a entrevista`)}
                className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-accent/5 hover:border-accent/30 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                Invitar a entrevista
              </button>
              <button
                onClick={() => toast.success(`${candidate.name} guardado en pool`)}
                className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                Guardar en pool para otro rol
              </button>
              <button
                onClick={() => toast.success(`${candidate.name} descartado`)}
                className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-destructive/5 hover:border-destructive/30 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                Descartar
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailView;
