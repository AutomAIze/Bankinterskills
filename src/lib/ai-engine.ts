import { supabase } from './supabase';

interface ChatContext {
  roleId?: string;
  candidateId?: string;
}

export interface ResponseMeta {
  roleId?: string;
  roleName?: string;
  candidates?: { id: string; name: string; score: number; stage: string }[];
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function profileLink(name: string, candidateId: string, roleId: string): string {
  return `[${name}](/candidato/${candidateId}?role=${roleId})`;
}

const DIM_LABELS: Record<string, string> = {
  hard_technical: 'Hard Skill Técnica',
  hard_regulatory: 'Hard Skill Regulatoria',
  soft_interpersonal: 'Soft Skill Interpersonal',
  soft_cognitive: 'Soft Skill Cognitiva',
  soft_leadership: 'Soft Skill Liderazgo',
  digital: 'Competencia Digital',
};

const TIER_LABELS: Record<string, string> = {
  foundational: 'Básico',
  standard: 'Estándar',
  advanced: 'Avanzado',
  strategic: 'Estratégico',
};

const PROFICIENCY: Record<number, string> = {
  1: 'Básico',
  2: 'Intermedio',
  3: 'Avanzado',
  4: 'Experto',
  5: 'Referente',
};

const GROWTH_LABELS: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  very_high: 'Muy Alto',
};

const RISK_LABELS: Record<string, string> = {
  overqualified: 'Sobrecualificado',
  standard: 'Estándar',
  stretch: 'Stretch',
  high_risk: 'Riesgo alto',
};

export interface GenerateResult {
  text: string;
  meta?: ResponseMeta;
}

export async function generateResponse(
  question: string,
  context: ChatContext
): Promise<GenerateResult> {
  const q = normalize(question);

  // RRHH 360 intents (global)
  if (matchesIntent(q, ['cuadro de mando', 'talento 360', 'vision integrada', 'vision completa', 'trayectoria', 'rrhh'])) {
    return wrap(await integratedTalentResponse());
  }
  if (matchesIntent(q, ['formacion', 'formación', 'upskilling', 'reskilling', 'plan de desarrollo', 'recomendacion formativa'])) {
    return wrap(await trainingRecommendationsResponse());
  }
  if (matchesIntent(q, ['objetivo', 'bonus', 'm50', 'on track', 'at risk'])) {
    return wrap(await bonusObjectivesResponse());
  }
  if (matchesIntent(q, ['sucesion', 'sucesorio', 'sucesoria', 'riesgo sucesorio', 'bench', 'readiness'])) {
    return wrap(await successionRiskResponse());
  }
  if (matchesIntent(q, ['trayectoria profesional', 'trayectorias', 'career path', 'movilidad'])) {
    return wrap(await careerPathsResponse());
  }
  if (matchesIntent(q, ['accion automatica', 'automatizacion', 'automatizaciones', 'acciones pendientes', 'workflow'])) {
    return wrap(await automationStatusResponse());
  }
  if (matchesIntent(q, ['desempeno', 'desempeño', 'potencial', 'high potential', '9box'])) {
    return wrap(await performancePotentialResponse());
  }

  const { data: roles } = await supabase
    .from('roles')
    .select('id, name, business_unit, description, positions_count, declarative_weight, scientific_weight');

  const allRoles = roles ?? [];
  const matchedRole = findMatchedRole(q, allRoles);
  const effectiveRoleId = matchedRole?.id ?? context.roleId;

  if (effectiveRoleId) {
    if (matchesIntent(q, ['inteligencia', 'dimension', 'eq', 'iq', 'dq', 'cociente', 'perfil inteligencia', 'soft skill', 'hard skill', 'tipo de inteligencia'])) {
      return wrap(await intelligenceProfileResponse(effectiveRoleId, allRoles));
    }
    if (matchesIntent(q, ['compara', 'comparar', 'comparativa', 'diferencia', 'versus', 'vs'])) {
      return await compareCandidatesWithMeta(effectiveRoleId, allRoles);
    }
    if (matchesIntent(q, ['gap', 'gaps', 'carencia', 'debilidad', 'falta', 'mejorar', 'formacion'])) {
      return wrap(await gapsResponse(effectiveRoleId, allRoles));
    }
    if (matchesIntent(q, ['pipeline', 'fase', 'etapa', 'funnel', 'estado del', 'como esta', 'como van'])) {
      return wrap(await pipelineResponse(effectiveRoleId, allRoles));
    }
    if (matchesIntent(q, ['confianza', 'validacion', 'validado', 'panorama', 'cientifico', 'declarativo', 'scoring', 'cobertura'])) {
      return wrap(await confidenceResponse(effectiveRoleId, allRoles));
    }
    if (matchesIntent(q, ['skill', 'competencia', 'modelo de skill', 'peso', 'que necesita', 'que requiere', 'requisitos', 'taxonomia'])) {
      return wrap(await skillModelResponse(effectiveRoleId, allRoles));
    }
    return await searchCandidatesWithMeta(effectiveRoleId, allRoles);
  }

  if (matchesIntent(q, ['inteligencia', 'dimension', 'eq', 'iq', 'dq', 'cociente', 'soft skill', 'hard skill', 'tipo de inteligencia'])) {
    return wrap(await globalIntelligenceOverview(allRoles));
  }

  if (matchesIntent(q, ['mejor', 'top', 'quien', 'recomiend', 'recomendado', 'perfil', 'perfiles', 'candidato ideal', 'resumen', 'todas las posiciones', 'todos los roles', 'general'])) {
    return wrap(await allRolesOverview(allRoles));
  }

  if (matchesIntent(q, ['compara', 'comparar', 'comparativa'])) {
    return wrap(await allRolesOverview(allRoles));
  }

  if (matchesIntent(q, ['gap', 'gaps', 'carencia', 'critico'])) {
    return wrap(await gapsResponse(undefined, allRoles));
  }

  if (matchesIntent(q, ['hora', 'ahorro', 'ahorra', 'eficiencia', 'metrica', 'insight', 'precision', 'entrevista irrelevant'])) {
    return wrap(await metricsResponse());
  }

  if (matchesIntent(q, ['pipeline', 'fase', 'etapa', 'funnel', 'estado'])) {
    return wrap(await pipelineResponse(undefined, allRoles));
  }

  if (matchesIntent(q, ['pendiente', 'sin validar', 'urgente', 'panorama', 'validacion'])) {
    return wrap(await pendingValidationResponse(allRoles));
  }

  if (matchesIntent(q, ['rol', 'roles', 'puesto', 'posicion', 'posiciones', 'vacante', 'oferta', 'ofertas', 'que hay abierto'])) {
    return wrap(await rolesOverviewResponse(allRoles));
  }

  if (matchesIntent(q, ['skill', 'competencia', 'modelo', 'taxonomia'])) {
    return wrap(await skillModelResponse(undefined, allRoles));
  }

  if (matchesIntent(q, ['cuantos candidatos', 'listado', 'ranking', 'pool'])) {
    return wrap(await poolResponse(undefined, allRoles));
  }

  return wrap(await generalResponse(allRoles));
}

function wrap(text: string): GenerateResult {
  return { text };
}

function matchesIntent(q: string, keywords: string[]): boolean {
  return keywords.some((kw) => q.includes(kw));
}

function findMatchedRole(q: string, roles: any[]): any | null {
  for (const role of roles) {
    const rn = normalize(role.name);
    if (q.includes(rn)) return role;
  }

  for (const role of roles) {
    const rn = normalize(role.name);
    const words = rn.split(/\s+/).filter((w: string) => w.length > 3);
    const matchCount = words.filter((w: string) => q.includes(w)).length;
    if (matchCount >= 2 || (words.length <= 2 && matchCount >= 1)) return role;
  }

  const aliases: Array<{ keywords: string[]; match: (name: string) => boolean }> = [
    { keywords: ['venta', 'ventas', 'comercial', 'fuerza comercial'], match: (n) => n.includes('venta') || n.includes('comercial') },
    { keywords: ['riesgo', 'credito', 'analisis riesgo', 'riesgo credito'], match: (n) => n.includes('riesgo') },
    { keywords: ['estrategia', 'estrategico', 'estrategica', 'negocio estrateg'], match: (n) => n.includes('estrategia') && !n.includes('diseno') },
    { keywords: ['diseno', 'modelo', 'modelos', 'diseno de modelos', 'modelizacion'], match: (n) => n.includes('diseno') || n.includes('modelo') },
    { keywords: ['servicio', 'operativo', 'operacion', 'soporte', 'operaciones', 'operativos'], match: (n) => n.includes('operativo') || n.includes('soporte') },
  ];

  for (const alias of aliases) {
    if (alias.keywords.some((kw) => q.includes(kw))) {
      const found = roles.find((r) => alias.match(normalize(r.name)));
      if (found) return found;
    }
  }

  return null;
}

// ─── Search candidates (primary response) ───────────────────────────

async function searchCandidatesResponse(roleId: string, allRoles: any[]): Promise<string> {
  const role = allRoles.find((r) => r.id === roleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('declarative_score, validated_score, combined_score, confidence, pipeline_stage, status, candidates(id, full_name, current_position, notes)')
    .eq('role_id', roleId)
    .order('combined_score', { ascending: false });

  if (!crs?.length) return `No se encontraron candidatos para **${role?.name ?? 'este rol'}**.`;

  const candidateIds = crs.map((cr: any) => (cr.candidates as any).id);

  const [dimRes, rdwRes] = await Promise.all([
    supabase.from('candidate_dimensions').select('*').in('candidate_id', candidateIds).eq('role_id', roleId),
    supabase.from('role_dimension_weights').select('*').eq('role_id', roleId).single(),
  ]);

  const dimensions = dimRes.data ?? [];
  const roleWeights = rdwRes.data;
  const positions = role?.positions_count ?? 1;

  let resp = `## ${role?.name ?? 'Posición'}\n`;
  resp += `${role?.business_unit ?? ''} · **${positions} posicion${positions > 1 ? 'es' : ''}** · ${crs.length} candidatos encontrados\n\n`;

  if (roleWeights) {
    resp += '### Perfil de inteligencia del rol\n\n';
    resp += '| IQ (Cognitiva) | EQ (Emocional) | DQ (Digital) | BQ (Negocio) | AQ (Adaptabilidad) |\n';
    resp += '|---|---|---|---|---|\n';
    resp += `| ${Math.round(Number(roleWeights.cognitive_weight) * 100)}% | ${Math.round(Number(roleWeights.emotional_weight) * 100)}% | ${Math.round(Number(roleWeights.digital_weight) * 100)}% | ${Math.round(Number(roleWeights.business_weight) * 100)}% | ${Math.round(Number(roleWeights.adaptability_weight) * 100)}% |\n\n`;
  }

  resp += '### Candidatos\n\n';
  resp += '| # | Candidato | Puesto actual | Score | CV | Panorama | IQ | EQ | DQ | BQ | AQ | Fase | Perfil |\n';
  resp += '|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';

  for (let i = 0; i < crs.length; i++) {
    const cr = crs[i] as any;
    const c = cr.candidates as any;
    const combined = Math.round(Number(cr.combined_score ?? 0));
    const decl = Math.round(Number(cr.declarative_score ?? 0));
    const val = cr.validated_score != null ? String(Math.round(Number(cr.validated_score))) : '—';
    const dim = dimensions.find((d: any) => d.candidate_id === c.id);
    const iq = dim ? Math.round(Number(dim.cognitive_iq)) : '—';
    const eq = dim ? Math.round(Number(dim.emotional_eq)) : '—';
    const dq = dim ? Math.round(Number(dim.digital_dq)) : '—';
    const bq = dim ? Math.round(Number(dim.business_bq)) : '—';
    const aq = dim ? Math.round(Number(dim.adaptability_aq)) : '—';
    const stage = stageLabel(cr.pipeline_stage);
    const link = `[Ver →](/candidato/${c.id}?role=${roleId})`;
    resp += `| ${i + 1} | **${c.full_name}** | ${c.current_position ?? '—'} | **${combined}** | ${decl} | ${val} | ${iq} | ${eq} | ${dq} | ${bq} | ${aq} | ${stage} | ${link} |\n`;
  }

  const unvalidated = crs.filter((cr: any) => cr.validated_score == null).length;
  if (unvalidated > 0) {
    resp += `\n*${unvalidated} de ${crs.length} candidatos sin validacion Panorama. Los scores de inteligencia sin validar son estimaciones.*`;
  }

  return resp;
}

async function searchCandidatesWithMeta(roleId: string, allRoles: any[]): Promise<GenerateResult> {
  const text = await searchCandidatesResponse(roleId, allRoles);
  const role = allRoles.find((r) => r.id === roleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('combined_score, pipeline_stage, candidates(id, full_name)')
    .eq('role_id', roleId)
    .order('combined_score', { ascending: false });

  const candidates = (crs ?? []).map((cr: any) => ({
    id: (cr.candidates as any).id,
    name: (cr.candidates as any).full_name,
    score: Math.round(Number(cr.combined_score ?? 0)),
    stage: cr.pipeline_stage ?? 'applied',
  }));

  return {
    text,
    meta: { roleId, roleName: role?.name, candidates },
  };
}

async function compareCandidatesWithMeta(roleId: string, allRoles: any[]): Promise<GenerateResult> {
  const text = await compareCandidatesResponse(roleId, allRoles);
  const role = allRoles.find((r) => r.id === roleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('combined_score, pipeline_stage, candidates(id, full_name)')
    .eq('role_id', roleId)
    .not('pipeline_stage', 'eq', 'rejected')
    .order('combined_score', { ascending: false })
    .limit(6);

  const candidates = (crs ?? []).map((cr: any) => ({
    id: (cr.candidates as any).id,
    name: (cr.candidates as any).full_name,
    score: Math.round(Number(cr.combined_score ?? 0)),
    stage: cr.pipeline_stage ?? 'applied',
  }));

  return {
    text,
    meta: { roleId, roleName: role?.name, candidates },
  };
}

// ─── Intelligence Profile ───────────────────────────────────────────

async function intelligenceProfileResponse(roleId: string, allRoles: any[]): Promise<string> {
  const role = allRoles.find((r) => r.id === roleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('combined_score, confidence, pipeline_stage, candidates(id, full_name, current_position)')
    .eq('role_id', roleId)
    .not('pipeline_stage', 'eq', 'rejected')
    .order('combined_score', { ascending: false });

  if (!crs?.length) return `No se encontraron candidatos para **${role?.name}**.`;

  const candidateIds = crs.map((cr: any) => (cr.candidates as any).id);

  const [dimRes, rdwRes, rsRes] = await Promise.all([
    supabase.from('candidate_dimensions').select('*').in('candidate_id', candidateIds).eq('role_id', roleId),
    supabase.from('role_dimension_weights').select('*').eq('role_id', roleId).single(),
    supabase.from('role_skills').select('weight, required_level, skills(name, hr_dimension, skill_type, complexity_tier)').eq('role_id', roleId).order('weight', { ascending: false }),
  ]);

  const dimensions = dimRes.data ?? [];
  const roleWeights = rdwRes.data;
  const roleSkills = rsRes.data ?? [];

  let resp = `## Perfil de inteligencia: ${role?.name}\n\n`;

  if (roleWeights) {
    resp += '### Pesos por dimension\n\n';
    resp += '| IQ (Cognitiva) | EQ (Emocional) | DQ (Digital) | BQ (Negocio) | AQ (Adaptabilidad) |\n';
    resp += '|---|---|---|---|---|\n';
    resp += `| ${Math.round(Number(roleWeights.cognitive_weight) * 100)}% | ${Math.round(Number(roleWeights.emotional_weight) * 100)}% | ${Math.round(Number(roleWeights.digital_weight) * 100)}% | ${Math.round(Number(roleWeights.business_weight) * 100)}% | ${Math.round(Number(roleWeights.adaptability_weight) * 100)}% |\n\n`;
  }

  // Skills taxonomy
  const byDim: Record<string, string[]> = {};
  for (const rs of roleSkills) {
    const s = rs.skills as any;
    const dim = s.hr_dimension ?? 'hard_technical';
    if (!byDim[dim]) byDim[dim] = [];
    byDim[dim].push(s.name);
  }

  resp += '### Skills por dimension\n\n';
  for (const [dim, skills] of Object.entries(byDim).sort((a, b) => b[1].length - a[1].length)) {
    resp += `- **${DIM_LABELS[dim] ?? dim}** (${skills.length}): ${skills.join(', ')}\n`;
  }

  resp += '\n### Datos por candidato\n\n';
  resp += '| Candidato | IQ | EQ | DQ | BQ | AQ | Fit cultural | Potencial | Riesgo | Fuente | Perfil |\n';
  resp += '|---|---|---|---|---|---|---|---|---|---|---|\n';

  for (const cr of crs) {
    const c = (cr.candidates as any);
    const dim = dimensions.find((d: any) => d.candidate_id === c.id);
    if (!dim) continue;
    const link = `[Ver →](/candidato/${c.id}?role=${roleId})`;
    const src = dim.source === 'panorama' ? 'Panorama' : 'Estimado';
    resp += `| **${c.full_name}** | ${Math.round(Number(dim.cognitive_iq))} | ${Math.round(Number(dim.emotional_eq))} | ${Math.round(Number(dim.digital_dq))} | ${Math.round(Number(dim.business_bq))} | ${Math.round(Number(dim.adaptability_aq))} | ${Math.round(Number(dim.cultural_fit))}% | ${GROWTH_LABELS[dim.growth_potential] ?? '—'} | ${RISK_LABELS[dim.risk_profile] ?? '—'} | ${src} | ${link} |\n`;
  }

  if (dimensions.length >= 2) {
    const avg = (key: string) => Math.round(dimensions.reduce((s: number, d: any) => s + Number(d[key]), 0) / dimensions.length);
    resp += `\n**Medias del pool:** IQ ${avg('cognitive_iq')} · EQ ${avg('emotional_eq')} · DQ ${avg('digital_dq')} · BQ ${avg('business_bq')} · AQ ${avg('adaptability_aq')}`;
  }

  return resp;
}

// ─── Global Intelligence Overview ───────────────────────────────────

async function globalIntelligenceOverview(allRoles: any[]): Promise<string> {
  let resp = '## Modelo de inteligencia del sistema\n\n';
  resp += 'El sistema mide **5 dimensiones de inteligencia** combinando datos declarativos (CV/LinkedIn) con datos cientificos (Panorama).\n\n';

  resp += '### Dimensiones\n\n';
  resp += '| Dimension | Codigo | Que mide | Fuentes |\n';
  resp += '|---|---|---|---|\n';
  resp += '| **Inteligencia Cognitiva** | IQ | Razonamiento analítico, problem-solving | Skills cognitivas + Panorama |\n';
  resp += '| **Inteligencia Emocional** | EQ | Negociación, gestión de conflictos, comunicación | Skills interpersonales + Panorama |\n';
  resp += '| **Inteligencia Digital** | DQ | Análisis de datos, herramientas digitales | Skills digitales + certificaciones |\n';
  resp += '| **Acumen de Negocio** | BQ | Conocimiento sectorial, productos financieros | Skills técnicas + regulatorias |\n';
  resp += '| **Adaptabilidad** | AQ | Agilidad de aprendizaje, gestión del cambio | Skills transversales + delta Panorama |\n';

  resp += '\n### Clasificacion de skills\n\n';
  resp += '| Tipo HR | Descripcion |\n';
  resp += '|---|---|\n';
  resp += '| **Hard Skill Técnica** | Conocimientos específicos del sector bancario |\n';
  resp += '| **Hard Skill Regulatoria** | Normativa, compliance, certificaciones |\n';
  resp += '| **Soft Skill Interpersonal** | Habilidades de relación y comunicación |\n';
  resp += '| **Soft Skill Cognitiva** | Pensamiento analítico y estratégico |\n';
  resp += '| **Soft Skill Liderazgo** | Gestión, gobierno, influencia |\n';
  resp += '| **Competencia Digital** | Herramientas digitales y datos |\n';

  resp += '\n### Niveles de competencia\n\n';
  resp += 'Básico (1) → Intermedio (2) → Avanzado (3) → Experto (4) → Referente (5)\n\n';

  resp += '### Pesos por posicion\n\n';
  const { data: rdw } = await supabase.from('role_dimension_weights').select('*, roles(name)');

  if (rdw?.length) {
    resp += '| Posicion | IQ | EQ | DQ | BQ | AQ |\n';
    resp += '|---|---|---|---|---|---|\n';
    for (const r of rdw) {
      resp += `| **${(r.roles as any).name}** | ${Math.round(Number(r.cognitive_weight) * 100)}% | ${Math.round(Number(r.emotional_weight) * 100)}% | ${Math.round(Number(r.digital_weight) * 100)}% | ${Math.round(Number(r.business_weight) * 100)}% | ${Math.round(Number(r.adaptability_weight) * 100)}% |\n`;
    }
  }

  return resp;
}

// ─── All roles overview ─────────────────────────────────────────────

async function allRolesOverview(roles: any[]): Promise<string> {
  let resp = '## Todas las posiciones\n\n';

  for (const role of roles) {
    const { data: crs } = await supabase
      .from('candidate_roles')
      .select('combined_score, validated_score, pipeline_stage, candidates(id, full_name)')
      .eq('role_id', role.id)
      .order('combined_score', { ascending: false })
      .limit(5);

    const positions = role.positions_count ?? 1;

    resp += `### ${role.name}\n`;
    resp += `${role.business_unit} · ${positions} posicion${positions > 1 ? 'es' : ''}\n\n`;

    if (crs?.length) {
      resp += '| # | Candidato | Score | Validado | Fase | Perfil |\n';
      resp += '|---|---|---|---|---|---|\n';
      for (let i = 0; i < crs.length; i++) {
        const cr = crs[i] as any;
        const c = cr.candidates as any;
        const score = Math.round(Number(cr.combined_score ?? 0));
        const val = cr.validated_score != null ? 'Sí' : 'No';
        const stage = stageLabel(cr.pipeline_stage);
        const link = `[Ver →](/candidato/${c.id}?role=${role.id})`;
        resp += `| ${i + 1} | **${c.full_name}** | ${score} | ${val} | ${stage} | ${link} |\n`;
      }
    } else {
      resp += 'Sin candidatos.\n';
    }
    resp += '\n';
  }

  return resp;
}

// ─── Compare ────────────────────────────────────────────────────────

async function compareCandidatesResponse(roleId: string, allRoles: any[]): Promise<string> {
  const role = allRoles.find((r) => r.id === roleId);
  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('declarative_score, validated_score, combined_score, confidence, pipeline_stage, candidates(id, full_name, current_position)')
    .eq('role_id', roleId)
    .not('pipeline_stage', 'eq', 'rejected')
    .order('combined_score', { ascending: false })
    .limit(6);

  if (!crs?.length) return `No se encontraron candidatos para **${role?.name}**.`;

  const candidateIds = crs.map((cr: any) => (cr.candidates as any).id);

  const { data: dims } = await supabase
    .from('candidate_dimensions')
    .select('*')
    .in('candidate_id', candidateIds)
    .eq('role_id', roleId);

  const dimensions = dims ?? [];

  let resp = `## Comparativa: ${role?.name}\n\n`;

  resp += '| Candidato | Score | IQ | EQ | DQ | BQ | AQ | Fit cultural | Potencial | Perfil |\n';
  resp += '|---|---|---|---|---|---|---|---|---|---|\n';

  for (const cr of crs) {
    const c = (cr.candidates as any);
    const comb = Math.round(Number((cr as any).combined_score ?? 0));
    const dim = dimensions.find((d: any) => d.candidate_id === c.id);
    const link = `[Ver →](/candidato/${c.id}?role=${roleId})`;

    if (dim) {
      resp += `| **${c.full_name}** | **${comb}** | ${Math.round(Number(dim.cognitive_iq))} | ${Math.round(Number(dim.emotional_eq))} | ${Math.round(Number(dim.digital_dq))} | ${Math.round(Number(dim.business_bq))} | ${Math.round(Number(dim.adaptability_aq))} | ${Math.round(Number(dim.cultural_fit))}% | ${GROWTH_LABELS[dim.growth_potential] ?? '—'} | ${link} |\n`;
    } else {
      resp += `| **${c.full_name}** | **${comb}** | — | — | — | — | — | — | — | ${link} |\n`;
    }
  }

  return resp;
}

// ─── Gaps ───────────────────────────────────────────────────────────

async function gapsResponse(roleId: string | undefined, allRoles: any[]): Promise<string> {
  const targetRoleId = roleId ?? allRoles[0]?.id;
  if (!targetRoleId) return 'No hay roles configurados.';

  const role = allRoles.find((r) => r.id === targetRoleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('confidence, pipeline_stage, candidates(id, full_name)')
    .eq('role_id', targetRoleId)
    .not('pipeline_stage', 'eq', 'rejected')
    .order('combined_score', { ascending: false });

  if (!crs?.length) return `No se encontraron candidatos para **${role?.name}**.`;

  const { data: rsRows } = await supabase
    .from('role_skills')
    .select('weight, required_level, skills(name, hr_dimension, complexity_tier)')
    .eq('role_id', targetRoleId);

  const candidateIds = crs.map((cr: any) => (cr.candidates as any).id);
  const { data: csRows } = await supabase
    .from('candidate_skills')
    .select('candidate_id, level, skills(name)')
    .in('candidate_id', candidateIds);

  let resp = `## Gaps de skills: ${role?.name}\n\n`;

  const gapCount: Record<string, { count: number; dim: string; tier: string }> = {};

  for (const cr of crs) {
    const cId = (cr.candidates as any).id;
    const cSkills = (csRows ?? []).filter((cs: any) => cs.candidate_id === cId);

    for (const rs of rsRows ?? []) {
      const skillName = (rs.skills as any).name;
      const cs = cSkills.find((s: any) => (s.skills as any).name === skillName);
      const level = cs?.level ?? 0;
      if (level < rs.required_level) {
        if (!gapCount[skillName]) {
          gapCount[skillName] = { count: 0, dim: (rs.skills as any).hr_dimension, tier: (rs.skills as any).complexity_tier };
        }
        gapCount[skillName].count++;
      }
    }
  }

  const sortedGaps = Object.entries(gapCount).sort((a, b) => b[1].count - a[1].count);

  if (sortedGaps.length === 0) {
    resp += 'No se detectan gaps en el pool activo.';
    return resp;
  }

  resp += '| Skill | Tipo | Complejidad | Candidatos con gap | % |\n';
  resp += '|---|---|---|---|---|\n';
  for (const [skill, data] of sortedGaps) {
    const pct = Math.round((data.count / crs.length) * 100);
    resp += `| **${skill}** | ${DIM_LABELS[data.dim] ?? data.dim} | ${TIER_LABELS[data.tier] ?? data.tier} | ${data.count}/${crs.length} | ${pct}% |\n`;
  }

  return resp;
}

// ─── Pipeline ───────────────────────────────────────────────────────

async function pipelineResponse(roleId: string | undefined, allRoles: any[]): Promise<string> {
  if (!roleId) {
    let resp = '## Pipeline por posicion\n\n';
    for (const role of allRoles) {
      const { data: crs } = await supabase
        .from('candidate_roles')
        .select('pipeline_stage')
        .eq('role_id', role.id);

      const stages: Record<string, number> = {};
      for (const cr of crs ?? []) {
        const s = (cr as any).pipeline_stage ?? 'applied';
        stages[s] = (stages[s] ?? 0) + 1;
      }

      resp += `### ${role.name}\n`;
      for (const [stage, count] of Object.entries(stages).sort()) {
        resp += `- ${stageLabel(stage)}: **${count}**\n`;
      }
      resp += '\n';
    }
    return resp;
  }

  const role = allRoles.find((r) => r.id === roleId);
  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('pipeline_stage, combined_score, confidence')
    .eq('role_id', roleId);

  const stages: Record<string, { count: number; scores: number[] }> = {};
  for (const cr of crs ?? []) {
    const s = (cr as any).pipeline_stage ?? 'applied';
    if (!stages[s]) stages[s] = { count: 0, scores: [] };
    stages[s].count++;
    stages[s].scores.push(Number((cr as any).combined_score ?? 0));
  }

  let resp = `## Pipeline: ${role?.name}\n\n`;
  resp += '| Fase | Candidatos | Score medio |\n';
  resp += '|---|---|---|\n';
  for (const [stage, data] of Object.entries(stages)) {
    const avgS = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count);
    resp += `| ${stageLabel(stage)} | **${data.count}** | ${avgS} |\n`;
  }

  return resp;
}

// ─── Pending validation ─────────────────────────────────────────────

async function pendingValidationResponse(allRoles: any[]): Promise<string> {
  let resp = '## Candidatos sin validacion Panorama\n\n';
  let totalPending = 0;

  for (const role of allRoles) {
    const { data: crs } = await supabase
      .from('candidate_roles')
      .select('combined_score, declarative_score, confidence, pipeline_stage, candidates(id, full_name)')
      .eq('role_id', role.id)
      .is('validated_score', null)
      .not('pipeline_stage', 'eq', 'rejected')
      .order('combined_score', { ascending: false });

    if (!crs?.length) continue;

    totalPending += crs.length;
    resp += `### ${role.name}\n\n`;
    resp += '| Candidato | Score CV | Confianza | Fase | Perfil |\n';
    resp += '|---|---|---|---|---|\n';

    for (const cr of crs) {
      const c = (cr.candidates as any);
      const decl = Math.round(Number((cr as any).declarative_score ?? 0));
      const conf = Math.round(Number((cr as any).confidence ?? 0) * 100);
      const stage = stageLabel((cr as any).pipeline_stage);
      const link = `[Ver →](/candidato/${c.id}?role=${role.id})`;
      resp += `| ${c.full_name} | ${decl} | ${conf}% | ${stage} | ${link} |\n`;
    }
    resp += '\n';
  }

  if (totalPending === 0) {
    return 'Todos los candidatos activos tienen validacion Panorama.';
  }

  resp += `**Total sin validar:** ${totalPending}`;

  return resp;
}

// ─── Confidence / Validation ────────────────────────────────────────

async function confidenceResponse(roleId: string, allRoles: any[]): Promise<string> {
  const role = allRoles.find((r) => r.id === roleId);

  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('declarative_score, validated_score, combined_score, confidence, pipeline_stage, candidates(id, full_name)')
    .eq('role_id', roleId)
    .order('combined_score', { ascending: false });

  if (!crs?.length) return `No se encontraron datos para **${role?.name}**.`;

  const validated = crs.filter((cr) => cr.validated_score != null);
  const pending = crs.filter((cr) => cr.validated_score == null);

  let resp = `## Validacion: ${role?.name}\n\n`;
  resp += `- Total: **${crs.length}**\n`;
  resp += `- Validados: **${validated.length}** (${Math.round((validated.length / crs.length) * 100)}%)\n`;
  resp += `- Pendientes: **${pending.length}**\n\n`;

  if (validated.length > 0) {
    const avgDecl = Math.round(validated.reduce((s, cr) => s + Number(cr.declarative_score ?? 0), 0) / validated.length);
    const avgVal = Math.round(validated.reduce((s, cr) => s + Number(cr.validated_score ?? 0), 0) / validated.length);
    resp += `**Media declarativa:** ${avgDecl} · **Media validada:** ${avgVal} · **Delta:** ${avgVal - avgDecl > 0 ? '+' : ''}${avgVal - avgDecl}\n\n`;
  }

  if (pending.length > 0) {
    resp += '**Pendientes:**\n';
    for (const cr of pending) {
      const c = (cr.candidates as any);
      resp += `- ${profileLink(c.full_name, c.id, roleId)} — CV: ${Math.round(Number(cr.declarative_score ?? 0))}, confianza: ${Math.round(Number(cr.confidence ?? 0) * 100)}%\n`;
    }
  }

  resp += `\nPonderacion: **${Math.round(Number(role?.declarative_weight ?? 0.4) * 100)}% declarativo** + **${Math.round(Number(role?.scientific_weight ?? 0.6) * 100)}% cientifico**`;

  return resp;
}

// ─── Metrics ────────────────────────────────────────────────────────

async function metricsResponse(): Promise<string> {
  const { data: metrics } = await supabase
    .from('demo_metrics')
    .select('role_id, hours_saved, shortlist_precision_gain, irrelevant_interviews_reduction, roles(name)');

  if (!metrics?.length) return 'No hay metricas disponibles.';

  let resp = '## Metricas\n\n';
  resp += '| Rol | Horas ahorradas | Precision shortlist | Reduccion entrevistas |\n';
  resp += '|---|---|---|---|\n';

  for (const m of metrics) {
    resp += `| ${(m.roles as any).name} | ${m.hours_saved}h | +${m.shortlist_precision_gain}% | -${m.irrelevant_interviews_reduction}% |\n`;
  }

  return resp;
}

// ─── RRHH 360 responses ──────────────────────────────────────────────

async function integratedTalentResponse(): Promise<string> {
  const { data: rows, error } = await supabase
    .from('hr_integrated_talent_dashboard_v')
    .select('*')
    .order('sustained_performance_score', { ascending: false })
    .limit(50);

  if (error || !rows?.length) {
    return 'No hay datos integrados de talento disponibles todavía. Importa primero fuentes CSOD/Sopra/M50 desde Admin.';
  }

  const total = rows.length;
  const sustained = rows.filter((r: any) => Number(r.sustained_performance_score ?? 0) >= 75).length;
  const highPotential = rows.filter((r: any) => Number(r.potential_score ?? 0) >= 70).length;
  const highRiskSuccession = rows.filter((r: any) => (r.readiness ?? '') === 'not_ready').length;
  const onTrackRate = Math.round(
    rows.reduce((sum: number, r: any) => {
      const totalObj = Number(r.objectives_total ?? 0);
      const onTrack = Number(r.objectives_on_track ?? 0);
      return sum + (totalObj > 0 ? onTrack / totalObj : 0);
    }, 0) / total * 100
  );

  let resp = '## Cuadro de mando integrado de talento\n\n';
  resp += `- Personas analizadas: **${total}**\n`;
  resp += `- Desempeño sostenido (>=75): **${sustained}** (${Math.round((sustained / total) * 100)}%)\n`;
  resp += `- High potential (>=70): **${highPotential}** (${Math.round((highPotential / total) * 100)}%)\n`;
  resp += `- Riesgo sucesorio potencial (readiness no listo): **${highRiskSuccession}**\n`;
  resp += `- Objetivos bonus on-track (media): **${isFinite(onTrackRate) ? onTrackRate : 0}%**\n\n`;

  resp += '### Top talento por desempeño y potencial\n\n';
  resp += '| Persona | Unidad | Desempeño | Potencial | Readiness | Objetivos |\n';
  resp += '|---|---|---|---|---|---|\n';
  for (const row of rows.slice(0, 10)) {
    const totalObj = Number((row as any).objectives_total ?? 0);
    const onTrack = Number((row as any).objectives_on_track ?? 0);
    const objectiveSummary = totalObj > 0 ? `${onTrack}/${totalObj}` : '—';
    resp += `| **${(row as any).full_name}** | ${(row as any).business_unit ?? '—'} | ${Math.round(Number((row as any).sustained_performance_score ?? 0))} | ${Math.round(Number((row as any).potential_score ?? 0))} | ${(row as any).readiness ?? '—'} | ${objectiveSummary} |\n`;
  }

  return resp;
}

async function performancePotentialResponse(): Promise<string> {
  const { data: rows, error } = await supabase
    .from('hr_integrated_talent_dashboard_v')
    .select('*')
    .order('sustained_performance_score', { ascending: false })
    .limit(40);

  if (error || !rows?.length) {
    return 'No hay información de desempeño/potencial. Importa evaluaciones y potencial para habilitar esta vista.';
  }

  let resp = '## Desempeño y potencial\n\n';
  resp += '| Persona | Desempeño sostenido | Potencial | Readiness | Acciones pendientes |\n';
  resp += '|---|---|---|---|---|\n';

  for (const row of rows.slice(0, 12)) {
    resp += `| **${(row as any).full_name}** | ${Math.round(Number((row as any).sustained_performance_score ?? 0))} | ${Math.round(Number((row as any).potential_score ?? 0))} | ${(row as any).readiness ?? '—'} | ${Number((row as any).actions_pending ?? 0)} |\n`;
  }

  return resp;
}

async function trainingRecommendationsResponse(): Promise<string> {
  const { data: recs, error } = await supabase
    .from('hr_training_recommendations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return 'No se pudieron consultar recomendaciones de formación.';
  }

  if (!recs?.length) {
    const { data: rows } = await supabase
      .from('hr_integrated_talent_dashboard_v')
      .select('employee_id, full_name, sustained_performance_score, potential_score')
      .order('sustained_performance_score', { ascending: true })
      .limit(8);

    if (!rows?.length) {
      return 'No hay recomendaciones de formación disponibles todavía.';
    }

    let fallback = '## Recomendaciones de formación (estimadas)\n\n';
    fallback += '| Persona | Motivo | Recomendación |\n';
    fallback += '|---|---|---|\n';
    for (const row of rows) {
      const perf = Math.round(Number((row as any).sustained_performance_score ?? 0));
      const pot = Math.round(Number((row as any).potential_score ?? 0));
      const reason = `Desempeño ${perf} · Potencial ${pot}`;
      const action = pot >= 70
        ? 'Programa acelerado + mentoring con referente'
        : 'Itinerario de upskilling con hitos trimestrales';
      fallback += `| **${(row as any).full_name}** | ${reason} | ${action} |\n`;
    }
    return fallback;
  }

  let resp = '## Recomendaciones de formación\n\n';
  resp += '| Empleado | Prioridad | Recomendación | Motivo |\n';
  resp += '|---|---|---|---|\n';
  for (const rec of recs.slice(0, 12)) {
    resp += `| **${(rec as any).employee_id}** | ${(rec as any).priority} | ${(rec as any).title} | ${(rec as any).reason} |\n`;
  }
  return resp;
}

async function bonusObjectivesResponse(): Promise<string> {
  const { data: objectives, error } = await supabase
    .from('bonus_objectives')
    .select('employee_id, cycle, objective_code, objective_name, progress_value, status')
    .order('imported_at', { ascending: false })
    .limit(120);

  if (error || !objectives?.length) {
    return 'No hay objetivos de bonus importados. Carga ficheros de M50 desde Admin.';
  }

  const total = objectives.length;
  const atRisk = objectives.filter((o: any) => o.status === 'at_risk').length;
  const onTrack = objectives.filter((o: any) => o.status === 'on_track' || o.status === 'completed').length;

  let resp = '## Objetivos del bonus (M50)\n\n';
  resp += `- Total objetivos: **${total}**\n`;
  resp += `- On track/completed: **${onTrack}** (${Math.round((onTrack / total) * 100)}%)\n`;
  resp += `- At risk: **${atRisk}** (${Math.round((atRisk / total) * 100)}%)\n\n`;
  resp += '### Objetivos en riesgo\n\n';
  resp += '| Empleado | Ciclo | Objetivo | Progreso | Estado |\n';
  resp += '|---|---|---|---|---|\n';
  for (const obj of objectives.filter((o: any) => o.status === 'at_risk').slice(0, 12)) {
    resp += `| **${(obj as any).employee_id}** | ${(obj as any).cycle} | ${(obj as any).objective_name} | ${Math.round(Number((obj as any).progress_value ?? 0))}% | ${(obj as any).status} |\n`;
  }
  return resp;
}

async function successionRiskResponse(): Promise<string> {
  const { data: snapshots, error } = await supabase
    .from('hr_succession_risk_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(80);

  if (error || !snapshots?.length) {
    return 'No hay datos de riesgo sucesorio disponibles.';
  }

  const high = snapshots.filter((s: any) => s.risk_level === 'high');
  const medium = snapshots.filter((s: any) => s.risk_level === 'medium');

  let resp = '## Riesgo sucesorio\n\n';
  resp += `- Riesgo alto: **${high.length}**\n`;
  resp += `- Riesgo medio: **${medium.length}**\n`;
  resp += `- Total posiciones monitorizadas: **${snapshots.length}**\n\n`;
  resp += '| Posición | Unidad | Riesgo | Cobertura readiness | Bench |\n';
  resp += '|---|---|---|---|---|\n';
  for (const s of snapshots.slice(0, 15)) {
    resp += `| **${(s as any).position_name}** | ${(s as any).business_unit} | ${(s as any).risk_level} | ${Math.round(Number((s as any).readiness_coverage ?? 0))}% | ${Number((s as any).bench_size ?? 0)} |\n`;
  }
  return resp;
}

async function careerPathsResponse(): Promise<string> {
  const { data: paths, error } = await supabase
    .from('hr_career_paths')
    .select('*')
    .order('path_code', { ascending: true })
    .limit(80);

  if (error || !paths?.length) {
    return 'No hay trayectorias profesionales configuradas todavía.';
  }

  let resp = '## Trayectorias profesionales\n\n';
  resp += '| Código | Desde | Hacia | Readiness mínimo | Skills clave |\n';
  resp += '|---|---|---|---|---|\n';
  for (const path of paths) {
    const skills = Array.isArray((path as any).required_skills) ? (path as any).required_skills.join(', ') : '—';
    resp += `| **${(path as any).path_code}** | ${(path as any).from_role} | ${(path as any).to_role} | ${Math.round(Number((path as any).min_readiness_score ?? 0))} | ${skills || '—'} |\n`;
  }
  return resp;
}

async function automationStatusResponse(): Promise<string> {
  const { data: actions, error } = await supabase
    .from('hr_development_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(120);

  if (error || !actions?.length) {
    return 'No hay acciones automáticas registradas.';
  }

  const pending = actions.filter((a: any) => a.status === 'pending').length;
  const inProgress = actions.filter((a: any) => a.status === 'in_progress').length;
  const completed = actions.filter((a: any) => a.status === 'completed').length;

  let resp = '## Automatizaciones y acciones\n\n';
  resp += `- Pendientes: **${pending}**\n`;
  resp += `- En progreso: **${inProgress}**\n`;
  resp += `- Completadas: **${completed}**\n\n`;
  resp += '| Tipo | Prioridad | Acción | Estado |\n';
  resp += '|---|---|---|---|\n';
  for (const action of actions.slice(0, 15)) {
    resp += `| ${(action as any).action_type} | ${(action as any).priority} | ${(action as any).title} | ${(action as any).status} |\n`;
  }
  return resp;
}

// ─── Skill Model ────────────────────────────────────────────────────

async function skillModelResponse(roleId: string | undefined, allRoles: any[]): Promise<string> {
  const targetId = roleId ?? allRoles[0]?.id;
  if (!targetId) return 'No hay roles configurados.';

  const role = allRoles.find((r) => r.id === targetId);

  const { data: rsRows } = await supabase
    .from('role_skills')
    .select('weight, required_level, skills(name, source, hr_dimension, skill_type, complexity_tier)')
    .eq('role_id', targetId)
    .order('weight', { ascending: false });

  if (!rsRows?.length) return `No hay skills definidas para **${role?.name}**.`;

  let resp = `## Skills: ${role?.name}\n\n`;

  const grouped: Record<string, typeof rsRows> = {};
  for (const rs of rsRows) {
    const dim = (rs.skills as any).hr_dimension ?? 'hard_technical';
    if (!grouped[dim]) grouped[dim] = [];
    grouped[dim].push(rs);
  }

  for (const [dim, skills] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
    resp += `### ${DIM_LABELS[dim] ?? dim}\n\n`;
    resp += '| Skill | Tipo | Complejidad | Peso | Nivel requerido |\n';
    resp += '|---|---|---|---|---|\n';

    for (const rs of skills) {
      const s = rs.skills as any;
      const typeLabel = s.skill_type === 'knowledge' ? 'Conocimiento' : s.skill_type === 'transversal' ? 'Transversal' : 'Competencia';
      resp += `| ${s.name} | ${typeLabel} | ${TIER_LABELS[s.complexity_tier] ?? 'Estándar'} | ${(rs.weight * 100).toFixed(0)}% | ${PROFICIENCY[rs.required_level] ?? rs.required_level} (${rs.required_level}/5) |\n`;
    }
    resp += '\n';
  }

  return resp;
}

// ─── Pool ───────────────────────────────────────────────────────────

async function poolResponse(roleId: string | undefined, allRoles: any[]): Promise<string> {
  if (!roleId) return await rolesOverviewResponse(allRoles);

  const role = allRoles.find((r) => r.id === roleId);
  const { data: crs } = await supabase
    .from('candidate_roles')
    .select('combined_score, confidence, pipeline_stage, validated_score, candidates(id, full_name)')
    .eq('role_id', roleId)
    .order('combined_score', { ascending: false });

  if (!crs?.length) return `No se encontraron candidatos para **${role?.name}**.`;

  let resp = `## Pool: ${role?.name}\n\n`;

  resp += '| # | Candidato | Score | Confianza | Fase | Validado | Perfil |\n';
  resp += '|---|---|---|---|---|---|---|\n';

  for (let i = 0; i < crs.length; i++) {
    const cr = crs[i] as any;
    const c = cr.candidates as any;
    const score = Math.round(Number(cr.combined_score ?? 0));
    const conf = Math.round(Number(cr.confidence ?? 0) * 100);
    const stage = stageLabel(cr.pipeline_stage);
    const val = cr.validated_score != null ? 'Sí' : 'No';
    resp += `| ${i + 1} | **${c.full_name}** | ${score} | ${conf}% | ${stage} | ${val} | [Ver →](/candidato/${c.id}?role=${roleId}) |\n`;
  }

  return resp;
}

// ─── Roles Overview ─────────────────────────────────────────────────

async function rolesOverviewResponse(allRoles: any[]): Promise<string> {
  if (!allRoles.length) return 'No hay posiciones en el sistema.';

  let resp = '## Posiciones\n\n';

  resp += '| Posicion | Unidad | Vacantes | Candidatos | Validados |\n';
  resp += '|---|---|---|---|---|\n';

  for (const r of allRoles) {
    const { data: crs } = await supabase
      .from('candidate_roles')
      .select('validated_score')
      .eq('role_id', r.id);

    const total = crs?.length ?? 0;
    const validated = crs?.filter((cr: any) => cr.validated_score != null).length ?? 0;
    resp += `| **${r.name}** | ${r.business_unit} | ${r.positions_count ?? 1} | ${total} | ${validated} |\n`;
  }

  return resp;
}

// ─── General fallback ───────────────────────────────────────────────

async function generalResponse(allRoles: any[]): Promise<string> {
  let resp = '## Asistente de talento RRHH\n\n';
  resp += 'Puedes consultar tanto selección como talento 360 (desempeño, potencial, sucesión, objetivos y desarrollo).\n\n';
  resp += '### Búsquedas disponibles:\n';
  resp += '- **"Cuadro de mando integrado de talento"** — visión global RRHH\n';
  resp += '- **"Desempeño y potencial"** — lectura tipo 9-box\n';
  resp += '- **"Objetivos bonus M50"** — estado on-track/at-risk\n';
  resp += '- **"Riesgo sucesorio"** — posiciones críticas y cobertura\n';
  resp += '- **"Recomendaciones de formación"** — acciones sugeridas\n';
  resp += '- **"Automatizaciones y acciones"** — backlog de desarrollo\n';
  resp += '- **"Trayectorias profesionales"** — rutas de carrera\n';
  resp += '- **"Compara candidatos de Riesgo"** — tabla comparativa selección\n';

  if (allRoles.length) {
    resp += '\n### Posiciones disponibles\n\n';
    resp += '| Posición | Unidad | Vacantes |\n';
    resp += '|---|---|---|\n';
    for (const r of allRoles) {
      resp += `| **${r.name}** | ${r.business_unit} | ${r.positions_count ?? 1} |\n`;
    }
  }

  return resp;
}

// ─── Helpers ────────────────────────────────────────────────────────

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    applied: 'Aplicado',
    screened: 'Filtrado',
    validated: 'Validado',
    shortlisted: 'Shortlist',
    interview: 'Entrevista',
    offer: 'Oferta',
    hired: 'Contratado',
    rejected: 'Descartado',
  };
  return map[stage] ?? stage;
}
