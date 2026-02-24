import { describe, expect, it } from "vitest";
import { previewImport } from "@/lib/integrations/import-service";

describe("batch audit and import traceability", () => {
  it("preview validates CSOD data before import", () => {
    const content = [
      "employee_id,performance_score,potential_score",
      "E1,80,75",
      "E2,62,58",
    ].join("\n");

    const preview = previewImport({ source: "CSOD", content, cycle: "2026" });

    expect(preview.source).toBe("CSOD");
    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(2);
    expect(preview.errors).toHaveLength(0);
    expect(preview.summary.evaluations).toBe(2);
    expect(preview.summary.potential).toBe(2);
  });

  it("preview captures row-level errors for missing employee_id", () => {
    const content = [
      "employee_id,full_name,email,business_unit",
      "E100,Ana Pérez,ana@test.com,Retail",
      ",Sin ID,sinid@test.com,Retail",
    ].join("\n");

    const preview = previewImport({ source: "SOPRA", content, cycle: "2026" });

    expect(preview.totalRows).toBe(2);
    expect(preview.errors.length).toBeGreaterThan(0);
    expect(preview.validRows).toBeLessThan(preview.totalRows);
    expect(preview.summary.employees).toBe(1);
  });

  it("preview validates M50 objectives data", () => {
    const content = [
      "employee_id,objective_code,objective_name,weight,progress_value,status",
      "E200,OBJ-01,Objetivo comercial,40,85,on_track",
      "E201,OBJ-02,Objetivo riesgo,35,42,at_risk",
    ].join("\n");

    const preview = previewImport({ source: "M50", content, cycle: "2026" });

    expect(preview.source).toBe("M50");
    expect(preview.totalRows).toBe(2);
    expect(preview.errors).toHaveLength(0);
    expect(preview.summary.objectives).toBe(2);
  });

  it("dry-run import returns no upserts and null batchId", async () => {
    const { runBatchImport } = await import("@/lib/integrations/import-service");

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

    expect(result.upserted).toEqual({});
    expect(result.batchId).toBeNull();
    expect(result.totalRows).toBe(1);
    expect(result.summary.objectives).toBe(1);
  });
});
