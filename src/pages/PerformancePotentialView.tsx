import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Brain, Gauge } from "lucide-react";
import {
  useIntegratedTalentRows,
  usePerformanceEvaluations,
  usePotentialAssessments,
} from "@/hooks/useSkillsData";

function scoreColor(score: number): string {
  if (score >= 80) return "text-accent";
  if (score >= 65) return "text-warning";
  return "text-destructive";
}

const PerformancePotentialView = () => {
  const { data: rows = [], isLoading: rowsLoading } = useIntegratedTalentRows();
  const { data: evaluations = [], isLoading: evalLoading } = usePerformanceEvaluations();
  const { data: potential = [], isLoading: potLoading } = usePotentialAssessments();

  const isLoading = rowsLoading || evalLoading || potLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const highPotentialCount = rows.filter((r) => (r.potentialScore ?? 0) >= 70).length;
  const sustainedCount = rows.filter((r) => r.sustainedPerformanceScore >= 75).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Desempeño y Potencial</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vista integrada de desempeño sostenido y potencial por persona
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-navy tabular-nums">{rows.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Personas
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-accent tabular-nums">{sustainedCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Desempeño sostenido
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-primary tabular-nums">{highPotentialCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              High potential
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-navy tabular-nums">{evaluations.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Evaluaciones
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Matriz de talento</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Combinación de desempeño sostenido y potencial para decisiones de desarrollo
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 px-2 py-1 border-b">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Persona</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Desempeño</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Potencial</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Readiness</p>
          </div>
          {rows.slice(0, 24).map((row) => (
            <div
              key={row.employeeId}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 items-center px-2 py-2 border hover:bg-secondary/20 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-navy truncate">{row.fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {row.position ?? "Sin posición"} · {row.businessUnit ?? "Sin unidad"}
                </p>
              </div>
              <p className={`text-xs font-bold tabular-nums text-right ${scoreColor(row.sustainedPerformanceScore)}`}>
                {Math.round(row.sustainedPerformanceScore)}
              </p>
              <p className={`text-xs font-bold tabular-nums text-right ${scoreColor(row.potentialScore ?? 0)}`}>
                {Math.round(row.potentialScore ?? 0)}
              </p>
              <p className="text-[11px] text-right text-muted-foreground">{row.readiness ?? "—"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <p className="text-sm font-bold text-navy">Lectura de desempeño</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se considera desempeño sostenido cuando la media de ciclos es igual o superior a 75/100.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-navy">Lectura de potencial</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El potencial se consolida desde última evaluación y nivel de readiness para roles críticos.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-warning" />
              <p className="text-sm font-bold text-navy">Uso recomendado</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Úsalo para identificar talento acelerable y priorizar acciones de desarrollo por impacto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformancePotentialView;
