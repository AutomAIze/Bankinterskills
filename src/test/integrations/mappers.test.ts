import { describe, expect, it } from "vitest";
import { parseDelimitedText } from "@/lib/integrations/parsers";
import { mapCsodRows } from "@/lib/integrations/mappers/csod";
import { mapSopraRows } from "@/lib/integrations/mappers/sopra";
import { mapM50Rows } from "@/lib/integrations/mappers/m50";

describe("integration mappers", () => {
  it("parses delimited text and maps CSOD rows", () => {
    const csv = [
      "employee_id,performance_score,potential_score,evaluated_at,assessed_at",
      "E001,80,72,2026-01-31,2026-01-31",
      "E002,65,55,2026-01-31,2026-01-31",
    ].join("\n");

    const parsed = parseDelimitedText(csv);
    const mapped = mapCsodRows(parsed.rows, { cycle: "2026" });

    expect(parsed.rows).toHaveLength(2);
    expect(mapped.errors).toEqual([]);
    expect(mapped.payload.evaluations).toHaveLength(2);
    expect(mapped.payload.potential).toHaveLength(2);
    expect(mapped.payload.potential[0].potentialLevel).toBe("medium");
  });

  it("maps Sopra rows and validates required fields", () => {
    const parsed = parseDelimitedText([
      "employee_id,full_name,email,business_unit",
      "E100,Ana Pérez,ana@cliente.com,Retail",
      ",Sin ID,sinid@cliente.com,Retail",
    ].join("\n"));

    const mapped = mapSopraRows(parsed.rows);
    expect(mapped.employees).toHaveLength(1);
    expect(mapped.errors).toHaveLength(1);
    expect(mapped.employees[0].id).toBe("E100");
  });

  it("maps M50 objectives with status and progress", () => {
    const parsed = parseDelimitedText([
      "employee_id,objective_code,objective_name,weight,progress_value,status",
      "E200,OBJ-01,Objetivo comercial,40,85,on_track",
      "E201,OBJ-02,Objetivo riesgo,35,42,at_risk",
    ].join("\n"));

    const mapped = mapM50Rows(parsed.rows, { cycle: "2026" });
    expect(mapped.errors).toEqual([]);
    expect(mapped.objectives).toHaveLength(2);
    expect(mapped.objectives[1].status).toBe("at_risk");
    expect(mapped.objectives[0].progressValue).toBe(85);
  });
});
