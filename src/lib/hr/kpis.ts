import type {
  BonusObjective,
  DevelopmentAction,
  IntegratedTalentKpi,
  PerformanceEvaluation,
  PotentialAssessment,
  SuccessionRiskSnapshot,
} from "@/types/hr";
import {
  BONUS_OBJECTIVE_ON_TRACK_THRESHOLD,
  SUSTAINED_PERFORMANCE_THRESHOLD,
} from "./constants";

function toRate(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function computeSustainedPerformanceRate(evaluations: PerformanceEvaluation[]): number {
  if (!evaluations.length) return 0;

  const grouped = new Map<string, number[]>();
  for (const ev of evaluations) {
    const list = grouped.get(ev.employeeId) ?? [];
    list.push(ev.normalizedScore);
    grouped.set(ev.employeeId, list);
  }

  let sustained = 0;
  for (const scores of grouped.values()) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avg >= SUSTAINED_PERFORMANCE_THRESHOLD) sustained++;
  }

  return toRate(sustained, grouped.size);
}

export function computeHighPotentialRate(potentialAssessments: PotentialAssessment[]): number {
  if (!potentialAssessments.length) return 0;

  const latestByEmployee = new Map<string, PotentialAssessment>();
  for (const p of potentialAssessments) {
    const existing = latestByEmployee.get(p.employeeId);
    if (!existing || p.assessedAt > existing.assessedAt) {
      latestByEmployee.set(p.employeeId, p);
    }
  }

  const high = Array.from(latestByEmployee.values()).filter(
    (p) => p.potentialLevel === "high" || p.potentialScore >= 70,
  ).length;
  return toRate(high, latestByEmployee.size);
}

export function computeBonusObjectivesOnTrackRate(objectives: BonusObjective[]): number {
  if (!objectives.length) return 0;
  const onTrack = objectives.filter((o) => {
    const progress = o.progressValue ?? 0;
    return o.status === "on_track" || o.status === "completed" || progress >= BONUS_OBJECTIVE_ON_TRACK_THRESHOLD;
  }).length;
  return toRate(onTrack, objectives.length);
}

export function buildIntegratedTalentKpis(input: {
  totalEmployees: number;
  evaluations: PerformanceEvaluation[];
  potentialAssessments: PotentialAssessment[];
  successionRiskSnapshots: SuccessionRiskSnapshot[];
  developmentActions: DevelopmentAction[];
  objectives: BonusObjective[];
  trainingRecommendationCount: number;
}): IntegratedTalentKpi {
  const evaluatedEmployees = new Set(input.evaluations.map((ev) => ev.employeeId)).size;
  const highSuccessionRisk = input.successionRiskSnapshots.filter((s) => s.riskLevel === "high").length;
  const pendingActions = input.developmentActions.filter((a) => a.status !== "completed").length;

  return {
    totalEmployees: input.totalEmployees,
    evaluatedEmployees,
    sustainedPerformanceRate: computeSustainedPerformanceRate(input.evaluations),
    highPotentialRate: computeHighPotentialRate(input.potentialAssessments),
    successionRiskHighCount: highSuccessionRisk,
    developmentActionsPending: pendingActions,
    bonusObjectivesOnTrackRate: computeBonusObjectivesOnTrackRate(input.objectives),
    trainingRecommendationCount: input.trainingRecommendationCount,
  };
}
