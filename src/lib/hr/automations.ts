import type {
  BonusObjective,
  DevelopmentAction,
  PerformanceEvaluation,
  PotentialAssessment,
  SuccessionRiskSnapshot,
} from "@/types/hr";
import {
  BONUS_OBJECTIVE_AT_RISK_THRESHOLD,
  HIGH_POTENTIAL_THRESHOLD,
  SUSTAINED_PERFORMANCE_THRESHOLD,
} from "./constants";

interface AutomationInput {
  evaluations: PerformanceEvaluation[];
  potentialAssessments: PotentialAssessment[];
  objectives: BonusObjective[];
  successionRisks: SuccessionRiskSnapshot[];
  existingActions?: DevelopmentAction[];
}

function latestByEmployee<T extends { employeeId: string; assessedAt?: string; evaluatedAt?: string }>(
  rows: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const existing = map.get(row.employeeId);
    const rowDate = (row.assessedAt ?? row.evaluatedAt) ?? "";
    const existingDate = existing ? (existing.assessedAt ?? existing.evaluatedAt) ?? "" : "";
    if (!existing || rowDate > existingDate) map.set(row.employeeId, row);
  }
  return map;
}

export function detectSustainedPerformance(evaluations: PerformanceEvaluation[]): string[] {
  const grouped = new Map<string, number[]>();
  for (const ev of evaluations) {
    const values = grouped.get(ev.employeeId) ?? [];
    values.push(ev.normalizedScore);
    grouped.set(ev.employeeId, values);
  }

  const sustained: string[] = [];
  for (const [employeeId, scores] of grouped.entries()) {
    if (!scores.length) continue;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avg >= SUSTAINED_PERFORMANCE_THRESHOLD) sustained.push(employeeId);
  }
  return sustained;
}

export function generateAutomaticActions(input: AutomationInput): DevelopmentAction[] {
  const actions: DevelopmentAction[] = [];
  const now = new Date().toISOString();

  const latestPotential = latestByEmployee(
    input.potentialAssessments.map((p) => ({ ...p, assessedAt: p.assessedAt })),
  );
  const sustainedEmployees = new Set(detectSustainedPerformance(input.evaluations));

  for (const objective of input.objectives) {
    const progress = objective.progressValue ?? 0;
    if (objective.status === "at_risk" || progress < BONUS_OBJECTIVE_AT_RISK_THRESHOLD) {
      actions.push({
        id: `auto-bonus-${objective.id}`,
        employeeId: objective.employeeId,
        source: "automation",
        actionType: "mentoring",
        title: `Activar plan de seguimiento para objetivo ${objective.objectiveCode}`,
        reason: `Objetivo bonus en riesgo (${progress}%) en ciclo ${objective.cycle}`,
        priority: "high",
        status: "pending",
        dueDate: objective.dueDate,
        createdAt: now,
      });
    }
  }

  for (const [employeeId, potential] of latestPotential.entries()) {
    if (potential.potentialScore >= HIGH_POTENTIAL_THRESHOLD && sustainedEmployees.has(employeeId)) {
      actions.push({
        id: `auto-rotation-${employeeId}-${potential.cycle}`,
        employeeId,
        source: "automation",
        actionType: "rotation",
        title: "Activar trayectoria acelerada",
        reason: `Perfil high potential con desempeño sostenido (${potential.potentialScore}/100)`,
        priority: "medium",
        status: "pending",
        dueDate: null,
        createdAt: now,
      });
    }
  }

  for (const risk of input.successionRisks) {
    if (risk.riskLevel !== "high") continue;
    actions.push({
      id: `auto-succession-${risk.id}`,
      employeeId: "UNASSIGNED",
      source: "automation",
      actionType: "succession",
      title: `Cobertura sucesoria urgente: ${risk.positionName}`,
      reason: `Riesgo alto en ${risk.businessUnit} · cobertura ${risk.readinessCoverage}% · bench ${risk.benchSize}`,
      priority: "high",
      status: "pending",
      dueDate: null,
      createdAt: now,
    });
  }

  const existingIds = new Set((input.existingActions ?? []).map((a) => a.id));
  return actions.filter((a) => !existingIds.has(a.id));
}
