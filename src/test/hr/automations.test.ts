import { describe, expect, it } from "vitest";
import { detectSustainedPerformance, generateAutomaticActions } from "@/lib/hr/automations";
import type {
  BonusObjective,
  PerformanceEvaluation,
  PotentialAssessment,
  SuccessionRiskSnapshot,
} from "@/types/hr";

function evalRow(employeeId: string, score: number): PerformanceEvaluation {
  return {
    id: `ev-${employeeId}-${score}`,
    employeeId,
    source: "CSOD",
    cycle: "2026",
    evaluationType: "annual",
    score,
    normalizedScore: score,
    qualitativeNotes: null,
    evaluator: null,
    evaluatedAt: "2026-01-31T00:00:00.000Z",
  };
}

function potentialRow(employeeId: string, score: number): PotentialAssessment {
  return {
    id: `pot-${employeeId}-${score}`,
    employeeId,
    source: "CSOD",
    cycle: "2026",
    potentialLevel: score >= 70 ? "high" : "medium",
    potentialScore: score,
    readiness: "ready_1y",
    rationale: null,
    assessedAt: "2026-01-31T00:00:00.000Z",
  };
}

function bonusRow(employeeId: string, status: BonusObjective["status"], progress: number): BonusObjective {
  return {
    id: `obj-${employeeId}-${status}`,
    employeeId,
    source: "M50",
    cycle: "2026",
    objectiveCode: "OBJ-1",
    objectiveName: "Objetivo",
    weight: 40,
    targetValue: 100,
    progressValue: progress,
    status,
    dueDate: null,
    importedAt: "2026-01-31T00:00:00.000Z",
  };
}

function successionRow(risk: SuccessionRiskSnapshot["riskLevel"]): SuccessionRiskSnapshot {
  return {
    id: `succ-${risk}`,
    positionId: "P-1",
    positionName: "Director Comercial",
    businessUnit: "Retail",
    riskLevel: risk,
    readinessCoverage: 45,
    benchSize: 1,
    snapshotDate: "2026-01-31",
  };
}

describe("hr automations", () => {
  it("detects sustained performers", () => {
    const sustained = detectSustainedPerformance([
      evalRow("E1", 80),
      evalRow("E1", 85),
      evalRow("E2", 60),
      evalRow("E2", 65),
    ]);
    expect(sustained).toContain("E1");
    expect(sustained).not.toContain("E2");
  });

  it("generates actions for bonus risk, high potential, and succession risk", () => {
    const actions = generateAutomaticActions({
      evaluations: [evalRow("E1", 82), evalRow("E1", 84)],
      potentialAssessments: [potentialRow("E1", 78)],
      objectives: [bonusRow("E2", "at_risk", 42)],
      successionRisks: [successionRow("high")],
    });

    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions.some((a) => a.actionType === "mentoring")).toBe(true);
    expect(actions.some((a) => a.actionType === "rotation")).toBe(true);
    expect(actions.some((a) => a.actionType === "succession")).toBe(true);
  });
});
