import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertTriangle, Users, Target, GraduationCap, Route, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useIntegratedTalentKpis,
  useIntegratedTalentRows,
  usePerformanceEvaluations,
  usePotentialAssessments,
  useBonusObjectives,
  useDevelopmentActions,
  useSuccessionRiskSnapshots,
  useTrainingRecommendations,
  useCareerPaths,
  useEmployeeSkillGaps,
} from "@/hooks/useSkillsData";
import { brandConfig } from "@/config/brand";

function KpiTile({
  value,
  label,
  colorClass = "text-navy",
}: {
  value: string | number;
  label: string;
  colorClass?: string;
}) {
  return (
    <div className="border p-3 bg-secondary/10 hover:bg-secondary/20 transition-colors">
      <p className={`text-2xl font-extrabold tabular-nums ${colorClass}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    </div>
  );
}

function SectionLink({ to, label, count, icon }: { to: string; label: string; count: number; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="border p-3 hover:bg-primary/5 hover:border-primary/30 transition-all group flex items-center justify-between"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
        <span className="text-xs font-bold text-navy group-hover:text-primary transition-colors">{label}</span>
      </div>
      <span className="text-sm font-extrabold text-navy tabular-nums">{count}</span>
    </Link>
  );
}

const TalentDashboardView = () => {
  const { data: kpis, isLoading: kpisLoading } = useIntegratedTalentKpis();
  const { data: rows = [] } = useIntegratedTalentRows();
  const { data: evaluations = [] } = usePerformanceEvaluations();
  const { data: potential = [] } = usePotentialAssessments();
  const { data: objectives = [] } = useBonusObjectives();
  const { data: actions = [] } = useDevelopmentActions();
  const { data: succession = [] } = useSuccessionRiskSnapshots();
  const { data: recommendations = [] } = useTrainingRecommendations();
  const { data: paths = [] } = useCareerPaths();
  const { data: gaps = [] } = useEmployeeSkillGaps();

  const isLoading = kpisLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingActions = actions.filter((a) => a.status !== "completed").length;
  const highRiskSuccession = succession.filter((s) => s.riskLevel === "high").length;
  const atRiskObjectives = objectives.filter((o) => o.status === "at_risk").length;
  const employeesWithGaps = gaps.filter((g) => g.allGapSkills.length > 0).length;

  const topGapSkills = (() => {
    const freq = new Map<string, number>();
    for (const g of gaps) {
      for (const skill of g.allGapSkills) {
        freq.set(skill, (freq.get(skill) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  })();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">
          Cuadro de Mando Integrado de Talento
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {brandConfig.clientName} · Visión 360 de desempeño, potencial, formación, sucesión, objetivos y trayectorias
        </p>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <KpiTile value={kpis.totalEmployees} label="Personas" />
          <KpiTile value={`${kpis.sustainedPerformanceRate}%`} label="Desempeño sostenido" colorClass="text-accent" />
          <KpiTile value={`${kpis.highPotentialRate}%`} label="High potential" colorClass="text-primary" />
          <KpiTile value={kpis.evaluatedEmployees} label="Evaluados" />
          <KpiTile value={`${kpis.bonusObjectivesOnTrackRate}%`} label="Objetivos on track" colorClass="text-accent" />
          <KpiTile value={kpis.successionRiskHighCount} label="Riesgo sucesorio alto" colorClass="text-destructive" />
          <KpiTile value={kpis.developmentActionsPending} label="Acciones pendientes" colorClass="text-warning" />
          <KpiTile value={kpis.trainingRecommendationCount} label="Rec. formación" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-navy">Navegación por área</CardTitle>
            <p className="text-[11px] text-muted-foreground">Acceso directo a cada módulo con datos actuales</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <SectionLink to="/performance-potential" label="Desempeño y Potencial" count={evaluations.length} icon={<TrendingUp className="h-3.5 w-3.5" />} />
            <SectionLink to="/talent-succession" label="Mapa Talento y Sucesión" count={succession.length} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
            <SectionLink to="/objectives-bonus" label="Objetivos Bonus" count={objectives.length} icon={<Target className="h-3.5 w-3.5" />} />
            <SectionLink to="/development-actions" label="Planes de Desarrollo" count={actions.length} icon={<Zap className="h-3.5 w-3.5" />} />
            <SectionLink to="/career-paths" label="Trayectorias Profesionales" count={paths.length} icon={<Route className="h-3.5 w-3.5" />} />
            <SectionLink to="/skills-intelligence" label="Skills Intelligence" count={rows.length} icon={<Users className="h-3.5 w-3.5" />} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-bold text-navy">Alertas operativas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {highRiskSuccession > 0 && (
              <div className="border border-destructive/20 bg-destructive/5 p-3 flex items-center justify-between">
                <span className="text-[11px] text-foreground/80">Posiciones con riesgo sucesorio alto</span>
                <span className="text-sm font-extrabold text-destructive tabular-nums">{highRiskSuccession}</span>
              </div>
            )}
            {atRiskObjectives > 0 && (
              <div className="border border-warning/20 bg-warning/5 p-3 flex items-center justify-between">
                <span className="text-[11px] text-foreground/80">Objetivos bonus en riesgo</span>
                <span className="text-sm font-extrabold text-warning tabular-nums">{atRiskObjectives}</span>
              </div>
            )}
            {pendingActions > 0 && (
              <div className="border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                <span className="text-[11px] text-foreground/80">Acciones de desarrollo pendientes</span>
                <span className="text-sm font-extrabold text-primary tabular-nums">{pendingActions}</span>
              </div>
            )}
            {employeesWithGaps > 0 && (
              <div className="border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                <span className="text-[11px] text-foreground/80">Empleados con brechas de skills</span>
                <span className="text-sm font-extrabold text-primary tabular-nums">{employeesWithGaps}</span>
              </div>
            )}
            {highRiskSuccession === 0 && atRiskObjectives === 0 && pendingActions === 0 && employeesWithGaps === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Sin alertas activas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topGapSkills.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold text-navy">Top brechas de skills</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Skills requeridas por trayectorias que más empleados necesitan desarrollar
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topGapSkills.map(([skill, count]) => (
                <div key={skill} className="border p-2 bg-secondary/10">
                  <p className="text-xs font-bold text-navy truncate" title={skill}>{skill}</p>
                  <p className="text-[10px] text-muted-foreground">{count} empleados</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Cobertura de fuentes de datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{rows.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Empleados</p>
            </div>
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{evaluations.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Evaluaciones</p>
            </div>
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{potential.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Potencial</p>
            </div>
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{objectives.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Objetivos</p>
            </div>
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{recommendations.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Rec. Formación</p>
            </div>
            <div className="border p-2 bg-secondary/10 text-center">
              <p className="text-lg font-extrabold text-navy tabular-nums">{succession.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Riesgo Sucesión</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentDashboardView;
