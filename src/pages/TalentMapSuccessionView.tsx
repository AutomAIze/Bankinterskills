import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useSuccessionRiskSnapshots } from "@/hooks/useSkillsData";

const TalentMapSuccessionView = () => {
  const { data: riskSnapshots = [], isLoading } = useSuccessionRiskSnapshots();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const highRisk = riskSnapshots.filter((s) => s.riskLevel === "high");
  const mediumRisk = riskSnapshots.filter((s) => s.riskLevel === "medium");
  const lowRisk = riskSnapshots.filter((s) => s.riskLevel === "low");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Mapa de Talento y Sucesión</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Riesgo sucesorio, cobertura de bench y readiness por posición crítica
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-destructive tabular-nums">{highRisk.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Riesgo alto
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-warning tabular-nums">{mediumRisk.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Riesgo medio
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-3">
            <p className="text-xl font-extrabold text-accent tabular-nums">{lowRisk.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Riesgo bajo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-navy">Posiciones críticas</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            El riesgo sucesorio se calcula por cobertura efectiva y tamaño del bench
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 px-2 py-1 border-b">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Posición</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Unidad</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Cobertura</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Bench</p>
          </div>
          {riskSnapshots.map((snapshot) => {
            const riskClass =
              snapshot.riskLevel === "high"
                ? "text-destructive"
                : snapshot.riskLevel === "medium"
                  ? "text-warning"
                  : "text-accent";
            return (
              <div
                key={snapshot.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 items-center px-2 py-2 border hover:bg-secondary/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">{snapshot.positionName}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${riskClass}`}>
                    {snapshot.riskLevel}
                  </p>
                </div>
                <p className="text-[11px] text-right text-muted-foreground">{snapshot.businessUnit}</p>
                <p className={`text-xs font-bold text-right tabular-nums ${riskClass}`}>
                  {Math.round(snapshot.readinessCoverage)}%
                </p>
                <p className="text-xs font-bold text-right tabular-nums text-navy">{snapshot.benchSize}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-bold text-navy">Alerta</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Prioriza posiciones con riesgo alto y cobertura menor al 60% para activar planes de sucesión.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-sm font-bold text-navy">Acción sugerida</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Asigna acciones de mentoring y rotación para ampliar bench en las áreas con menor cobertura.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentMapSuccessionView;
