import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getScoreLabel, PIPELINE_CONFIG, PIPELINE_ORDER } from '@/data/mockData';
import type { PipelineStage } from '@/data/mockData';
import { useRoles, useCandidateDetail, useAdvanceStage, useRejectCandidate, useRequestValidation, useAiEvaluation, useHrAdequacy } from '@/hooks/useSkillsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SkillCard } from '@/components/SkillCard';
import { AIEvaluationModal } from '@/components/AIEvaluationModal';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, UserCheck, FolderOpen, XCircle, Loader2, ShieldCheck, Bot, Users } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { toast } from 'sonner';

function HrAdequacySlider({
  initialValue,
  onSave,
  isPending,
}: {
  initialValue: number;
  onSave: (pct: number) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);
  return (
    <div className="flex items-center gap-3">
      <Slider
        value={[value]}
        onValueChange={([v]) => setValue(v)}
        onValueCommit={([v]) => onSave(v)}
        max={100}
        step={5}
        className="flex-1"
      />
      <span className="text-sm font-bold tabular-nums w-12">{value}%</span>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

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

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const { data: roles = [] } = useRoles();
  const { data, isLoading } = useCandidateDetail(candidateId, roleId);
  const { data: aiEval } = useAiEvaluation(candidateId, roleId);
  const advanceMut = useAdvanceStage();
  const rejectMut = useRejectCandidate();
  const validationMut = useRequestValidation();
  const hrAdequacyMut = useHrAdequacy();

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
        icon: null,
        variant: 'text-accent',
        bg: 'border-accent/20 bg-accent/5',
      };
    }
    const gapNames = gaps.map((g) => g.name).join(', ');
    if (candidate.globalScore >= 60) {
      return {
        text: 'Candidato con potencial — gaps identificados',
        detail: `Gaps en: ${gapNames || 'varias competencias'}. Podrían cubrirse con formación específica.`,
        icon: null,
        variant: 'text-warning',
        bg: 'border-warning/20 bg-warning/5',
      };
    }
    return {
      text: 'Bajo encaje para este rol',
      detail: `Las competencias no se alinean suficientemente con el perfil. Gaps: ${gapNames || 'múltiples'}.`,
      icon: null,
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
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 font-medium group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Volver al ranking
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">{candidate.name}</h2>
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
            <p className="text-[11px] sm:text-xs text-muted-foreground">{role.name} · {role.unit}</p>
            {(() => { const cfg = PIPELINE_CONFIG[candidate.pipelineStage]; return cfg ? (
              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${cfg.textClass} border ${cfg.borderClass}`} style={{ backgroundColor: `${cfg.color}10` }}>{cfg.label}</span>
            ) : null; })()}
          </div>
        </div>

        {/* Pipeline de fases */}
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 border border-border/60 bg-muted/30">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2">Pipeline</p>
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
            {(['applied', 'screened', 'validated', 'shortlisted', 'interview'] as const).map((stage) => {
              const cfg = PIPELINE_CONFIG[stage];
              const isActive = candidate.pipelineStage === stage;
              const isPast = PIPELINE_ORDER.indexOf(candidate.pipelineStage) > PIPELINE_ORDER.indexOf(stage);
              const isValidationStage = stage === 'validated';
              if (!cfg) return null;
              return (
                <Tooltip key={stage}>
                  <TooltipTrigger asChild>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold border transition-colors ${
                        isActive ? `${cfg.bgClass} ${cfg.textClass} border-current` : isPast ? 'bg-muted text-muted-foreground border-border' : 'bg-background text-muted-foreground/70 border-border'
                      }`}
                    >
                      {isValidationStage && (
                        <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                      {cfg.shortLabel}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-semibold">{cfg.label}</p>
                    {isValidationStage && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Validación por Panorama: evaluación científica de soft skills
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-medium">CV</span>
              <span className="text-sm font-bold text-navy tabular-nums">{candidate.declarativeScore}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center cursor-help">
                  <span className="text-[10px] text-muted-foreground font-medium inline-flex items-center gap-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> Panorama
                  </span>
                  <span className="text-sm font-bold text-navy tabular-nums">{candidate.validatedScore ?? '—'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">Validación Panorama</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evaluación científica de soft skills
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className={`text-[11px] sm:text-xs font-semibold ${
              color === 'high' ? 'score-high' : color === 'medium' ? 'score-medium' : 'score-low'
            }`}>{label}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Conf. {Math.round(candidate.confidence * 100)}%</p>
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
          <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <div className="flex items-center gap-2">
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
                      strokeOpacity={0.6}
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
                      fillOpacity={0.15}
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(192, 100%, 38%)', strokeWidth: 1.5, stroke: 'white' }}
                      animationDuration={600}
                    />
                    <Radar
                      name="Rol requerido"
                      dataKey="Rol"
                      stroke="hsl(218, 100%, 32%)"
                      fill="hsl(218, 100%, 32%)"
                      fillOpacity={0.05}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={{ r: 2, fill: 'hsl(218, 100%, 32%)', strokeWidth: 1, stroke: 'white' }}
                      animationDuration={600}
                    />
                    <RechartsTooltip content={<CustomRadarTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={7}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Detalle de skills</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Las soft skills se destacan; son evaluables por Panorama y futura IA
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {candidate.skills.map((s) => (
                  <SkillCard key={s.name} skill={s} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Recomendación del sistema</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3">
              <div className={`flex items-start gap-2 sm:gap-3 border p-3 sm:p-4 ${recommendation.bg}`}>
                <div>
                  <p className={`font-semibold text-[13px] sm:text-sm ${recommendation.variant}`}>{recommendation.text}</p>
                  <p className="text-[11px] sm:text-xs text-foreground/75 mt-1 leading-relaxed">{recommendation.detail}</p>
                </div>
              </div>

              {strengths.length > 0 && (
                <div className="border border-accent/15 bg-accent/[0.03] p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-accent uppercase tracking-wider">Fortalezas</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">
                    {strengths.map((s) => s.name).join(', ')}
                  </p>
                </div>
              )}

              {gaps.length > 0 && (
                <div className="border border-destructive/15 bg-destructive/[0.03] p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-destructive uppercase tracking-wider">Gaps identificados</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">
                    {gaps.map((s) => s.name).join(', ')}
                  </p>
                </div>
              )}

              {alternativeRole && candidate.globalScore < 80 && (
                <div className="border border-primary/15 bg-primary/[0.03] p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs text-foreground/75">
                    <span className="font-semibold text-primary">Sugerencia:</span> Podría encajar mejor en{' '}
                    <span className="font-semibold">{alternativeRole.name}</span>.
                  </p>
                </div>
              )}

              {gaps.length > 0 && (
                <div className="border bg-secondary/30 p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs text-foreground/75">
                    <span className="font-semibold text-navy">Formación sugerida:</span> Los gaps podrían cubrirse con formación en{' '}
                    {gaps.map((s) => s.name).join(', ')}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluación IA */}
          <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-accent" />
                Evaluación IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3">
              {aiEval ? (
                <>
                  {aiEval.conversationSummary && (
                    <p className="text-[11px] sm:text-xs text-foreground/75 leading-relaxed">
                      {aiEval.conversationSummary}
                    </p>
                  )}
                  {aiEval.strengths?.length > 0 && (
                    <div className="border border-accent/15 bg-accent/[0.03] p-2.5 sm:p-3">
                      <p className="text-[10px] font-bold text-accent mb-1">Puntos fuertes (soft skills)</p>
                      <p className="text-[11px] text-foreground/75">{aiEval.strengths.join(', ')}</p>
                    </div>
                  )}
                  {aiEval.weaknesses?.length > 0 && (
                    <div className="border border-destructive/15 bg-destructive/[0.03] p-2.5 sm:p-3">
                      <p className="text-[10px] font-bold text-destructive mb-1">Puntos débiles</p>
                      <p className="text-[11px] text-foreground/75">{aiEval.weaknesses.join(', ')}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Adecuación:</span>
                    <span className="text-[11px] font-bold text-accent">
                      {aiEval.adequacyLevel ?? '—'} {aiEval.adequacyScore != null && `(${aiEval.adequacyScore}%)`}
                    </span>
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-border/60 p-3 sm:p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Evaluación escrita por IA para valorar soft skills
                  </p>
                  <button
                    onClick={() => setAiModalOpen(true)}
                    className="text-[11px] sm:text-xs font-semibold text-accent hover:underline"
                  >
                    Iniciar evaluación IA
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validación RRHH */}
          {['shortlisted', 'interview', 'offer', 'hired'].includes(candidate.pipelineStage) && (
            <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
              <CardHeader className="p-3 sm:p-6 pb-2">
                <CardTitle className="text-xs sm:text-sm font-bold text-navy flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Validación RRHH
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Control final: adecuación asignada por Recursos Humanos
                </p>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-3">
                <HrAdequacySlider
                  initialValue={candidate.hrAdequacyPercentage ?? 0}
                  onSave={(pct) =>
                    hrAdequacyMut.mutate(
                      { candidateId: candidate.id, roleId: role.id, percentage: pct },
                      { onSuccess: () => toast.success('Adecuación RRHH guardada') }
                    )
                  }
                  isPending={hrAdequacyMut.isPending}
                />
                {(candidate.declarativeScore !== candidate.globalScore || candidate.hrAdequacyPercentage != null) && (
                  <p className="text-[10px] text-muted-foreground">
                    CV: {candidate.declarativeScore} · Combinado: {candidate.globalScore}
                    {candidate.hrAdequacyPercentage != null && ` · RRHH: ${candidate.hrAdequacyPercentage}%`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <CardTitle className="text-xs sm:text-sm font-bold text-navy">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
              {candidate.validatedScore == null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => validationMut.mutate(
                        { candidateId: candidate.id, roleId: role.id },
                        { onSuccess: () => toast.success(`Sesión Panorama solicitada para ${candidate.name}`),
                          onError: () => toast.error(`Error al solicitar validación`) }
                      )}
                      disabled={validationMut.isPending}
                      className="w-full flex items-center gap-2 sm:gap-3 border border-accent/20 bg-accent/5 p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-accent hover:bg-accent/10 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                      {validationMut.isPending ? 'Solicitando...' : 'Solicitar validación Panorama'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p className="font-semibold">Validación Panorama</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      El icono de escudo indica evaluación científica de soft skills mediante Panorama
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {candidate.pipelineStage !== 'interview' && candidate.pipelineStage !== 'rejected' && (
                <button
                  onClick={() => advanceMut.mutate(
                    { candidateId: candidate.id, roleId: role.id, currentStage: candidate.pipelineStage },
                    { onSuccess: () => toast.success(`${candidate.name} avanzado de fase`),
                      onError: () => toast.error(`Error al avanzar fase`) }
                  )}
                  disabled={advanceMut.isPending}
                  className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-accent/5 hover:border-accent/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  {advanceMut.isPending ? 'Avanzando...' : 'Avanzar a siguiente fase'}
                </button>
              )}
              <button
                onClick={() => toast.success(`${candidate.name} guardado en pool`)}
                className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 active:scale-[0.99]"
              >
                <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                Guardar en pool para otro rol
              </button>
              <button
                onClick={() => rejectMut.mutate(
                  { candidateId: candidate.id, roleId: role.id },
                  { onSuccess: () => { toast.success(`${candidate.name} descartado`); navigate(-1); },
                    onError: () => toast.error(`Error al descartar`) }
                )}
                disabled={rejectMut.isPending}
                className="w-full flex items-center gap-2 sm:gap-3 border p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-navy hover:bg-destructive/5 hover:border-destructive/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                {rejectMut.isPending ? 'Descartando...' : 'Descartar'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIEvaluationModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        candidateId={candidate.id}
        candidateName={candidate.name}
        roleId={role.id}
        roleName={role.name}
        onSaved={() => {}}
      />
    </div>
  );
};

export default CandidateDetailView;
