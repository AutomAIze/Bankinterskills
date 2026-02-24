import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Route, ArrowRightLeft, User, GraduationCap, AlertTriangle } from "lucide-react";
import {
  useCareerPaths,
  useTrainingRecommendations,
  useEmployeeSkillGaps,
  useIntegratedTalentRows,
  usePotentialAssessments,
} from "@/hooks/useSkillsData";

const CareerPathsView = () => {
  const { data: paths = [], isLoading } = useCareerPaths();
  const { data: recommendations = [] } = useTrainingRecommendations();
  const { data: gaps = [] } = useEmployeeSkillGaps();
  const { data: rows = [] } = useIntegratedTalentRows();
  const { data: potential = [] } = usePotentialAssessments();

  const latestReadiness = useMemo(() => {
    const map = new Map<string, { readiness: string; potentialScore: number }>();
    const sorted = [...potential].sort((a, b) => b.assessedAt.localeCompare(a.assessedAt));
    for (const p of sorted) {
      if (!map.has(p.employeeId)) {
        map.set(p.employeeId, { readiness: p.readiness, potentialScore: p.potentialScore });
      }
    }
    return map;
  }, [potential]);

  const employeesWithPaths = useMemo(() => {
    return gaps
      .filter((g) => g.matchingPaths.length > 0)
      .map((g) => {
        const row = rows.find((r) => r.employeeId === g.employeeId);
        const readinessInfo = latestReadiness.get(g.employeeId);
        return {
          ...g,
          sustainedPerformance: row?.sustainedPerformanceScore ?? 0,
          readiness: readinessInfo?.readiness ?? "not_ready",
          potentialScore: readinessInfo?.potentialScore ?? 0,
        };
      })
      .sort((a, b) => b.potentialScore - a.potentialScore);
  }, [gaps, rows, latestReadiness]);

  const uniqueGapSkills = useMemo(() => {
    const freq = new Map<string, number>();
    for (const g of gaps) {
      for (const skill of g.allGapSkills) {
        freq.set(skill, (freq.get(skill) ?? 0) + 1);
      }
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [gaps]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const readinessLabel: Record<string, string> = {
    ready_now: "Listo ahora",
    ready_1y: "Listo en 1 año",
    ready_2y: "Listo en 2 años",
    not_ready: "No preparado",
  };

  const readinessColor: Record<string, string> = {
    ready_now: "bg-accent/10 text-accent",
    ready_1y: "bg-primary/10 text-primary",
    ready_2y: "bg-warning/10 text-warning",
    not_ready: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Trayectorias Profesionales</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rutas de crecimiento con readiness, gaps por empleado y sugerencias de desarrollo
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-navy tabular-nums">{paths.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rutas</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-accent tabular-nums">{recommendations.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Recomendaciones</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-primary tabular-nums">{employeesWithPaths.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Personas con ruta</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-warning tabular-nums">{gaps.filter((g) => g.allGapSkills.length > 0).length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Con brechas</p>
          </CardContent>
        </Card>
      </div>

      {uniqueGapSkills.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-bold text-navy">Top brechas de skills organizativas</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Skills más demandadas por trayectorias que los empleados aún necesitan desarrollar
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueGapSkills.map(([skill, count]) => (
                <span key={skill} className="px-2.5 py-1 text-[11px] font-semibold border bg-warning/5 border-warning/20 text-navy">
                  {skill} <span className="text-muted-foreground">({count})</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Mapa de transición</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            De rol origen a rol destino con score mínimo de readiness
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {paths.map((path) => (
            <div key={path.id} className="border p-3 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <p className="text-xs font-bold text-navy">{path.pathCode}</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Readiness mínimo: {Math.round(path.minReadinessScore)}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-foreground/80">{path.fromRole}</span>
                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-navy font-semibold">{path.toRole}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {path.requiredSkills.map((skill) => (
                  <span
                    key={`${path.id}-${skill}`}
                    className="px-2 py-0.5 text-[10px] font-medium border bg-secondary/20"
                  >
                    {skill}
                  </span>
                ))}
                {path.requiredSkills.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">Sin skills obligatorias cargadas</span>
                )}
              </div>
            </div>
          ))}
          {paths.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay trayectorias configuradas todavía.
            </p>
          )}
        </CardContent>
      </Card>

      {employeesWithPaths.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold text-navy">Empleados con trayectorias viables</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Personas con rutas de crecimiento disponibles, readiness actual y skills a desarrollar
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {employeesWithPaths.slice(0, 20).map((emp) => (
              <div key={emp.employeeId} className="border p-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-navy shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy">{emp.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.position ?? "Sin cargo"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold ${readinessColor[emp.readiness] ?? readinessColor.not_ready}`}>
                      {readinessLabel[emp.readiness] ?? emp.readiness}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      Score: {Math.round(emp.potentialScore)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  {emp.matchingPaths.map((mp) => (
                    <div key={mp.pathCode} className="pl-6 flex items-start gap-2">
                      <ArrowRightLeft className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold text-navy">
                          {mp.pathCode}: hacia <span className="text-primary">{mp.toRole}</span>
                        </p>
                        {mp.gapSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mp.gapSkills.map((skill) => (
                              <span key={`${mp.pathCode}-${skill}`} className="px-1.5 py-0.5 text-[10px] font-medium border border-warning/25 bg-warning/5 text-warning">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {employeesWithPaths.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                ...y {employeesWithPaths.length - 20} empleados más con trayectorias viables
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerPathsView;
