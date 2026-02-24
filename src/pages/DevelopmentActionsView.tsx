import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle2, Clock3 } from "lucide-react";
import {
  useDevelopmentActions,
  useRunHrAutomations,
  useUpdateDevelopmentActionStatus,
} from "@/hooks/useSkillsData";
import { toast } from "sonner";

const DevelopmentActionsView = () => {
  const { data: actions = [], isLoading, refetch } = useDevelopmentActions();
  const runAutomations = useRunHrAutomations();
  const updateStatus = useUpdateDevelopmentActionStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pending = actions.filter((a) => a.status === "pending").length;
  const inProgress = actions.filter((a) => a.status === "in_progress").length;
  const completed = actions.filter((a) => a.status === "completed").length;

  const executeAutomations = async () => {
    try {
      const result = await runAutomations.mutateAsync();
      toast.success(
        `Automatizaciones ejecutadas: ${result.generatedActions} acciones + ${result.syncedRecommendations} recomendaciones`,
      );
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al ejecutar automatizaciones";
      toast.error(message);
    }
  };

  const setStatus = async (id: string, status: "pending" | "in_progress" | "completed") => {
    try {
      await updateStatus.mutateAsync({ actionId: id, status });
      toast.success("Estado de acción actualizado");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la acción";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Planes y Acciones de Desarrollo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ejecución automática de acciones derivadas de evaluaciones, objetivos y sucesión
          </p>
        </div>
        <button
          onClick={executeAutomations}
          disabled={runAutomations.isPending}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {runAutomations.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          Ejecutar automatizaciones
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-warning tabular-nums">{pending}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-primary tabular-nums">{inProgress}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">En curso</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-accent tabular-nums">{completed}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Completadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Backlog de acciones</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Priorización por impacto y riesgo
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.map((action) => (
            <div key={action.id} className="border p-3 hover:bg-secondary/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {action.reason}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {action.actionType} · {action.priority} · {action.source}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setStatus(action.id, "pending")}
                    className={`px-2 py-1 text-[10px] font-semibold border transition-colors ${action.status === "pending" ? "bg-warning/10 border-warning/30 text-warning" : "hover:bg-secondary/30"}`}
                  >
                    <Clock3 className="h-3 w-3 inline mr-1" />
                    Pendiente
                  </button>
                  <button
                    onClick={() => setStatus(action.id, "in_progress")}
                    className={`px-2 py-1 text-[10px] font-semibold border transition-colors ${action.status === "in_progress" ? "bg-primary/10 border-primary/30 text-primary" : "hover:bg-primary/5"}`}
                  >
                    <PlayCircle className="h-3 w-3 inline mr-1" />
                    En curso
                  </button>
                  <button
                    onClick={() => setStatus(action.id, "completed")}
                    className={`px-2 py-1 text-[10px] font-semibold border transition-colors ${action.status === "completed" ? "bg-accent/10 border-accent/30 text-accent" : "hover:bg-accent/5"}`}
                  >
                    <CheckCircle2 className="h-3 w-3 inline mr-1" />
                    Completada
                  </button>
                </div>
              </div>
            </div>
          ))}
          {actions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay acciones registradas. Ejecuta automatizaciones para generarlas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DevelopmentActionsView;
