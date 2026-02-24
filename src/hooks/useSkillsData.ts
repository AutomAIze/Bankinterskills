import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRoles, fetchCandidatesForRole, fetchCandidateById, fetchDemoMetrics,
  fetchShortlistForRole, fetchSkillsTaxonomy, fetchSkillClusters, fetchSkillSupplyDemand,
  fetchRolesDashboard, fetchEquivalenceGaps, fetchAiEvaluation,
} from '@/lib/queries';
import {
  advancePipelineStage, rejectCandidate, requestPanoramaValidation,
  updateCandidateNotes, setValidatedScore, setHrAdequacy, saveAiEvaluation,
} from '@/lib/mutations';
import {
  fetchBonusObjectives,
  fetchCareerPaths,
  fetchDevelopmentActions,
  fetchIntegratedTalentKpis,
  fetchIntegratedTalentRows,
  fetchPerformanceEvaluations,
  fetchPotentialAssessments,
  fetchSuccessionRiskSnapshots,
  fetchTrainingRecommendations,
  computeEmployeeSkillGaps,
} from '@/lib/hr/queries';
import { runHrAutomations, updateDevelopmentActionStatus } from '@/lib/hr/mutations';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRolesDashboard() {
  return useQuery({
    queryKey: ['rolesDashboard'],
    queryFn: fetchRolesDashboard,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidatesForRole(roleId: string | undefined) {
  return useQuery({
    queryKey: ['candidates', roleId],
    queryFn: () => fetchCandidatesForRole(roleId!),
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCandidateDetail(candidateId: string | undefined, roleId?: string) {
  return useQuery({
    queryKey: ['candidate', candidateId, roleId],
    queryFn: () => fetchCandidateById(candidateId!, roleId),
    enabled: !!candidateId,
  });
}

export function useShortlist(roleId: string | undefined) {
  return useQuery({
    queryKey: ['shortlist', roleId],
    queryFn: () => fetchShortlistForRole(roleId!),
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDemoMetrics(roleId: string | undefined) {
  return useQuery({
    queryKey: ['demoMetrics', roleId],
    queryFn: () => fetchDemoMetrics(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillsTaxonomy() {
  return useQuery({
    queryKey: ['skillsTaxonomy'],
    queryFn: fetchSkillsTaxonomy,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillClusters() {
  return useQuery({
    queryKey: ['skillClusters'],
    queryFn: fetchSkillClusters,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillSupplyDemand() {
  return useQuery({
    queryKey: ['skillSupplyDemand'],
    queryFn: fetchSkillSupplyDemand,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEquivalenceGaps() {
  return useQuery({
    queryKey: ['equivalenceGaps'],
    queryFn: fetchEquivalenceGaps,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidateCandidate() {
  const qc = useQueryClient();
  return (roleId?: string, candidateId?: string) => {
    qc.invalidateQueries({ queryKey: ['candidates', roleId] });
    qc.invalidateQueries({ queryKey: ['rolesDashboard'] });
    qc.invalidateQueries({ queryKey: ['shortlist', roleId] });
    if (candidateId) {
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] });
    }
  };
}

export function useAdvanceStage() {
  const invalidate = useInvalidateCandidate();
  return useMutation({
    mutationFn: (args: { candidateId: string; roleId: string; currentStage: string }) =>
      advancePipelineStage(args.candidateId, args.roleId, args.currentStage),
    onSuccess: (_, vars) => invalidate(vars.roleId, vars.candidateId),
  });
}

export function useRejectCandidate() {
  const invalidate = useInvalidateCandidate();
  return useMutation({
    mutationFn: (args: { candidateId: string; roleId: string }) =>
      rejectCandidate(args.candidateId, args.roleId),
    onSuccess: (_, vars) => invalidate(vars.roleId, vars.candidateId),
  });
}

export function useRequestValidation() {
  const invalidate = useInvalidateCandidate();
  return useMutation({
    mutationFn: (args: { candidateId: string; roleId: string }) =>
      requestPanoramaValidation(args.candidateId, args.roleId),
    onSuccess: (_, vars) => invalidate(vars.roleId, vars.candidateId),
  });
}

export function useUpdateNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { candidateId: string; notes: string }) =>
      updateCandidateNotes(args.candidateId, args.notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate', vars.candidateId] });
    },
  });
}

export function useSetValidatedScore() {
  const invalidate = useInvalidateCandidate();
  return useMutation({
    mutationFn: (args: { candidateId: string; roleId: string; score: number }) =>
      setValidatedScore(args.candidateId, args.roleId, args.score),
    onSuccess: (_, vars) => invalidate(vars.roleId, vars.candidateId),
  });
}

export function useHrAdequacy() {
  const invalidate = useInvalidateCandidate();
  return useMutation({
    mutationFn: (args: { candidateId: string; roleId: string; percentage: number }) =>
      setHrAdequacy(args.candidateId, args.roleId, args.percentage),
    onSuccess: (_, vars) => invalidate(vars.roleId, vars.candidateId),
  });
}

export function useAiEvaluation(candidateId: string | undefined, roleId: string | undefined) {
  return useQuery({
    queryKey: ['aiEvaluation', candidateId, roleId],
    queryFn: () => fetchAiEvaluation(candidateId!, roleId!),
    enabled: !!candidateId && !!roleId,
  });
}

export function useSaveAiEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveAiEvaluation,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['aiEvaluation', vars.candidateId, vars.roleId] });
      qc.invalidateQueries({ queryKey: ['candidate', vars.candidateId] });
    },
  });
}

export function useIntegratedTalentRows() {
  return useQuery({
    queryKey: ['hr', 'integratedRows'],
    queryFn: fetchIntegratedTalentRows,
    staleTime: 2 * 60 * 1000,
  });
}

export function useIntegratedTalentKpis() {
  return useQuery({
    queryKey: ['hr', 'kpis'],
    queryFn: fetchIntegratedTalentKpis,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePerformanceEvaluations(cycle?: string) {
  return useQuery({
    queryKey: ['hr', 'evaluations', cycle ?? 'all'],
    queryFn: () => fetchPerformanceEvaluations(cycle),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePotentialAssessments(cycle?: string) {
  return useQuery({
    queryKey: ['hr', 'potential', cycle ?? 'all'],
    queryFn: () => fetchPotentialAssessments(cycle),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBonusObjectives(cycle?: string) {
  return useQuery({
    queryKey: ['hr', 'bonusObjectives', cycle ?? 'all'],
    queryFn: () => fetchBonusObjectives(cycle),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuccessionRiskSnapshots() {
  return useQuery({
    queryKey: ['hr', 'successionRisk'],
    queryFn: fetchSuccessionRiskSnapshots,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDevelopmentActions() {
  return useQuery({
    queryKey: ['hr', 'developmentActions'],
    queryFn: fetchDevelopmentActions,
    staleTime: 30 * 1000,
  });
}

export function useTrainingRecommendations() {
  return useQuery({
    queryKey: ['hr', 'trainingRecommendations'],
    queryFn: fetchTrainingRecommendations,
    staleTime: 60 * 1000,
  });
}

export function useCareerPaths() {
  return useQuery({
    queryKey: ['hr', 'careerPaths'],
    queryFn: fetchCareerPaths,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployeeSkillGaps() {
  return useQuery({
    queryKey: ['hr', 'skillGaps'],
    queryFn: computeEmployeeSkillGaps,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRunHrAutomations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runHrAutomations,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr'] });
    },
  });
}

export function useUpdateDevelopmentActionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { actionId: string; status: 'pending' | 'in_progress' | 'completed' }) =>
      updateDevelopmentActionStatus(args.actionId, args.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'developmentActions'] });
      qc.invalidateQueries({ queryKey: ['hr', 'kpis'] });
    },
  });
}
