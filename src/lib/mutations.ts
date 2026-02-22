import { supabase } from './supabase';

const NEXT_STAGE: Record<string, string> = {
  applied: 'screened',
  screened: 'validated',
  validated: 'shortlisted',
  shortlisted: 'interview',
  interview: 'offer',
  offer: 'hired',
};

export async function advancePipelineStage(candidateId: string, roleId: string, currentStage: string) {
  const nextStage = NEXT_STAGE[currentStage];
  if (!nextStage) throw new Error(`No next stage for: ${currentStage}`);

  const { error } = await supabase
    .from('candidate_roles')
    .update({ pipeline_stage: nextStage })
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId);

  if (error) throw error;
  return nextStage;
}

export async function rejectCandidate(candidateId: string, roleId: string) {
  const { error } = await supabase
    .from('candidate_roles')
    .update({ pipeline_stage: 'rejected' })
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId);

  if (error) throw error;
}

export async function requestPanoramaValidation(candidateId: string, roleId: string) {
  const { error } = await supabase
    .from('candidate_roles')
    .update({ status: 'panorama_requested' })
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId);

  if (error) throw error;
}

export async function updateCandidateNotes(candidateId: string, notes: string) {
  const { error } = await supabase
    .from('candidates')
    .update({ notes })
    .eq('id', candidateId);

  if (error) throw error;
}

export async function setValidatedScore(
  candidateId: string,
  roleId: string,
  validatedScore: number,
  declarativeWeight = 0.4,
  scientificWeight = 0.6
) {
  const { data: cr, error: fetchErr } = await supabase
    .from('candidate_roles')
    .select('declarative_score')
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId)
    .single();

  if (fetchErr) throw fetchErr;

  const declarative = Number(cr.declarative_score ?? 0);
  const combined = Math.round(declarative * declarativeWeight + validatedScore * scientificWeight);
  const confidence = 1.0;

  const { error } = await supabase
    .from('candidate_roles')
    .update({
      validated_score: validatedScore,
      combined_score: combined,
      confidence,
    })
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId);

  if (error) throw error;
  return { combined, confidence };
}

export async function setHrAdequacy(candidateId: string, roleId: string, percentage: number) {
  const { error } = await supabase
    .from('candidate_roles')
    .update({ hr_adequacy_percentage: Math.round(percentage) })
    .eq('candidate_id', candidateId)
    .eq('role_id', roleId);

  if (error) throw error;
}

export interface AiEvaluationInput {
  candidateId: string;
  roleId: string;
  conversationSummary: string;
  strengths: string[];
  weaknesses: string[];
  adequacyLevel: string;
  adequacyScore: number;
}

export async function saveAiEvaluation(input: AiEvaluationInput) {
  const { error } = await supabase
    .from('ai_evaluation_results')
    .upsert(
      {
        candidate_id: input.candidateId,
        role_id: input.roleId,
        conversation_summary: input.conversationSummary,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        adequacy_level: input.adequacyLevel,
        adequacy_score: input.adequacyScore,
      },
      { onConflict: 'candidate_id, role_id' }
    );

  if (error) throw error;
}
