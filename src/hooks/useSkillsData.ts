import { useQuery } from '@tanstack/react-query';
import {
  fetchRoles, fetchCandidatesForRole, fetchCandidateById, fetchDemoMetrics,
  fetchShortlistForRole, fetchSkillsTaxonomy, fetchSkillClusters, fetchSkillSupplyDemand,
  fetchRolesDashboard,
} from '@/lib/queries';

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
