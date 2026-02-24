import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useBonusObjectives } from "@/hooks/useSkillsData";

const STATUS_LABEL: Record<string, string> = {
  on_track: "On track",
  at_risk: "En riesgo",
  completed: "Completado",
  pending: "Pendiente",
};

const ObjectivesBonusView = () => {
  const { data: objectives = [], isLoading } = useBonusObjectives();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const onTrack = objectives.filter((o) => o.status === "on_track" || o.status === "completed");
  const atRisk = objectives.filter((o) => o.status === "at_risk");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Objetivos Importados del Bonus</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Seguimiento de objetivos M50 y activación de acciones por estado
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-navy tabular-nums">{objectives.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-accent tabular-nums">{onTrack.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">On track</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-destructive tabular-nums">{atRisk.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">At risk</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Estado de objetivos</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Consolidación de objetivos importados desde M50 por persona
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[1.2fr_1.4fr_.7fr_.7fr_.7fr] gap-2 px-2 py-1 border-b">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Empleado</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Objetivo</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Peso</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Progreso</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Estado</p>
          </div>
          {objectives.map((objective) => {
            const statusColor =
              objective.status === "completed"
                ? "text-accent"
                : objective.status === "on_track"
                  ? "text-primary"
                  : objective.status === "at_risk"
                    ? "text-destructive"
                    : "text-muted-foreground";
            return (
              <div
                key={objective.id}
                className="grid grid-cols-[1.2fr_1.4fr_.7fr_.7fr_.7fr] gap-2 items-center px-2 py-2 border hover:bg-secondary/20 transition-colors"
              >
                <p className="text-xs font-semibold text-navy truncate">{objective.employeeId}</p>
                <p className="text-[11px] text-foreground truncate">{objective.objectiveName}</p>
                <p className="text-xs text-right tabular-nums text-navy">{objective.weight}%</p>
                <p className="text-xs text-right tabular-nums text-navy">
                  {Math.round(objective.progressValue ?? 0)}%
                </p>
                <p className={`text-[11px] text-right font-semibold ${statusColor}`}>
                  {STATUS_LABEL[objective.status] ?? objective.status}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-navy">Conexión negocio</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta vista enlaza desempeño y resultados de negocio para priorizar acciones de talento.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-bold text-navy">Gestión de riesgo</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Objetivos en riesgo disparan acciones automáticas de seguimiento y desarrollo.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <p className="text-sm font-bold text-navy">Trazabilidad</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cada objetivo conserva ciclo y fuente de importación para auditoría.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObjectivesBonusView;
