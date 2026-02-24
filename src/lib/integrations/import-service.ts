import { supabase } from "@/lib/supabase";
import type {
  BonusObjective,
  Employee,
  PerformanceEvaluation,
  PotentialAssessment,
} from "@/types/hr";
import { mapCsodRows } from "./mappers/csod";
import { mapM50Rows } from "./mappers/m50";
import { mapSopraRows } from "./mappers/sopra";
import { parseDelimitedText } from "./parsers";

type JsonLike = Record<string, unknown>;

export type IntegrationSource = "CSOD" | "SOPRA" | "M50";

export interface ImportPreview {
  source: IntegrationSource;
  totalRows: number;
  validRows: number;
  errors: string[];
  summary: Record<string, number>;
}

export interface BatchAuditRecord {
  batchId: string;
  source: IntegrationSource;
  cycle: string;
  status: "processing" | "completed" | "failed";
  totalRows: number;
  validRows: number;
  errorRows: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface ImportExecutionResult extends ImportPreview {
  upserted: Record<string, number>;
  batchId: string | null;
}

interface ParsedDatasets {
  employees?: Employee[];
  evaluations?: PerformanceEvaluation[];
  potential?: PotentialAssessment[];
  objectives?: BonusObjective[];
}

function toImportPreview(
  source: IntegrationSource,
  totalRows: number,
  errors: string[],
  datasets: ParsedDatasets,
): ImportPreview {
  return {
    source,
    totalRows,
    validRows: Math.max(totalRows - errors.length, 0),
    errors,
    summary: {
      employees: datasets.employees?.length ?? 0,
      evaluations: datasets.evaluations?.length ?? 0,
      potential: datasets.potential?.length ?? 0,
      objectives: datasets.objectives?.length ?? 0,
    },
  };
}

function splitBatches<T>(rows: T[], size = 200): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    batches.push(rows.slice(i, i + size));
  }
  return batches;
}

async function upsertMany<T>(
  table: string,
  rows: T[],
  onConflict: string,
): Promise<number> {
  if (!rows.length) return 0;
  let inserted = 0;
  for (const batch of splitBatches(rows, 200)) {
    const { error } = await supabase.from(table).upsert(batch as JsonLike[], { onConflict });
    if (error) throw error;
    inserted += batch.length;
  }
  return inserted;
}

async function createBatchRecord(
  source: IntegrationSource,
  cycle: string,
  totalRows: number,
  validRows: number,
  errorRows: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("hr_import_batches")
    .insert({
      source,
      cycle,
      status: "processing",
      total_rows: totalRows,
      valid_rows: validRows,
      error_rows: errorRows,
      metadata: {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return String((data as JsonLike).id ?? "");
}

async function persistBatchErrors(
  batchId: string,
  errors: string[],
): Promise<void> {
  if (!errors.length) return;
  const rows = errors.map((msg, idx) => ({
    batch_id: batchId,
    row_number: idx + 1,
    error_code: "VALIDATION",
    error_message: msg,
    raw_payload: {},
  }));
  for (const batch of splitBatches(rows, 200)) {
    const { error } = await supabase.from("hr_import_errors").insert(batch);
    if (error) throw error;
  }
}

async function finalizeBatch(
  batchId: string,
  status: "completed" | "failed",
): Promise<void> {
  const { error } = await supabase
    .from("hr_import_batches")
    .update({ status, finished_at: new Date().toISOString() })
    .eq("id", batchId);
  if (error) throw error;
}

export async function fetchBatchAuditHistory(
  limit = 20,
): Promise<BatchAuditRecord[]> {
  const { data, error } = await supabase
    .from("hr_import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as JsonLike;
    return {
      batchId: String(row.id ?? ""),
      source: row.source as IntegrationSource,
      cycle: String(row.cycle ?? ""),
      status: row.status as BatchAuditRecord["status"],
      totalRows: Number(row.total_rows ?? 0),
      validRows: Number(row.valid_rows ?? 0),
      errorRows: Number(row.error_rows ?? 0),
      createdAt: String(row.created_at ?? ""),
      finishedAt: row.finished_at ? String(row.finished_at) : null,
    };
  });
}

export function previewImport(params: {
  source: IntegrationSource;
  content: string;
  cycle: string;
}): ImportPreview {
  const parsed = parseDelimitedText(params.content);
  const totalRows = parsed.rows.length;

  if (params.source === "CSOD") {
    const mapped = mapCsodRows(parsed.rows, { cycle: params.cycle });
    return toImportPreview(params.source, totalRows, mapped.errors, {
      evaluations: mapped.payload.evaluations,
      potential: mapped.payload.potential,
    });
  }

  if (params.source === "SOPRA") {
    const mapped = mapSopraRows(parsed.rows);
    return toImportPreview(params.source, totalRows, mapped.errors, {
      employees: mapped.employees,
    });
  }

  const mapped = mapM50Rows(parsed.rows, { cycle: params.cycle });
  return toImportPreview(params.source, totalRows, mapped.errors, {
    objectives: mapped.objectives,
  });
}

export async function runBatchImport(params: {
  source: IntegrationSource;
  content: string;
  cycle: string;
  dryRun?: boolean;
}): Promise<ImportExecutionResult> {
  const preview = previewImport(params);
  if (params.dryRun) {
    return { ...preview, upserted: {}, batchId: null };
  }

  const batchId = await createBatchRecord(
    params.source,
    params.cycle,
    preview.totalRows,
    preview.validRows,
    preview.errors.length,
  );

  try {
    if (preview.errors.length > 0) {
      await persistBatchErrors(batchId, preview.errors);
    }

    const parsed = parseDelimitedText(params.content);
    const upserted: Record<string, number> = {};

    if (params.source === "CSOD") {
      const mapped = mapCsodRows(parsed.rows, { cycle: params.cycle });
      upserted.performance_evaluations = await upsertMany(
        "performance_evaluations",
        mapped.payload.evaluations,
        "id",
      );
      upserted.potential_assessments = await upsertMany(
        "potential_assessments",
        mapped.payload.potential,
        "id",
      );
    } else if (params.source === "SOPRA") {
      const mapped = mapSopraRows(parsed.rows);
      upserted.hr_employees = await upsertMany("hr_employees", mapped.employees, "id");
    } else {
      const mapped = mapM50Rows(parsed.rows, { cycle: params.cycle });
      upserted.bonus_objectives = await upsertMany("bonus_objectives", mapped.objectives, "id");
    }

    await finalizeBatch(batchId, "completed");
    return { ...preview, upserted, batchId };
  } catch (err) {
    await finalizeBatch(batchId, "failed").catch(() => {});
    throw err;
  }
}
