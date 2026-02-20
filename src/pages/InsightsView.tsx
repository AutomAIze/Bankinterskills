import { useSearchParams } from 'react-router-dom';
import { useRoles, useCandidatesForRole, useDemoMetrics } from '@/hooks/useSkillsData';
import { PIPELINE_CONFIG, PIPELINE_ORDER } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, PieChart, Pie, Legend,
} from 'recharts';

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-foreground text-xs mb-1">Score {label}</p>
      <p className="text-xs text-muted-foreground">
        Candidatos: <span className="font-bold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-foreground text-xs mb-1">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">
        Candidatos: <span className="font-bold text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
};

const InsightsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const selectedRoleId = searchParams.get('role') || roles[0]?.id || '';
  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const { data: candidates = [], isLoading: candidatesLoading } = useCandidatesForRole(role?.id);
  const { data: metrics, isLoading: metricsLoading } = useDemoMetrics(role?.id);

  const isLoading = rolesLoading || candidatesLoading || metricsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) return null;

  const buckets = [
    { range: '0–20', min: 0, max: 20 },
    { range: '21–40', min: 21, max: 40 },
    { range: '41–60', min: 41, max: 60 },
    { range: '61–80', min: 61, max: 80 },
    { range: '81–100', min: 81, max: 100 },
  ];

  const distributionData = buckets.map((b) => ({
    range: b.range,
    count: candidates.filter((c) => c.combinedScore >= b.min && c.combinedScore <= b.max).length,
  }));

  const getBarColor = (range: string) => {
    if (range === '81–100') return 'hsl(192, 100%, 38%)';
    if (range === '61–80') return 'hsl(218, 100%, 32%)';
    if (range === '41–60') return 'hsl(215, 48%, 52%)';
    if (range === '21–40') return 'hsl(215, 35%, 65%)';
    return 'hsl(5, 58%, 44%)';
  };

  const pipelineData = PIPELINE_ORDER
    .map((stage) => {
      const count = candidates.filter((c) => c.pipelineStage === stage).length;
      const cfg = PIPELINE_CONFIG[stage];
      return { name: cfg.label, value: count, fill: cfg.color };
    })
    .filter((d) => d.value > 0);

  const rejectedCount = candidates.filter((c) => c.pipelineStage === 'rejected').length;
  if (rejectedCount > 0) {
    pipelineData.push({ name: 'Descartado', value: rejectedCount, fill: PIPELINE_CONFIG.rejected.color });
  }

  const validatedCandidates = candidates.filter((c) => c.validatedScore != null);
  const nonValidated = candidates.filter((c) => c.validatedScore == null);
  const avgDeclAll = candidates.length ? Math.round(candidates.reduce((s, c) => s + c.declarativeScore, 0) / candidates.length) : 0;
  const avgValidOnly = validatedCandidates.length ? Math.round(validatedCandidates.reduce((s, c) => s + (c.validatedScore ?? 0), 0) / validatedCandidates.length) : 0;
  const avgCombAll = candidates.length ? Math.round(candidates.reduce((s, c) => s + c.combinedScore, 0) / candidates.length) : 0;
  const avgConfidence = candidates.length ? Math.round(candidates.reduce((s, c) => s + c.confidence, 0) / candidates.length * 100) : 0;

  const hoursSaved = metrics?.hoursSaved ?? 0;
  const precisionGain = metrics?.shortlistPrecisionGain ?? 0;
  const interviewReduction = metrics?.irrelevantInterviewsReduction ?? 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Insights y Eficiencia</h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Métricas operativas, cobertura de validación y distribución del pipeline
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden">
          <div className="h-1 gradient-shine" />
          <CardContent className="p-3 sm:pt-5 sm:pb-5">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy tabular-nums">{hoursSaved}h</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Horas de screening ahorradas</p>
              <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Sobre {candidates.length} candidatos evaluados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardContent className="p-3 sm:pt-5 sm:pb-5">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy tabular-nums">+{precisionGain}%</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Precisión del shortlist</p>
              <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">vs. selección tradicional</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden">
          <div className="h-1 bg-destructive" />
          <CardContent className="p-3 sm:pt-5 sm:pb-5">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-navy tabular-nums">-{interviewReduction}%</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Entrevistas poco relevantes</p>
              <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">Filtrado automático por bajo encaje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{avgDeclAll}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Avg decl.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{avgValidOnly || '—'}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Avg valid.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{avgConfidence}%</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Confianza</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2 sm:pt-4 sm:pb-4">
            <div className="min-w-0">
              <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">
                {candidates.length ? Math.round((validatedCandidates.length / candidates.length) * 100) : 0}%
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Panorama</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300 lg:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-bold text-navy truncate">
              Distribución scores — {role.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} barCategoryGap="20%">
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="4 4" strokeOpacity={0.6} />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Bar dataKey="count" name="Candidatos" radius={0} maxBarSize={48} animationDuration={800} animationEasing="ease-out">
                    {distributionData.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.range)} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--foreground))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="p-3 sm:p-6 pb-2">
            <CardTitle className="text-xs sm:text-sm font-bold text-navy">Pipeline por fases</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))" cornerRadius={0} animationDuration={800} animationEasing="ease-out">
                    {pipelineData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 9, paddingTop: 4 }}
                    iconType="circle"
                    iconSize={7}
                    formatter={(value) => <span className="text-foreground font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{candidates.length}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total candidatos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-3 sm:pt-5 sm:pb-5 sm:px-6">
          <h3 className="text-xs sm:text-sm font-bold text-navy mb-1.5 sm:mb-2">Metodología de scoring probabilístico</h3>
          <p className="text-[11px] sm:text-xs text-foreground/70 leading-relaxed">
            El sistema combina dos fuentes de datos: el <strong>score declarativo</strong> (análisis de CV/LinkedIn por IA,
            ponderación 40%) y el <strong>score validado</strong> (sesiones Panorama con telemetría conductual, ponderación 60%).
            La <strong>confianza</strong> refleja cuántos datos validados existen para cada candidato.
            Candidatos sin validación Panorama conservan únicamente su score declarativo con confianza reducida.
          </p>
          <p className="text-[11px] sm:text-xs text-foreground/70 leading-relaxed mt-2 hidden sm:block">
            Este enfoque dual permite priorizar candidatos con mayor probabilidad real de éxito,
            reducir el sesgo de la información auto-declarada, y concentrar las entrevistas en
            perfiles contrastados científicamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsView;
