import { supabase } from "@/lib/supabase";
import type {
  BonusObjective,
  CareerPathStep,
  DevelopmentAction,
  PerformanceEvaluation,
  PotentialAssessment,
  SuccessionRiskSnapshot,
} from "@/types/hr";
import { buildIntegratedTalentKpis, type IntegratedTalentKpi } from "./kpis";
import {
  generateTrainingRecommendations,
  recommendationsToDevelopmentActions,
  type TrainingRecommendation,
} from "./recommendations";
import {
  addMockDevelopmentActions,
  getMockBonusObjectives,
  getMockCareerPaths,
  getMockDevelopmentActions,
  getMockEvaluations,
  getMockIntegratedTalentRows,
  getMockPotentialAssessments,
  getMockSuccessionRiskSnapshots,
} from "@/data/mockHrData";

type JsonRow = Record<string, unknown>;

export interface EmployeeSkillGap {
  employeeId: string;
  fullName: string;
  position: string | null;
  matchingPaths: Array<{
    pathCode: string;
    toRole: string;
    gapSkills: string[];
    minReadinessScore: number;
  }>;
  allGapSkills: string[];
}

export interface IntegratedTalentEmployeeRow {
  employeeId: string;
  fullName: string;
  businessUnit: string | null;
  department: string | null;
  position: string | null;
  sustainedPerformanceScore: number;
  latestEvalAt: string | null;
  potentialLevel: string | null;
  potentialScore: number | null;
  readiness: string | null;
  objectivesTotal: number;
  objectivesOnTrack: number;
  actionsTotal: number;
  actionsPending: number;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function fetchIntegratedTalentRows(): Promise<IntegratedTalentEmployeeRow[]> {
  try {
    const { data, error } = await supabase
      .from("hr_integrated_talent_dashboard_v")
      .select("*")
      .order("sustained_performance_score", { ascending: false });

    if (error) throw error;
    if (!data?.length) return getMockIntegratedTalentRows();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        employeeId: String(r.employee_id ?? ""),
        fullName: String(r.full_name ?? ""),
        businessUnit: (r.business_unit as string | null | undefined) ?? null,
        department: (r.department as string | null | undefined) ?? null,
        position: (r.position as string | null | undefined) ?? null,
        sustainedPerformanceScore: toNumber(r.sustained_performance_score),
        latestEvalAt: (r.latest_eval_at as string | null | undefined) ?? null,
        potentialLevel: (r.potential_level as string | null | undefined) ?? null,
        potentialScore: r.potential_score != null ? toNumber(r.potential_score) : null,
        readiness: (r.readiness as string | null | undefined) ?? null,
        objectivesTotal: toNumber(r.objectives_total),
        objectivesOnTrack: toNumber(r.objectives_on_track),
        actionsTotal: toNumber(r.actions_total),
        actionsPending: toNumber(r.actions_pending),
      };
    });
  } catch {
    return getMockIntegratedTalentRows();
  }
}

export async function fetchPerformanceEvaluations(cycle?: string): Promise<PerformanceEvaluation[]> {
  try {
    let query = supabase.from("performance_evaluations").select("*").order("evaluated_at", { ascending: false });
    if (cycle) query = query.eq("cycle", cycle);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return cycle ? getMockEvaluations().filter((e) => e.cycle === cycle) : getMockEvaluations();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        employeeId: String(r.employee_id ?? ""),
        source: r.source as PerformanceEvaluation["source"],
        cycle: String(r.cycle ?? ""),
        evaluationType: r.evaluation_type as PerformanceEvaluation["evaluationType"],
        score: toNumber(r.score),
        normalizedScore: toNumber(r.normalized_score),
        qualitativeNotes: (r.qualitative_notes as string | null | undefined) ?? null,
        evaluator: (r.evaluator as string | null | undefined) ?? null,
        evaluatedAt: String(r.evaluated_at ?? ""),
      };
    });
  } catch {
    const all = getMockEvaluations();
    return cycle ? all.filter((e) => e.cycle === cycle) : all;
  }
}

export async function fetchPotentialAssessments(cycle?: string): Promise<PotentialAssessment[]> {
  try {
    let query = supabase.from("potential_assessments").select("*").order("assessed_at", { ascending: false });
    if (cycle) query = query.eq("cycle", cycle);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return cycle ? getMockPotentialAssessments().filter((p) => p.cycle === cycle) : getMockPotentialAssessments();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        employeeId: String(r.employee_id ?? ""),
        source: r.source as PotentialAssessment["source"],
        cycle: String(r.cycle ?? ""),
        potentialLevel: r.potential_level as PotentialAssessment["potentialLevel"],
        potentialScore: toNumber(r.potential_score),
        readiness: r.readiness as PotentialAssessment["readiness"],
        rationale: (r.rationale as string | null | undefined) ?? null,
        assessedAt: String(r.assessed_at ?? ""),
      };
    });
  } catch {
    const all = getMockPotentialAssessments();
    return cycle ? all.filter((p) => p.cycle === cycle) : all;
  }
}

export async function fetchBonusObjectives(cycle?: string): Promise<BonusObjective[]> {
  try {
    let query = supabase.from("bonus_objectives").select("*").order("imported_at", { ascending: false });
    if (cycle) query = query.eq("cycle", cycle);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return cycle ? getMockBonusObjectives().filter((o) => o.cycle === cycle) : getMockBonusObjectives();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        employeeId: String(r.employee_id ?? ""),
        source: r.source as BonusObjective["source"],
        cycle: String(r.cycle ?? ""),
        objectiveCode: String(r.objective_code ?? ""),
        objectiveName: String(r.objective_name ?? ""),
        weight: toNumber(r.weight),
        targetValue: r.target_value != null ? toNumber(r.target_value) : null,
        progressValue: r.progress_value != null ? toNumber(r.progress_value) : null,
        status: r.status as BonusObjective["status"],
        dueDate: (r.due_date as string | null | undefined) ?? null,
        importedAt: String(r.imported_at ?? ""),
      };
    });
  } catch {
    const all = getMockBonusObjectives();
    return cycle ? all.filter((o) => o.cycle === cycle) : all;
  }
}

export async function fetchDevelopmentActions(): Promise<DevelopmentAction[]> {
  try {
    const { data, error } = await supabase
      .from("hr_development_actions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data?.length) return getMockDevelopmentActions();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        employeeId: String(r.employee_id ?? ""),
        source: r.source as DevelopmentAction["source"],
        actionType: r.action_type as DevelopmentAction["actionType"],
        title: String(r.title ?? ""),
        reason: String(r.reason ?? ""),
        priority: r.priority as DevelopmentAction["priority"],
        status: r.status as DevelopmentAction["status"],
        dueDate: (r.due_date as string | null | undefined) ?? null,
        createdAt: String(r.created_at ?? ""),
      };
    });
  } catch {
    return getMockDevelopmentActions();
  }
}

export async function fetchSuccessionRiskSnapshots(): Promise<SuccessionRiskSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from("hr_succession_risk_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false });
    if (error) throw error;
    if (!data?.length) return getMockSuccessionRiskSnapshots();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        positionId: String(r.position_id ?? ""),
        positionName: String(r.position_name ?? ""),
        businessUnit: String(r.business_unit ?? ""),
        riskLevel: r.risk_level as SuccessionRiskSnapshot["riskLevel"],
        readinessCoverage: toNumber(r.readiness_coverage),
        benchSize: toNumber(r.bench_size),
        snapshotDate: String(r.snapshot_date ?? ""),
      };
    });
  } catch {
    return getMockSuccessionRiskSnapshots();
  }
}

export async function fetchCareerPaths(): Promise<CareerPathStep[]> {
  try {
    const { data, error } = await supabase
      .from("hr_career_paths")
      .select("*")
      .order("path_code", { ascending: true });
    if (error) throw error;
    if (!data?.length) return getMockCareerPaths();

    return data.map((row) => {
      const r = row as JsonRow;
      return {
        id: String(r.id ?? ""),
        pathCode: String(r.path_code ?? ""),
        fromRole: String(r.from_role ?? ""),
        toRole: String(r.to_role ?? ""),
        minReadinessScore: toNumber(r.min_readiness_score),
        requiredSkills: (r.required_skills as string[] | null | undefined) ?? [],
      };
    });
  } catch {
    return getMockCareerPaths();
  }
}

export async function fetchIntegratedTalentKpis(): Promise<IntegratedTalentKpi> {
  const [rows, evaluations, potential, succession, actions, objectives] = await Promise.all([
    fetchIntegratedTalentRows(),
    fetchPerformanceEvaluations(),
    fetchPotentialAssessments(),
    fetchSuccessionRiskSnapshots(),
    fetchDevelopmentActions(),
    fetchBonusObjectives(),
  ]);

  const recommendations = await fetchTrainingRecommendations();

  return buildIntegratedTalentKpis({
    totalEmployees: rows.length,
    evaluations,
    potentialAssessments: potential,
    successionRiskSnapshots: succession,
    developmentActions: actions,
    objectives,
    trainingRecommendationCount: recommendations.length,
  });
}

export async function computeEmployeeSkillGaps(): Promise<EmployeeSkillGap[]> {
  const [rows, paths] = await Promise.all([
    fetchIntegratedTalentRows(),
    fetchCareerPaths(),
  ]);

  if (!paths.length) {
    return rows.map((r) => ({
      employeeId: r.employeeId,
      fullName: r.fullName,
      position: r.position,
      matchingPaths: [],
      allGapSkills: [],
    }));
  }

  const pathsByFromRole = new Map<string, CareerPathStep[]>();
  for (const p of paths) {
    const normalizedFrom = p.fromRole.toLowerCase().trim();
    const list = pathsByFromRole.get(normalizedFrom) ?? [];
    list.push(p);
    pathsByFromRole.set(normalizedFrom, list);
  }

  return rows.map((row) => {
    const posLower = (row.position ?? "").toLowerCase().trim();
    const candidatePaths = pathsByFromRole.get(posLower) ?? [];

    const matchingPaths = candidatePaths.map((p) => ({
      pathCode: p.pathCode,
      toRole: p.toRole,
      gapSkills: [...p.requiredSkills],
      minReadinessScore: p.minReadinessScore,
    }));

    const allGapSkills = [...new Set(matchingPaths.flatMap((mp) => mp.gapSkills))];

    return {
      employeeId: row.employeeId,
      fullName: row.fullName,
      position: row.position,
      matchingPaths,
      allGapSkills,
    };
  });
}

export async function fetchTrainingRecommendations(): Promise<TrainingRecommendation[]> {
  const [rows, evaluations, potential, skillGaps] = await Promise.all([
    fetchIntegratedTalentRows(),
    fetchPerformanceEvaluations(),
    fetchPotentialAssessments(),
    computeEmployeeSkillGaps(),
  ]);

  const gapsByEmployee = new Map<string, string[]>();
  for (const g of skillGaps) {
    if (g.allGapSkills.length > 0) {
      gapsByEmployee.set(g.employeeId, g.allGapSkills);
    }
  }

  const latestEvalByEmployee = new Map<string, PerformanceEvaluation>();
  for (const ev of evaluations) {
    const existing = latestEvalByEmployee.get(ev.employeeId);
    if (!existing || ev.evaluatedAt > existing.evaluatedAt) {
      latestEvalByEmployee.set(ev.employeeId, ev);
    }
  }

  const latestPotentialByEmployee = new Map<string, PotentialAssessment>();
  for (const p of potential) {
    const existing = latestPotentialByEmployee.get(p.employeeId);
    if (!existing || p.assessedAt > existing.assessedAt) {
      latestPotentialByEmployee.set(p.employeeId, p);
    }
  }

  const recommendationInput = rows.map((row) => ({
    employeeId: row.employeeId,
    employeeName: row.fullName,
    skillGapNames: gapsByEmployee.get(row.employeeId) ?? [],
    latestEvaluation: latestEvalByEmployee.get(row.employeeId) ?? null,
    potential: latestPotentialByEmployee.get(row.employeeId) ?? null,
  }));

  return generateTrainingRecommendations(recommendationInput);
}

export async function syncTrainingRecommendationsToActions(): Promise<number> {
  const recommendations = await fetchTrainingRecommendations();
  const actions = recommendationsToDevelopmentActions(recommendations);
  if (!actions.length) return 0;

  try {
    const { error } = await supabase
      .from("hr_development_actions")
      .upsert(actions as JsonRow[], { onConflict: "id" });
    if (error) throw error;
  } catch {
    addMockDevelopmentActions(actions);
  }
  return actions.length;
}
