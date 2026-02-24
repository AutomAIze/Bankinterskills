import { describe, expect, it } from "vitest";
import {
  generateTrainingRecommendations,
  recommendationsToDevelopmentActions,
} from "@/lib/hr/recommendations";
import type { PerformanceEvaluation, PotentialAssessment } from "@/types/hr";

function evalRow(employeeId: string, score: number): PerformanceEvaluation {
  return {
    id: `ev-${employeeId}`,
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

function potRow(employeeId: string, score: number): PotentialAssessment {
  return {
    id: `pot-${employeeId}`,
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

describe("training recommendations with real skill gaps", () => {
  it("generates higher priority for employees with skill gaps", () => {
    const recs = generateTrainingRecommendations([
      {
        employeeId: "E1",
        employeeName: "Alice",
        skillGapNames: ["Liderazgo", "Gestión financiera", "Comunicación"],
        latestEvaluation: evalRow("E1", 55),
        potential: potRow("E1", 80),
      },
      {
        employeeId: "E2",
        employeeName: "Bob",
        skillGapNames: [],
        latestEvaluation: evalRow("E2", 90),
        potential: potRow("E2", 50),
      },
    ]);

    expect(recs).toHaveLength(2);
    const alice = recs.find((r) => r.employeeId === "E1")!;
    const bob = recs.find((r) => r.employeeId === "E2")!;

    expect(alice.reason).toContain("Gaps clave: Liderazgo");
    expect(alice.suggestedActions.some((a) => a.includes("Liderazgo"))).toBe(true);

    const priorityOrder = { high: 3, medium: 2, low: 1 };
    expect(priorityOrder[alice.priority]).toBeGreaterThanOrEqual(priorityOrder[bob.priority]);
  });

  it("falls back to generic actions when no skill gaps provided", () => {
    const recs = generateTrainingRecommendations([
      {
        employeeId: "E3",
        employeeName: "Charlie",
        skillGapNames: [],
        latestEvaluation: evalRow("E3", 50),
        potential: null,
      },
    ]);

    expect(recs).toHaveLength(1);
    expect(recs[0].suggestedActions).toEqual(
      expect.arrayContaining([expect.stringContaining("Mentoring")]),
    );
  });

  it("converts recommendations to development actions", () => {
    const recs = generateTrainingRecommendations([
      {
        employeeId: "E4",
        employeeName: "Diana",
        skillGapNames: ["Risk Management"],
        latestEvaluation: evalRow("E4", 60),
        potential: potRow("E4", 72),
      },
    ]);
    const actions = recommendationsToDevelopmentActions(recs);

    expect(actions).toHaveLength(1);
    expect(actions[0].actionType).toBe("training");
    expect(actions[0].status).toBe("pending");
    expect(actions[0].employeeId).toBe("E4");
  });
});
