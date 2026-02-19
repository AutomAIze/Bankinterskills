import { supabase } from './supabase';
import type { Role, Candidate, CandidateSkill, CandidateStatus, PipelineStage } from '@/data/mockData';

const STATUS_MAP: Record<string, CandidateStatus> = {
  new: 'nuevo',
  recommended: 'recomendado',
  in_pool: 'en_pool',
  rejected: 'descartado',
};

const scaleLevel = (level: number) => Math.round(level * 20);

// ─── Roles ──────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<Role[]> {
  const { data: roles, error: rolesErr } = await supabase
    .from('roles')
    .select('id, name, business_unit, description, positions_count, declarative_weight, scientific_weight');

  if (rolesErr) throw rolesErr;

  const { data: roleSkills, error: rsErr } = await supabase
    .from('role_skills')
    .select('role_id, weight, required_level, skills(name)');

  if (rsErr) throw rsErr;

  return (roles ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.business_unit,
    description: r.description ?? '',
    positionsCount: r.positions_count ?? 1,
    declarativeWeight: Number(r.declarative_weight ?? 0.4),
    scientificWeight: Number(r.scientific_weight ?? 0.6),
    skills: (roleSkills ?? [])
      .filter((rs: any) => rs.role_id === r.id)
      .map((rs: any) => ({
        name: (rs.skills as any).name as string,
        weight: Math.round(rs.weight * 100),
      }))
      .sort((a, b) => b.weight - a.weight),
  }));
}

// ─── Role Dashboard (summary per role for positions overview) ───────

export interface RoleDashboard {
  id: string;
  name: string;
  unit: string;
  description: string;
  positionsCount: number;
  declarativeWeight: number;
  scientificWeight: number;
  totalCandidates: number;
  pipeline: Record<string, number>;
  avgDeclarative: number;
  avgValidated: number | null;
  avgCombined: number;
  avgConfidence: number;
  validatedCount: number;
  validatedPercent: number;
  topCandidate: { name: string; score: number } | null;
  skills: Array<{ name: string; weight: number }>;
}

export async function fetchRolesDashboard(): Promise<RoleDashboard[]> {
  const [rolesRes, rsRes, crRes] = await Promise.all([
    supabase.from('roles').select('id, name, business_unit, description, positions_count, declarative_weight, scientific_weight'),
    supabase.from('role_skills').select('role_id, weight, skills(name)'),
    supabase.from('candidate_roles').select('role_id, declarative_score, validated_score, combined_score, confidence, pipeline_stage, candidates(full_name)'),
  ]);

  if (rolesRes.error) throw rolesRes.error;

  const roles = rolesRes.data ?? [];
  const roleSkills = rsRes.data ?? [];
  const candidateRoles = crRes.data ?? [];

  return roles.map((r) => {
    const crs = candidateRoles.filter((cr: any) => cr.role_id === r.id);
    const validated = crs.filter((cr: any) => cr.validated_score != null);

    const pipeline: Record<string, number> = {};
    for (const cr of crs) {
      const stage = (cr as any).pipeline_stage ?? 'applied';
      pipeline[stage] = (pipeline[stage] ?? 0) + 1;
    }

    const avgDecl = crs.length ? crs.reduce((s, cr: any) => s + Number(cr.declarative_score ?? 0), 0) / crs.length : 0;
    const avgValid = validated.length ? validated.reduce((s, cr: any) => s + Number(cr.validated_score), 0) / validated.length : null;
    const avgCombined = crs.length ? crs.reduce((s, cr: any) => s + Number(cr.combined_score ?? 0), 0) / crs.length : 0;
    const avgConf = crs.length ? crs.reduce((s, cr: any) => s + Number(cr.confidence ?? 0), 0) / crs.length : 0;

    const topCr = crs.sort((a: any, b: any) => Number(b.combined_score ?? 0) - Number(a.combined_score ?? 0))[0] as any;

    return {
      id: r.id,
      name: r.name,
      unit: r.business_unit,
      description: r.description ?? '',
      positionsCount: r.positions_count ?? 1,
      declarativeWeight: Number(r.declarative_weight ?? 0.4),
      scientificWeight: Number(r.scientific_weight ?? 0.6),
      totalCandidates: crs.length,
      pipeline,
      avgDeclarative: Math.round(avgDecl),
      avgValidated: avgValid != null ? Math.round(avgValid) : null,
      avgCombined: Math.round(avgCombined),
      avgConfidence: Math.round(avgConf * 100) / 100,
      validatedCount: validated.length,
      validatedPercent: crs.length ? Math.round((validated.length / crs.length) * 100) : 0,
      topCandidate: topCr ? { name: (topCr.candidates as any)?.full_name ?? '', score: Math.round(Number(topCr.combined_score ?? 0)) } : null,
      skills: (roleSkills ?? [])
        .filter((rs: any) => rs.role_id === r.id)
        .map((rs: any) => ({ name: (rs.skills as any).name as string, weight: Math.round(rs.weight * 100) }))
        .sort((a, b) => b.weight - a.weight),
    };
  });
}

// ─── Candidates for Role ────────────────────────────────────────────

export async function fetchCandidatesForRole(roleId: string): Promise<Candidate[]> {
  const { data: crs, error: crErr } = await supabase
    .from('candidate_roles')
    .select(`
      fit_score,
      status,
      declarative_score,
      validated_score,
      combined_score,
      confidence,
      pipeline_stage,
      candidates(id, full_name),
      role_id
    `)
    .eq('role_id', roleId)
    .order('combined_score', { ascending: false });

  if (crErr) throw crErr;

  const candidateIds = (crs ?? []).map((cr: any) => (cr.candidates as any).id as string);
  if (candidateIds.length === 0) return [];

  const { data: csRows, error: csErr } = await supabase
    .from('candidate_skills')
    .select('candidate_id, level, skills(name)')
    .in('candidate_id', candidateIds);

  if (csErr) throw csErr;

  const { data: rsRows, error: rsErr } = await supabase
    .from('role_skills')
    .select('skill_id, weight, required_level, skills(name)')
    .eq('role_id', roleId);

  if (rsErr) throw rsErr;

  const roleSkillMap = new Map<string, { weight: number; required_level: number }>();
  for (const rs of rsRows ?? []) {
    roleSkillMap.set((rs.skills as any).name, {
      weight: Math.round(rs.weight * 100),
      required_level: scaleLevel(rs.required_level),
    });
  }

  return (crs ?? []).map((cr: any) => {
    const cand = cr.candidates as any;
    const candidateSkills = (csRows ?? [])
      .filter((cs: any) => cs.candidate_id === cand.id)
      .map((cs: any) => {
        const skillName = (cs.skills as any).name as string;
        const roleSkill = roleSkillMap.get(skillName);
        return {
          name: skillName,
          level: scaleLevel(cs.level),
          expected: roleSkill?.required_level ?? 0,
        } satisfies CandidateSkill;
      })
      .filter((cs) => roleSkillMap.has(cs.name))
      .sort((a, b) => {
        const wa = roleSkillMap.get(a.name)?.weight ?? 0;
        const wb = roleSkillMap.get(b.name)?.weight ?? 0;
        return wb - wa;
      });

    return {
      id: cand.id,
      name: cand.full_name,
      roleId,
      globalScore: Math.round(Number(cr.combined_score ?? cr.fit_score)),
      declarativeScore: Math.round(Number(cr.declarative_score ?? cr.fit_score)),
      validatedScore: cr.validated_score != null ? Math.round(Number(cr.validated_score)) : null,
      combinedScore: Math.round(Number(cr.combined_score ?? cr.fit_score)),
      confidence: Number(cr.confidence ?? 0.3),
      pipelineStage: (cr.pipeline_stage ?? 'applied') as PipelineStage,
      skills: candidateSkills,
      status: STATUS_MAP[cr.status] ?? 'nuevo',
    } satisfies Candidate;
  });
}

// ─── Candidate Detail ───────────────────────────────────────────────

export async function fetchCandidateById(
  candidateId: string,
  roleId?: string
): Promise<{ candidate: Candidate; role: Role } | null> {
  const { data: cand, error: candErr } = await supabase
    .from('candidates')
    .select('id, full_name')
    .eq('id', candidateId)
    .single();

  if (candErr || !cand) return null;

  const crQuery = supabase
    .from('candidate_roles')
    .select('role_id, fit_score, status, declarative_score, validated_score, combined_score, confidence, pipeline_stage')
    .eq('candidate_id', candidateId);

  if (roleId) crQuery.eq('role_id', roleId);

  const { data: crs, error: crErr } = await crQuery.limit(1).single();
  if (crErr || !crs) return null;

  const effectiveRoleId = crs.role_id;

  const [rolesRes, csRes, rsRes] = await Promise.all([
    supabase.from('roles').select('id, name, business_unit, description, positions_count, declarative_weight, scientific_weight').eq('id', effectiveRoleId).single(),
    supabase.from('candidate_skills').select('level, skills(name)').eq('candidate_id', candidateId),
    supabase.from('role_skills').select('weight, required_level, skills(name)').eq('role_id', effectiveRoleId),
  ]);

  if (rolesRes.error || !rolesRes.data) return null;

  const roleSkillMap = new Map<string, { weight: number; required_level: number }>();
  for (const rs of rsRes.data ?? []) {
    roleSkillMap.set((rs.skills as any).name, {
      weight: Math.round(rs.weight * 100),
      required_level: scaleLevel(rs.required_level),
    });
  }

  const candidateSkills: CandidateSkill[] = (csRes.data ?? [])
    .map((cs: any) => {
      const skillName = (cs.skills as any).name as string;
      const roleSkill = roleSkillMap.get(skillName);
      return { name: skillName, level: scaleLevel(cs.level), expected: roleSkill?.required_level ?? 0 };
    })
    .filter((cs) => roleSkillMap.has(cs.name))
    .sort((a, b) => {
      const wa = roleSkillMap.get(a.name)?.weight ?? 0;
      const wb = roleSkillMap.get(b.name)?.weight ?? 0;
      return wb - wa;
    });

  const rd = rolesRes.data;
  const role: Role = {
    id: rd.id,
    name: rd.name,
    unit: rd.business_unit,
    description: rd.description ?? '',
    positionsCount: rd.positions_count ?? 1,
    declarativeWeight: Number(rd.declarative_weight ?? 0.4),
    scientificWeight: Number(rd.scientific_weight ?? 0.6),
    skills: (rsRes.data ?? [])
      .map((rs: any) => ({ name: (rs.skills as any).name as string, weight: Math.round(rs.weight * 100) }))
      .sort((a, b) => b.weight - a.weight),
  };

  const candidate: Candidate = {
    id: cand.id,
    name: cand.full_name,
    roleId: effectiveRoleId,
    globalScore: Math.round(Number(crs.combined_score ?? crs.fit_score)),
    declarativeScore: Math.round(Number(crs.declarative_score ?? crs.fit_score)),
    validatedScore: crs.validated_score != null ? Math.round(Number(crs.validated_score)) : null,
    combinedScore: Math.round(Number(crs.combined_score ?? crs.fit_score)),
    confidence: Number(crs.confidence ?? 0.3),
    pipelineStage: (crs.pipeline_stage ?? 'applied') as PipelineStage,
    skills: candidateSkills,
    status: STATUS_MAP[crs.status] ?? 'nuevo',
  };

  return { candidate, role };
}

// ─── Demo Metrics ───────────────────────────────────────────────────

export interface DemoMetrics {
  roleId: string;
  roleName: string;
  hoursSaved: number;
  shortlistPrecisionGain: number;
  irrelevantInterviewsReduction: number;
}

export async function fetchDemoMetrics(roleId: string): Promise<DemoMetrics | null> {
  const { data, error } = await supabase
    .from('demo_metrics')
    .select('hours_saved, shortlist_precision_gain, irrelevant_interviews_reduction, roles(name)')
    .eq('role_id', roleId)
    .single();

  if (error || !data) return null;

  return {
    roleId,
    roleName: (data.roles as any).name,
    hoursSaved: Number(data.hours_saved),
    shortlistPrecisionGain: Number(data.shortlist_precision_gain),
    irrelevantInterviewsReduction: Number(data.irrelevant_interviews_reduction),
  };
}

// ─── Shortlist ──────────────────────────────────────────────────────

export interface ShortlistCandidate {
  id: string;
  name: string;
  currentPosition: string;
  notes: string;
  roleId: string;
  roleName: string;
  globalScore: number;
  declarativeScore: number;
  validatedScore: number | null;
  combinedScore: number;
  confidence: number;
  pipelineStage: PipelineStage;
  status: string;
  skills: Array<{ name: string; level: number; expected: number; weight: number; gap: number }>;
  strengths: string[];
  gaps: string[];
  recommendation: 'hire' | 'potential' | 'pass';
}

export async function fetchShortlistForRole(roleId: string): Promise<ShortlistCandidate[]> {
  const { data: crs, error: crErr } = await supabase
    .from('candidate_roles')
    .select(`
      fit_score, status,
      declarative_score, validated_score, combined_score, confidence, pipeline_stage,
      candidates(id, full_name, current_position, notes),
      role_id, roles(name)
    `)
    .eq('role_id', roleId)
    .gte('combined_score', 55)
    .order('combined_score', { ascending: false })
    .limit(12);

  if (crErr) throw crErr;
  if (!crs || crs.length === 0) return [];

  const candidateIds = (crs ?? []).map((cr: any) => (cr.candidates as any).id as string);

  const [csRes, rsRes] = await Promise.all([
    supabase.from('candidate_skills').select('candidate_id, level, skills(name)').in('candidate_id', candidateIds),
    supabase.from('role_skills').select('skill_id, weight, required_level, skills(name)').eq('role_id', roleId),
  ]);

  if (csRes.error) throw csRes.error;
  if (rsRes.error) throw rsRes.error;

  const roleSkillMap = new Map<string, { weight: number; required_level: number }>();
  for (const rs of rsRes.data ?? []) {
    roleSkillMap.set((rs.skills as any).name, { weight: Math.round(rs.weight * 100), required_level: scaleLevel(rs.required_level) });
  }

  return (crs ?? []).map((cr: any) => {
    const cand = cr.candidates as any;
    const roleName = (cr.roles as any)?.name ?? '';

    const skills = (csRes.data ?? [])
      .filter((cs: any) => cs.candidate_id === cand.id)
      .map((cs: any) => {
        const skillName = (cs.skills as any).name as string;
        const roleSkill = roleSkillMap.get(skillName);
        const level = scaleLevel(cs.level);
        const expected = roleSkill?.required_level ?? 0;
        return { name: skillName, level, expected, weight: roleSkill?.weight ?? 0, gap: level - expected };
      })
      .filter((cs) => roleSkillMap.has(cs.name))
      .sort((a, b) => b.weight - a.weight);

    const strengths = skills.filter((s) => s.gap >= 0).map((s) => s.name);
    const gaps = skills.filter((s) => s.gap < -10).map((s) => s.name);
    const score = Math.round(Number(cr.combined_score ?? cr.fit_score));
    const conf = Number(cr.confidence ?? 0.3);
    const hasValidation = cr.validated_score != null;

    const recommendation: 'hire' | 'potential' | 'pass' =
      score >= 80 && conf >= 0.7 ? 'hire' :
      score >= 60 ? 'potential' : 'pass';

    return {
      id: cand.id,
      name: cand.full_name,
      currentPosition: cand.current_position ?? '',
      notes: cand.notes ?? '',
      roleId,
      roleName,
      globalScore: score,
      declarativeScore: Math.round(Number(cr.declarative_score ?? cr.fit_score)),
      validatedScore: cr.validated_score != null ? Math.round(Number(cr.validated_score)) : null,
      combinedScore: score,
      confidence: conf,
      pipelineStage: (cr.pipeline_stage ?? 'applied') as PipelineStage,
      status: STATUS_MAP[cr.status] ?? 'nuevo',
      skills,
      strengths,
      gaps,
      recommendation,
    };
  });
}

// ─── Skills Taxonomy & Intelligence (unchanged) ─────────────────────

export interface TaxonomySkill {
  id: string;
  name: string;
  source: string;
  skillType: string;
  reusabilityLevel: string;
  category: string;
  subcategory: string;
  description: string;
  escoUri: string | null;
  isEmerging: boolean;
  aliases: Array<{ name: string; source: string; confidence: number }>;
  adjacentSkills: Array<{ id: string; name: string; similarity: number }>;
  clusterName: string | null;
  roleCount: number;
  candidateCount: number;
}

export async function fetchSkillsTaxonomy(): Promise<TaxonomySkill[]> {
  const [skillsRes, aliasesRes, adjRes, clusterRes, roleSkillsRes, candSkillsRes] = await Promise.all([
    supabase.from('skills').select('*'),
    supabase.from('skill_aliases').select('skill_id, alias_name, alias_source, confidence'),
    supabase.from('skill_adjacency').select('skill_id_a, skill_id_b, similarity'),
    supabase.from('skill_cluster_members').select('skill_id, skill_clusters(name)'),
    supabase.from('role_skills').select('skill_id'),
    supabase.from('candidate_skills').select('skill_id, candidate_id'),
  ]);

  if (skillsRes.error) throw skillsRes.error;

  const skills = skillsRes.data ?? [];
  const aliases = aliasesRes.data ?? [];
  const adj = adjRes.data ?? [];
  const clusterMap = new Map<string, string>();
  for (const cm of clusterRes.data ?? []) clusterMap.set(cm.skill_id, (cm.skill_clusters as any)?.name ?? '');

  const roleCountMap = new Map<string, number>();
  for (const rs of roleSkillsRes.data ?? []) roleCountMap.set(rs.skill_id, (roleCountMap.get(rs.skill_id) ?? 0) + 1);

  const candCountMap = new Map<string, Set<string>>();
  for (const cs of candSkillsRes.data ?? []) {
    if (!candCountMap.has(cs.skill_id)) candCountMap.set(cs.skill_id, new Set());
    candCountMap.get(cs.skill_id)!.add(cs.candidate_id);
  }

  const skillNameMap = new Map<string, string>();
  for (const s of skills) skillNameMap.set(s.id, s.name);

  return skills.map((s: any) => {
    const skillAliases = aliases
      .filter((a: any) => a.skill_id === s.id)
      .map((a: any) => ({ name: a.alias_name, source: a.alias_source, confidence: Number(a.confidence) }))
      .sort((a, b) => b.confidence - a.confidence);

    const adjacent: Array<{ id: string; name: string; similarity: number }> = [];
    for (const a of adj) {
      if ((a as any).skill_id_a === s.id) adjacent.push({ id: (a as any).skill_id_b, name: skillNameMap.get((a as any).skill_id_b) ?? '', similarity: Number((a as any).similarity) });
      else if ((a as any).skill_id_b === s.id) adjacent.push({ id: (a as any).skill_id_a, name: skillNameMap.get((a as any).skill_id_a) ?? '', similarity: Number((a as any).similarity) });
    }
    adjacent.sort((a, b) => b.similarity - a.similarity);

    return {
      id: s.id, name: s.name, source: s.source,
      skillType: s.skill_type ?? 'competence', reusabilityLevel: s.reusability_level ?? 'sector_specific',
      category: s.category ?? '', subcategory: s.subcategory ?? '', description: s.description ?? '',
      escoUri: s.esco_uri ?? null, isEmerging: s.is_emerging ?? false,
      aliases: skillAliases, adjacentSkills: adjacent,
      clusterName: clusterMap.get(s.id) ?? null,
      roleCount: roleCountMap.get(s.id) ?? 0, candidateCount: candCountMap.get(s.id)?.size ?? 0,
    };
  });
}

export interface SkillCluster {
  id: string;
  name: string;
  description: string;
  color: string;
  skills: Array<{ id: string; name: string; candidateCount: number }>;
}

export async function fetchSkillClusters(): Promise<SkillCluster[]> {
  const [clustersRes, membersRes, candSkillsRes] = await Promise.all([
    supabase.from('skill_clusters').select('*'),
    supabase.from('skill_cluster_members').select('cluster_id, skill_id, skills(id, name)'),
    supabase.from('candidate_skills').select('skill_id, candidate_id'),
  ]);

  if (clustersRes.error) throw clustersRes.error;

  const candCountMap = new Map<string, number>();
  for (const cs of candSkillsRes.data ?? []) candCountMap.set(cs.skill_id, (candCountMap.get(cs.skill_id) ?? 0) + 1);

  return (clustersRes.data ?? []).map((c: any) => ({
    id: c.id, name: c.name, description: c.description ?? '', color: c.color ?? '#003DA5',
    skills: (membersRes.data ?? [])
      .filter((m: any) => m.cluster_id === c.id)
      .map((m: any) => ({ id: (m.skills as any).id, name: (m.skills as any).name, candidateCount: candCountMap.get((m.skills as any).id) ?? 0 })),
  }));
}

export interface SkillSupplyDemand {
  skillId: string;
  skillName: string;
  category: string;
  supply: number;
  demand: number;
  gap: number;
  avgLevel: number;
}

export async function fetchSkillSupplyDemand(): Promise<SkillSupplyDemand[]> {
  const [skillsRes, roleSkillsRes, candSkillsRes] = await Promise.all([
    supabase.from('skills').select('id, name, category'),
    supabase.from('role_skills').select('skill_id'),
    supabase.from('candidate_skills').select('skill_id, level'),
  ]);

  if (skillsRes.error) throw skillsRes.error;

  const demandMap = new Map<string, number>();
  for (const rs of roleSkillsRes.data ?? []) demandMap.set(rs.skill_id, (demandMap.get(rs.skill_id) ?? 0) + 1);

  const supplyMap = new Map<string, { count: number; totalLevel: number }>();
  for (const cs of candSkillsRes.data ?? []) {
    const cur = supplyMap.get(cs.skill_id) ?? { count: 0, totalLevel: 0 };
    cur.count++;
    cur.totalLevel += cs.level;
    supplyMap.set(cs.skill_id, cur);
  }

  return (skillsRes.data ?? []).map((s: any) => {
    const sup = supplyMap.get(s.id);
    return {
      skillId: s.id, skillName: s.name, category: s.category ?? '',
      supply: sup?.count ?? 0, demand: demandMap.get(s.id) ?? 0,
      gap: (sup?.count ?? 0) - (demandMap.get(s.id) ?? 0),
      avgLevel: sup ? Math.round((sup.totalLevel / sup.count) * 20) : 0,
    };
  });
}
