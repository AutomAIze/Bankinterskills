import { useMemo } from 'react';
import { useSkillsTaxonomy, useSkillClusters, useSkillSupplyDemand, useEquivalenceGaps } from '@/hooks/useSkillsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';

const CustomBarTooltip = ({ active, payload }: any) => {
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
  const { data: equivGaps = [] } = useEquivalenceGaps();

  const isLoading = taxLoading || clustersLoading || sdLoading;

  const gapAnalysis = useMemo(() => {
    const critical = supplyDemand
      .filter((s) => s.demand > 0 && s.supply < s.demand * 3)
      .sort((a, b) => a.gap - b.gap);

    const surplus = supplyDemand
      .filter((s) => s.supply > s.demand * 5 && s.demand > 0)
      .sort((a, b) => b.gap - a.gap);

    return { critical: critical.slice(0, 8), surplus: surplus.slice(0, 6) };
  }, [supplyDemand]);

  const barData = useMemo(() =>
    [...supplyDemand]
      .filter((s) => s.demand > 0)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 15)
      .map((s) => ({
        ...s,
        shortName: s.skillName.length > 28 ? s.skillName.slice(0, 26) + '…' : s.skillName,
      })),
  [supplyDemand]);

  const emergingCount = taxonomy.filter((s) => s.isEmerging).length;
  const escoCount = taxonomy.filter((s) => s.escoUri).length;

  const equivByRole = useMemo(() => {
    const map = new Map<string, { agente: number; cliente: number; total: number }>();
    for (const g of equivGaps) {
      const entry = map.get(g.roleName) ?? { agente: 0, cliente: 0, total: 0 };
      entry[g.origin]++;
      entry.total++;
      map.set(g.roleName, entry);
    }
    return map;
  }, [equivGaps]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Skills Intelligence</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inventario organizativo · Supply vs. Demand · Gaps y clusters
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{taxonomy.length}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Skills totales</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{escoCount}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">ESCO</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{clusters.length}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Clusters</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric hover:shadow-metric-hover transition-shadow duration-300">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{emergingCount}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Emergentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gaps: Critical + Surplus */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <Card className="lg:col-span-3 shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-bold text-navy">Gaps Críticos</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Skills con mayor brecha entre demanda y disponibilidad
            </p>
          </CardHeader>
          <CardContent>
            {gapAnalysis.critical.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No se detectan gaps críticos</p>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2.5 pb-1.5 border-b">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skill</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-14">Demanda</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-14">Oferta</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right w-16">Cobertura</span>
                </div>
                {gapAnalysis.critical.map((s) => {
                  const ratio = s.demand > 0 ? s.supply / s.demand : 0;
                  const severity = ratio < 2 ? 'critical' : ratio < 4 ? 'moderate' : 'ok';
                  const coveragePct = Math.min(Math.round(ratio * 20), 100);
                  return (
                    <div key={s.skillId} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center border p-2.5 hover:bg-secondary/30 transition-colors duration-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1 h-7 shrink-0 ${
                          severity === 'critical' ? 'bg-destructive' : severity === 'moderate' ? 'bg-warning' : 'bg-accent'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-navy leading-tight" title={s.skillName}>{s.skillName}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{s.category}</p>
                        </div>
                      </div>
                      <div className="w-14 text-right">
                        <p className="text-xs font-bold text-navy tabular-nums">{s.demand}</p>
                        <p className="text-[9px] text-muted-foreground">roles</p>
                      </div>
                      <div className="w-14 text-right">
                        <p className="text-xs font-bold text-navy tabular-nums">{s.supply}</p>
                        <p className="text-[9px] text-muted-foreground">cand.</p>
                      </div>
                      <div className="w-16">
                        <div className="w-full h-1.5 bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${severity === 'critical' ? 'bg-destructive' : severity === 'moderate' ? 'bg-warning' : 'bg-accent'}`}
                            style={{ width: `${coveragePct}%` }}
                          />
                        </div>
                        <p className={`text-[10px] font-semibold tabular-nums text-right mt-0.5 ${
                          severity === 'critical' ? 'text-destructive' : severity === 'moderate' ? 'text-warning' : 'text-accent'
                        }`}>{coveragePct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-bold text-navy">Excedente de talento</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Skills con oferta muy superior a demanda
            </p>
          </CardHeader>
          <CardContent>
            {gapAnalysis.surplus.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No se detectan excedentes significativos</p>
            ) : (
              <div className="space-y-1.5">
                {gapAnalysis.surplus.map((s) => {
                  const ratio = s.demand > 0 ? Math.round(s.supply / s.demand) : 0;
                  return (
                    <div key={s.skillId} className="flex items-center gap-3 border p-2.5 hover:bg-secondary/30 transition-colors duration-200">
                      <div className="w-1 h-7 shrink-0 bg-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy leading-tight" title={s.skillName}>{s.skillName}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{s.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-accent tabular-nums">{ratio}:1</p>
                        <p className="text-[9px] text-muted-foreground">{s.supply}C / {s.demand}R</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar chart — full width */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-navy">Demanda vs. Oferta por Skill</CardTitle>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Top 15 skills más demandadas — roles que las requieren vs. candidatos que las poseen
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ height: Math.max(360, barData.length * 32 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" barGap={2} margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="4 4" strokeOpacity={0.6} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="shortName" width={180}
                  tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  interval={0}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="demand" name="Demanda (roles)" fill="hsl(218, 100%, 32%)" maxBarSize={14} radius={0} animationDuration={800} />
                <Bar dataKey="supply" name="Oferta (candidatos)" fill="hsl(192, 100%, 38%)" maxBarSize={14} radius={0} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Clusters */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Clusters de Skills</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Agrupación funcional de competencias por área — {clusters.length} clusters, {taxonomy.length} skills
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clusters.map((cluster) => {
              const totalCandidates = cluster.skills.reduce((s, sk) => s + sk.candidateCount, 0);
              return (
                <div key={cluster.id} className="border p-3 hover:bg-secondary/20 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: cluster.color }} />
                      <h4 className="text-xs font-bold text-navy">{cluster.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {cluster.skills.length} skills
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {totalCandidates} reg.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cluster.skills.map((sk) => (
                      <span
                        key={sk.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-medium text-foreground/80 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        {sk.name}
                        <span className="text-[10px] text-muted-foreground tabular-nums">({sk.candidateCount})</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Equivalence Gaps */}
      {equivGaps.length > 0 && (
        <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-bold text-navy">Skills sin Equivalencia</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {equivGaps.length} skills sin mapeo entre el modelo Sabadell y ESCO/TKT — {equivGaps.filter(g => g.origin === 'agente').length} del agente, {equivGaps.filter(g => g.origin === 'cliente').length} del cliente
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(equivByRole.entries()).map(([roleName, counts]) => (
                <div key={roleName} className="border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-navy">{roleName}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-primary tabular-nums">{counts.agente} ESCO</span>
                      <span className="text-[10px] font-semibold text-warning tabular-nums">{counts.cliente} Sabadell</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {equivGaps
                      .filter((g) => g.roleName === roleName)
                      .map((g) => (
                        <div
                          key={g.id}
                          className={`flex items-start gap-2 px-2.5 py-1.5 border text-[11px] ${
                            g.origin === 'agente'
                              ? 'bg-primary/[0.03] border-primary/15'
                              : 'bg-warning/[0.03] border-warning/15'
                          }`}
                        >
                          <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                            g.origin === 'agente' ? 'bg-primary' : 'bg-warning'
                          }`} />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground leading-tight">{g.skillName}</p>
                            {g.detail && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{g.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground"><strong className="text-foreground">ESCO/Agente:</strong> Skills detectadas por TKT sin equivalencia en catálogo Sabadell</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span className="text-[10px] text-muted-foreground"><strong className="text-foreground">Cliente:</strong> Skills de Sabadell sin equivalencia en ontología ESCO</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology */}
      <Card className="shadow-card">
        <CardContent className="p-3 sm:pt-5 sm:pb-5 sm:px-6">
          <h3 className="text-xs font-bold text-navy mb-1.5">Metodología de normalización</h3>
          <p className="text-[11px] sm:text-xs text-foreground/70 leading-relaxed">
            El motor de normalización mapea terminología heterogénea (CVs, ofertas de empleo, certificaciones)
            a una ontología unificada basada en la clasificación ESCO v1.2.1, enriquecida con el modelo
            competencial interno de Banco Sabadell. Cada alias se vincula a su skill canónica con un score
            de confianza (0–100%). Las skills adyacentes se calculan mediante co-ocurrencia y similitud semántica.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsIntelligenceView;
