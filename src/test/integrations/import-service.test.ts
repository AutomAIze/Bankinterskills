import { describe, expect, it } from "vitest";
import { previewImport, runBatchImport } from "@/lib/integrations/import-service";

describe("import service", () => {
  it("builds preview for CSOD", () => {
    const content = [
      "employee_id,performance_score,potential_score",
      "E1,80,75",
      "E2,62,58",
    ].join("\n");

    const preview = previewImport({ source: "CSOD", content, cycle: "2026" });
    expect(preview.totalRows).toBe(2);
    expect(preview.errors).toHaveLength(0);
    expect(preview.summary.evaluations).toBe(2);
    expect(preview.summary.potential).toBe(2);
  });

  it("supports dry-run execution without upserts", async () => {
    const content = [
      "employee_id,objective_code,objective_name,weight,progress_value,status",
      "E1,OBJ-1,Objetivo A,40,88,on_track",
    ].join("\n");

    const result = await runBatchImport({
      source: "M50",
      content,
      cycle: "2026",
      dryRun: true,
    });

    expect(result.totalRows).toBe(1);
    expect(result.upserted).toEqual({});
    expect(result.summary.objectives).toBe(1);
  });
});
