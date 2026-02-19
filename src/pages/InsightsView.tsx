import { useState } from 'react';
import { roles, getCandidatesForRole } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const InsightsView = () => {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0].id);
  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const candidates = getCandidatesForRole(role.id);

  // Distribution histogram
  const buckets = [
    { range: '0–20', min: 0, max: 20 },
    { range: '21–40', min: 21, max: 40 },
    { range: '41–60', min: 41, max: 60 },
    { range: '61–80', min: 61, max: 80 },
    { range: '81–100', min: 81, max: 100 },
  ];

  const distributionData = buckets.map((b) => ({
    range: b.range,
    count: candidates.filter((c) => c.globalScore >= b.min && c.globalScore <= b.max).length,
    fill: b.min >= 80 ? 'hsl(var(--success))' : b.min >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
  }));

  // Simulated KPIs
  const traditionalHours = candidates.length * 0.75; // 45 min per candidate traditional
  const toolHours = candidates.length * 0.1; // 6 min with tool
  const savedHours = Math.round(traditionalHours - toolHours);
  const shortlistTraditional = Math.round(candidates.length * 0.6);
  const shortlistTool = candidates.filter((c) => c.globalScore >= 70).length;
  const precisionIncrease = Math.round(((shortlistTool / Math.max(shortlistTraditional, 1)) - 1) * -100);
  const irrelevantInterviews = Math.round(candidates.filter((c) => c.globalScore < 50).length / candidates.length * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Insights y Ahorro</h2>
          <p className="text-sm text-muted-foreground">Valor económico y operativo del screening basado en skills</p>
        </div>
        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
          <SelectTrigger className="w-72 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card z-50">
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{savedHours}h</p>
                <p className="text-sm text-muted-foreground mt-1">Horas de screening ahorradas</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  vs. {traditionalHours.toFixed(0)}h en proceso tradicional
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Target className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">+{Math.abs(precisionIncrease)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Incremento en precisión del shortlist</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shortlist objetivo: {shortlistTool} vs. {shortlistTraditional} tradicional
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">-{irrelevantInterviews}%</p>
                <p className="text-sm text-muted-foreground mt-1">Reducción de entrevistas poco relevantes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Candidatos con score &lt;50 filtrados automáticamente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Distribución de scores de encaje — {role.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" name="Candidatos" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scientific basis */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-2">Base científica del enfoque</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">
              El sistema de Skills Intelligence se fundamenta en una ontología de skills normalizada (ESCO + modelo interno Banco Sabadell),
              que permite cuantificar objetivamente el encaje entre candidatos y roles. El scoring se calcula mediante ponderación
              de competencias según su relevancia para cada puesto, reduciendo el sesgo subjetivo y convirtiendo las decisiones
              de selección en un proceso más científico, eficiente y auditable.
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed mt-3">
              Este enfoque permite priorizar candidatos con mayor potencial de éxito, identificar gaps formativos antes de
              la incorporación y optimizar el tiempo de los equipos de selección centrando su atención en los perfiles
              con mayor probabilidad de encaje real.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsView;
