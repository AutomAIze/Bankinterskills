import { describe, expect, it } from "vitest";
import {
  buildIntegratedTalentKpis,
  computeBonusObjectivesOnTrackRate,
  computeHighPotentialRate,
  computeSustainedPerformanceRate,
} from "@/lib/hr/kpis";
import type { BonusObjective, PerformanceEvaluation, PotentialAssessment } from "@/types/hr";

function evaluation(employeeId: string, score: number): PerformanceEvaluation {
  return {
    id: `${employeeId}-${score}`,
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

function potential(employeeId: string, level: PotentialAssessment["potentialLevel"], score: number): PotentialAssessment {
  return {
    id: `${employeeId}-${level}`,
    employeeId,
    source: "CSOD",
    cycle: "2026",
    potentialLevel: level,
    potentialScore: score,
    readiness: "ready_1y",
    rationale: null,
    assessedAt: "2026-01-31T00:00:00.000Z",
  };
}

function objective(status: BonusObjective["status"]): BonusObjective {
  return {
    id: `obj-${status}-${Math.random()}`,
    employeeId: "E1",
    source: "M50",
    cycle: "2026",
    objectiveCode: "OBJ",
    objectiveName: "Objetivo",
    weight: 30,
    targetValue: 100,
    progressValue: status === "on_track" ? 90 : 40,
    status,
    dueDate: null,
    importedAt: "2026-01-31T00:00:00.000Z",
  };
}

describe("hr kpis", () => {
  it("computes sustained performance rate", () => {
    const rate = computeSustainedPerformanceRate([
      evaluation("E1", 80),
      evaluation("E1", 78),
      evaluation("E2", 60),
      evaluation("E2", 55),
    ]);
    expect(rate).toBe(50);
  });

  it("computes high potential and bonus on-track rates", () => {
    const highPotentialRate = computeHighPotentialRate([
      potential("E1", "high", 80),
      potential("E2", "medium", 60),
    ]);
    expect(highPotentialRate).toBe(50);

    const onTrackRate = computeBonusObjectivesOnTrackRate([
      objective("on_track"),
      objective("at_risk"),
      objective("completed"),
    ]);
    expect(onTrackRate).toBe(67);
  });

  it("builds integrated KPI object", () => {
    const kpis = buildIntegratedTalentKpis({
      totalEmployees: 10,
      evaluations: [evaluation("E1", 85), evaluation("E2", 72)],
      potentialAssessments: [potential("E1", "high", 82), potential("E2", "medium", 65)],
      successionRiskSnapshots: [
        {
          id: "s1",
          positionId: "P1",
          positionName: "Head of Risk",
          businessUnit: "Risk",
          riskLevel: "high",
          readinessCoverage: 40,
          benchSize: 1,
          snapshotDate: "2026-01-31",
        },
      ],
      developmentActions: [
        {
          id: "a1",
          employeeId: "E1",
          source: "automation",
          actionType: "training",
          title: "Plan",
          reason: "Reason",
          priority: "medium",
          status: "pending",
          dueDate: null,
          createdAt: "2026-01-31T00:00:00.000Z",
        },
      ],
      objectives: [objective("on_track"), objective("at_risk")],
      trainingRecommendationCount: 4,
    });

    expect(kpis.totalEmployees).toBe(10);
    expect(kpis.trainingRecommendationCount).toBe(4);
    expect(kpis.successionRiskHighCount).toBe(1);
  });
});
