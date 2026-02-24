import { supabase } from "@/lib/supabase";
import type { BonusObjective, DevelopmentAction, SuccessionRiskSnapshot } from "@/types/hr";
import { generateAutomaticActions } from "./automations";
import {
  fetchBonusObjectives,
  fetchDevelopmentActions,
  fetchPerformanceEvaluations,
  fetchPotentialAssessments,
  fetchSuccessionRiskSnapshots,
  syncTrainingRecommendationsToActions,
} from "./queries";
import {
  addMockDevelopmentActions,
  updateMockActionStatus,
} from "@/data/mockHrData";

type JsonLike = Record<string, unknown>;

export async function runHrAutomations(): Promise<{
  generatedActions: number;
  syncedRecommendations: number;
}> {
  const [evaluations, potentialAssessments, objectives, successionRisks, existingActions] =
    await Promise.all([
      fetchPerformanceEvaluations(),
      fetchPotentialAssessments(),
      fetchBonusObjectives(),
      fetchSuccessionRiskSnapshots(),
      fetchDevelopmentActions(),
    ]);

  const newActions = generateAutomaticActions({
    evaluations,
    potentialAssessments,
    objectives,
    successionRisks,
    existingActions,
  });

  if (newActions.length) {
    try {
      const { error } = await supabase
        .from("hr_development_actions")
        .upsert(newActions as JsonLike[], { onConflict: "id" });
      if (error) throw error;
    } catch {
      addMockDevelopmentActions(newActions);
    }
  }

  const syncedRecommendations = await syncTrainingRecommendationsToActions();
  return { generatedActions: newActions.length, syncedRecommendations };
}

export async function upsertBonusObjectives(objectives: BonusObjective[]): Promise<number> {
  if (!objectives.length) return 0;
  const { error } = await supabase
    .from("bonus_objectives")
    .upsert(objectives as JsonLike[], { onConflict: "id" });
  if (error) throw error;
  return objectives.length;
}

export async function upsertSuccessionRiskSnapshots(
  snapshots: SuccessionRiskSnapshot[],
): Promise<number> {
  if (!snapshots.length) return 0;
  const { error } = await supabase
    .from("hr_succession_risk_snapshots")
    .upsert(snapshots as JsonLike[], { onConflict: "id" });
  if (error) throw error;
  return snapshots.length;
}

export async function updateDevelopmentActionStatus(
  actionId: string,
  status: DevelopmentAction["status"],
): Promise<void> {
  try {
    const { error } = await supabase
      .from("hr_development_actions")
      .update({ status })
      .eq("id", actionId);
    if (error) throw error;
  } catch {
    updateMockActionStatus(actionId, status);
  }
}
