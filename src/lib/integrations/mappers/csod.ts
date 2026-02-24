import type { PerformanceEvaluation, PotentialAssessment } from "@/types/hr";
import { parseNumber } from "../parsers";

export interface CsodMappedPayload {
  evaluations: PerformanceEvaluation[];
  potential: PotentialAssessment[];
}

interface CsodMapOptions {
  cycle: string;
}

export function mapCsodRows(
  rows: Array<{ rowNumber: number; raw: Record<string, string> }>,
  options: CsodMapOptions,
): { payload: CsodMappedPayload; errors: string[] } {
  const errors: string[] = [];
  const evaluations: PerformanceEvaluation[] = [];
  const potential: PotentialAssessment[] = [];

  for (const row of rows) {
    const employeeId = row.raw.employee_id?.trim();
    if (!employeeId) {
      errors.push(`Fila ${row.rowNumber}: falta employee_id`);
      continue;
    }

    const performance = parseNumber(row.raw.performance_score);
    const potentialScore = parseNumber(row.raw.potential_score);
    const date = row.raw.evaluated_at || new Date().toISOString();

    if (performance != null) {
      evaluations.push({
        id: `csod-eval-${options.cycle}-${employeeId}-${row.rowNumber}`,
        employeeId,
        source: "CSOD",
        cycle: options.cycle,
        evaluationType: "annual",
        score: performance,
        normalizedScore: Math.max(0, Math.min(100, performance)),
        qualitativeNotes: row.raw.qualitative_notes || null,
        evaluator: row.raw.evaluator || null,
        evaluatedAt: date,
      });
    }

    if (potentialScore != null) {
      const level =
        potentialScore >= 75 ? "high" : potentialScore >= 50 ? "medium" : "low";
      potential.push({
        id: `csod-pot-${options.cycle}-${employeeId}-${row.rowNumber}`,
        employeeId,
        source: "CSOD",
        cycle: options.cycle,
        potentialLevel: level,
        potentialScore: Math.max(0, Math.min(100, potentialScore)),
        readiness:
          level === "high" ? "ready_1y" : level === "medium" ? "ready_2y" : "not_ready",
        rationale: row.raw.potential_rationale || null,
        assessedAt: row.raw.assessed_at || date,
      });
    }
  }

  return { payload: { evaluations, potential }, errors };
}
