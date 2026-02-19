import { useMemo } from 'react';
import { useSkillsTaxonomy, useSkillClusters, useSkillSupplyDemand } from '@/hooks/useSkillsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, Brain, Layers, AlertTriangle, TrendingUp, TrendingDown,
  Users, Briefcase, Sparkles, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';

const CustomBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="font-bold text-foreground text-xs mb-1">{d?.skillName}</p>
      <p className="text-xs text-muted-foreground">
        Oferta: <span className="font-bold text-foreground">{d?.supply}</span> candidatos
      </p>
      <p className="text-xs text-muted-foreground">
        Demanda: <span className="font-bold text-foreground">{d?.demand}</span> roles
      </p>
      <p className="text-xs text-muted-foreground">
        Nivel medio: <span className="font-bold text-foreground">{d?.avgLevel}</span>/100
      </p>
    </div>
  );
};

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="font-bold text-foreground text-xs mb-1">{d?.skillName}</p>
      <p className="text-xs text-muted-foreground">
        Demanda: <span className="font-bold text-foreground">{d?.demand}</span> roles
      </p>
      <p className="text-xs text-muted-foreground">
        Oferta: <span className="font-bold text-foreground">{d?.supply}</span> candidatos
      </p>
      <p className="text-xs text-muted-foreground">
        Nivel medio: <span className="font-bold text-foreground">{d?.avgLevel}</span>/100
      </p>
    </div>
  );
};

const SkillsIntelligenceView = () => {
  const { data: taxonomy = [], isLoading: taxLoading } = useSkillsTaxonomy();
  const { data: clusters = [], isLoading: clustersLoading } = useSkillClusters();
  const { data: supplyDemand = [], isLoading: sdLoading } = useSkillSupplyDemand();

  const isLoading = taxLoading || clustersLoading || sdLoading;

  const gapAnalysis = useMemo(() => {
    const critical = supplyDemand
      .filter((s) => s.demand > 0 && s.supply < s.demand * 3)
      .sort((a, b) => a.gap - b.gap);

    const surplus = supplyDemand
      .filter((s) => s.supply > s.demand * 5 && s.demand > 0)
      .sort((a, b) => b.gap - a.gap);

    return { critical: critical.slice(0, 8), surplus: surplus.slice(0, 5) };
  }, [supplyDemand]);

  const scatterData = useMemo(() =>
    supplyDemand
      .filter((s) => s.demand > 0 || s.supply > 0)
      .map((s) => ({ ...s, z: s.avgLevel || 20 })),
  [supplyDemand]);

  const barData = useMemo(() =>
    [...supplyDemand]
      .filter((s) => s.demand > 0)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 12),
  [supplyDemand]);

  const emergingCount = taxonomy.filter((s) => s.isEmerging).length;
  const escoCount = taxonomy.filter((s) => s.source === 'ESCO').length;
  const totalAliases = taxonomy.reduce((sum, s) => sum + s.aliases.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-navy tracking-tight">Skills Intelligence</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inventario organizativo · Supply vs. Demand · Gaps y clusters
        </p>
      </div>

      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-5 gap-2 sm:gap-3 min-w-[400px] sm:min-w-0">
          {[
            { value: taxonomy.length, label: 'Taxonomía', icon: Layers },
            { value: escoCount, label: 'ESCO', icon: BookOpenIcon },
            { value: totalAliases, label: 'Aliases', icon: TagIcon },
            { value: clusters.length, label: 'Clusters', icon: BrainIcon },
            { value: emergingCount, label: 'Emergentes', icon: Sparkles },
          ].map((m) => (
            <Card key={m.label} className="shadow-metric">
              <CardContent className="p-2 sm:pt-3 sm:pb-3">
                <p className="text-base sm:text-xl font-extrabold text-navy tabular-nums">{m.value}</p>
                <p className="text-[7px] sm:text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold text-navy">
                Demanda vs. Oferta por Skill
              </CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Roles que requieren la skill vs. candidatos que la poseen
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" barGap={2}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="skillName" width={130}
                    tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="square" iconSize={8} />
                  <Bar dataKey="demand" name="Demanda (roles)" fill="hsl(218, 100%, 32%)" maxBarSize={14} radius={0} />
                  <Bar dataKey="supply" name="Oferta (candidatos)" fill="hsl(192, 100%, 38%)" maxBarSize={14} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-bold text-navy">
                Mapa Supply–Demand
              </CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Posición de cada skill por oferta (eje X) y demanda (eje Y)
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    type="number" dataKey="supply" name="Oferta"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false}
                    label={{ value: 'Oferta (candidatos)', position: 'insideBottom', offset: -2, style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <YAxis
                    type="number" dataKey="demand" name="Demanda"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={false}
                    label={{ value: 'Demanda (roles)', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <ZAxis type="number" dataKey="z" range={[40, 200]} />
                  <Tooltip content={<CustomScatterTooltip />} />
                  <Scatter data={scatterData} fill="hsl(218, 100%, 32%)" strokeWidth={1} stroke="hsl(218, 100%, 32%)">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={entry.gap < 0 ? 'hsl(5, 58%, 44%)' : 'hsl(192, 100%, 38%)'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-accent" />
                <span className="text-[9px] text-muted-foreground font-medium">Oferta suficiente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-destructive" />
                <span className="text-[9px] text-muted-foreground font-medium">Déficit de oferta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-bold text-navy">
                Gaps Críticos — Reskilling prioritario
              </CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Skills con mayor brecha entre demanda y disponibilidad
            </p>
          </CardHeader>
          <CardContent>
            {gapAnalysis.critical.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No se detectan gaps críticos</p>
            ) : (
              <div className="space-y-2">
                {gapAnalysis.critical.map((s) => {
                  const ratio = s.demand > 0 ? s.supply / s.demand : 0;
                  const severity = ratio < 2 ? 'critical' : ratio < 4 ? 'moderate' : 'ok';
                  return (
                    <div key={s.skillId} className="flex items-center gap-3 border p-2.5">
                      <div className={`w-1 h-8 shrink-0 ${
                        severity === 'critical' ? 'bg-destructive' : severity === 'moderate' ? 'bg-warning' : 'bg-accent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{s.skillName}</p>
                        <p className="text-[10px] text-muted-foreground">{s.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[9px] text-muted-foreground">
                              <Briefcase className="inline h-2.5 w-2.5 mr-0.5" />{s.demand}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-muted-foreground">
                              <Users className="inline h-2.5 w-2.5 mr-0.5" />{s.supply}
                            </p>
                          </div>
                        </div>
                        <div className="w-20 h-1 bg-muted mt-1">
                          <div
                            className={`h-full ${severity === 'critical' ? 'bg-destructive' : 'bg-warning'}`}
                            style={{ width: `${Math.min(ratio * 20, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold text-navy">
                Clusters de Skills
              </CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Agrupación funcional de competencias por área
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clusters.map((cluster) => {
                const totalCandidates = cluster.skills.reduce((s, sk) => s + sk.candidateCount, 0);
                return (
                  <div key={cluster.id} className="border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5" style={{ backgroundColor: cluster.color }} />
                        <h4 className="text-xs font-bold text-navy">{cluster.name}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {cluster.skills.length} skills
                        </span>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {totalCandidates} registros
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cluster.skills.map((sk) => (
                        <span
                          key={sk.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-medium text-foreground/75 bg-secondary/30"
                        >
                          {sk.name}
                          <span className="text-[8px] text-muted-foreground tabular-nums">({sk.candidateCount})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-5 pb-5">
          <div className="max-w-3xl">
            <h3 className="text-sm font-bold text-navy mb-2">Metodología de normalización</h3>
            <p className="text-xs text-foreground/60 leading-relaxed">
              El motor de normalización mapea terminología heterogénea (CVs, ofertas de empleo, certificaciones)
              a una ontología unificada basada en la clasificación ESCO v1.2.1, enriquecida con el modelo
              competencial interno de Banco Sabadell. Cada alias se vincula a su skill canónica con un score
              de confianza (0–100%) que refleja la certeza semántica del mapping. Las skills adyacentes se
              calculan mediante co-ocurrencia en perfiles profesionales y similitud semántica embeddings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function BookOpenIcon(props: any) { return <Layers {...props} />; }
function TagIcon(props: any) { return <TrendingUp {...props} />; }
function BrainIcon(props: any) { return <Brain {...props} />; }

export default SkillsIntelligenceView;
