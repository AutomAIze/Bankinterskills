import type { BonusObjective } from "@/types/hr";
import { parseNumber } from "../parsers";

interface M50MapOptions {
  cycle: string;
}

export function mapM50Rows(
  rows: Array<{ rowNumber: number; raw: Record<string, string> }>,
  options: M50MapOptions,
): { objectives: BonusObjective[]; errors: string[] } {
  const objectives: BonusObjective[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const employeeId = row.raw.employee_id?.trim();
    const objectiveCode = row.raw.objective_code?.trim();
    const objectiveName = row.raw.objective_name?.trim();
    const weight = parseNumber(row.raw.weight);

    if (!employeeId || !objectiveCode || !objectiveName || weight == null) {
      errors.push(
        `Fila ${row.rowNumber}: faltan employee_id, objective_code, objective_name o weight`,
      );
      continue;
    }

    const progressValue = parseNumber(row.raw.progress_value);
    const status = row.raw.status?.trim().toLowerCase();

    objectives.push({
      id: `m50-${options.cycle}-${employeeId}-${objectiveCode}-${row.rowNumber}`,
      employeeId,
      source: "M50",
      cycle: options.cycle,
      objectiveCode,
      objectiveName,
      weight,
      targetValue: parseNumber(row.raw.target_value),
      progressValue,
      status:
        status === "completed"
          ? "completed"
          : status === "at_risk"
            ? "at_risk"
            : status === "on_track"
              ? "on_track"
              : "not_started",
      dueDate: row.raw.due_date || null,
      importedAt: row.raw.imported_at || new Date().toISOString(),
    });
  }

  return { objectives, errors };
}
