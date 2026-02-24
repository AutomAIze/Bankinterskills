import { supabase } from './supabase';

export interface ResponseMeta {
  section?: string;
}

export interface GenerateResult {
  text: string;
  meta?: ResponseMeta;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesIntent(q: string, keywords: string[]): boolean {
  return keywords.some((kw) => q.includes(kw));
}

const READINESS_LABEL: Record<string, string> = {
  ready_now: 'Listo ahora',
  ready_1y: 'Listo en 1 año',
  ready_2y: 'Listo en 2 años',
  not_ready: 'No listo',
};

const POTENTIAL_LABEL: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
};

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Sin iniciar',
  on_track: 'En curso',
  at_risk: 'En riesgo',
  completed: 'Completado',
  pending: 'Pendiente',
  in_progress: 'En progreso',
};

const ACTION_TYPE_LABEL: Record<string, string> = {
  training: 'Formación',
  mentoring: 'Mentoring',
  rotation: 'Rotación',
  succession: 'Sucesión',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export async function generateResponse(
  question: string,
  _context: { roleId?: string; candidateId?: string }
): Promise<GenerateResult> {
  const q = normalize(question);

  if (matchesIntent(q, ['cuadro de mando', 'talento 360', 'vision integrada', 'vision completa', 'dashboard', 'resumen general', 'rrhh'])) {
    return wrap(await integratedTalentResponse(), 'dashboard');
  }

  if (matchesIntent(q, ['desempeno', 'desempeño', '9box', '9-box', 'rendimiento'])) {
    return wrap(await performanceResponse(), 'performance');
  }

  if (matchesIntent(q, ['potencial', 'high potential', 'alto potencial', 'readiness'])) {
    return wrap(await potentialResponse(), 'potential');
  }

  if (matchesIntent(q, ['formacion', 'formación', 'upskilling', 'reskilling', 'plan de desarrollo', 'recomendacion formativa', 'capacitacion'])) {
    return wrap(await trainingRecommendationsResponse(), 'training');
  }

  if (matchesIntent(q, ['objetivo', 'bonus', 'm50', 'on track', 'at risk', 'incentivo'])) {
    return wrap(await bonusObjectivesResponse(), 'objectives');
  }

  if (matchesIntent(q, ['sucesion', 'sucesorio', 'sucesoria', 'riesgo sucesorio', 'bench', 'cobertura'])) {
    return wrap(await successionRiskResponse(), 'succession');
  }

  if (matchesIntent(q, ['trayectoria profesional', 'trayectorias', 'career path', 'movilidad', 'carrera'])) {
    return wrap(await careerPathsResponse(), 'career');
  }

  if (matchesIntent(q, ['accion automatica', 'automatizacion', 'automatizaciones', 'acciones pendientes', 'workflow', 'accion de desarrollo', 'acciones de desarrollo'])) {
    return wrap(await developmentActionsResponse(), 'actions');
  }

  if (matchesIntent(q, ['empleado', 'persona', 'plantilla', 'equipo', 'organigrama', 'quien', 'quienes'])) {
    return wrap(await employeesResponse(q), 'employees');
  }

  if (matchesIntent(q, ['unidad', 'departamento', 'area', 'negocio'])) {
    return wrap(await businessUnitsResponse(), 'units');
  }

  if (matchesIntent(q, ['gap', 'gaps', 'brecha', 'brechas', 'carencia', 'skill'])) {
    return wrap(await skillGapsResponse(), 'gaps');
  }

  return wrap(await generalResponse(), 'general');
}

function wrap(text: string, section?: string): GenerateResult {
  return { text, meta: section ? { section } : undefined };
}

// ─── Integrated Talent Dashboard ─────────────────────────────────────

async function integratedTalentResponse(): Promise<string> {
  const { data: rows, error } = await supabase
    .from('hr_integrated_talent_dashboard_v')
    .select('*')
    .order('sustained_performance_score', { ascending: false })
    .limit(50);

  if (error || !rows?.length) {
    return 'No hay datos integrados de talento disponibles todavía. Ejecuta la migración de datos sintéticos o importa fuentes desde Admin.';
  }

  const total = rows.length;
  const highPerf = rows.filter((r) => Number(r.sustained_performance_score ?? 0) >= 80).length;
  const highPot = rows.filter((r) => Number(r.potential_score ?? 0) >= 75).length;
  const notReady = rows.filter((r) => r.readiness === 'not_ready').length;

  const totalObj = rows.reduce((s, r) => s + Number(r.objectives_total ?? 0), 0);
  const onTrackObj = rows.reduce((s, r) => s + Number(r.objectives_on_track ?? 0), 0);
  const objRate = totalObj > 0 ? Math.round((onTrackObj / totalObj) * 100) : 0;

  let resp = '## Cuadro de mando integrado de talento\n\n';
  resp += `- Profesionales analizados: **${total}**\n`;
  resp += `- Desempeño alto (≥80): **${highPerf}** (${Math.round((highPerf / total) * 100)}%)\n`;
  resp += `- Alto potencial (≥75): **${highPot}** (${Math.round((highPot / total) * 100)}%)\n`;
  resp += `- No listos para promoción: **${notReady}**\n`;
  resp += `- Objetivos bonus on-track: **${objRate}%**\n\n`;

  resp += '### Top talento\n\n';
  resp += '| Persona | Unidad | Puesto | Desempeño | Potencial | Readiness | Objetivos |\n';
  resp += '|---|---|---|---|---|---|---|\n';

  for (const row of rows.slice(0, 12)) {
    const objCount = Number(row.objectives_total ?? 0);
    const objOk = Number(row.objectives_on_track ?? 0);
    const objText = objCount > 0 ? `${objOk}/${objCount}` : '—';
    resp += `| **${row.full_name}** | ${row.business_unit ?? '—'} | ${row.position ?? '—'} | ${Math.round(Number(row.sustained_performance_score ?? 0))} | ${Math.round(Number(row.potential_score ?? 0))} | ${READINESS_LABEL[row.readiness as string] ?? '—'} | ${objText} |\n`;
  }

  return resp;
}

// ─── Performance ─────────────────────────────────────────────────────

async function performanceResponse(): Promise<string> {
  const { data: evals, error } = await supabase
    .from('performance_evaluations')
    .select('employee_id, cycle, evaluation_type, score, normalized_score, qualitative_notes')
    .order('evaluated_at', { ascending: false })
    .limit(200);

  if (error || !evals?.length) {
    return 'No hay evaluaciones de desempeño disponibles.';
  }

  const { data: employees } = await supabase.from('hr_employees').select('id, full_name, position, business_unit');
  const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

  const byEmployee = new Map<string, { total: number; count: number; cycles: string[] }>();
  for (const ev of evals) {
    const entry = byEmployee.get(ev.employee_id) ?? { total: 0, count: 0, cycles: [] };
    entry.total += Number(ev.normalized_score);
    entry.count++;
    if (!entry.cycles.includes(ev.cycle)) entry.cycles.push(ev.cycle);
    byEmployee.set(ev.employee_id, entry);
  }

  const ranked = [...byEmployee.entries()]
    .map(([id, d]) => ({ id, avg: d.total / d.count, cycles: d.count }))
    .sort((a, b) => b.avg - a.avg);

  let resp = '## Desempeño sostenido\n\n';
  resp += `- Empleados evaluados: **${ranked.length}**\n`;
  resp += `- Evaluaciones totales: **${evals.length}**\n\n`;

  resp += '| # | Persona | Puesto | Unidad | Media | Evaluaciones |\n';
  resp += '|---|---|---|---|---|---|\n';

  for (let i = 0; i < Math.min(ranked.length, 15); i++) {
    const r = ranked[i];
    const emp = empMap.get(r.id);
    resp += `| ${i + 1} | **${emp?.full_name ?? r.id}** | ${emp?.position ?? '—'} | ${emp?.business_unit ?? '—'} | ${Math.round(r.avg)} | ${r.cycles} |\n`;
  }

  const low = ranked.filter((r) => r.avg < 65);
  if (low.length > 0) {
    resp += '\n### Profesionales con desempeño bajo umbral (<65)\n\n';
    for (const r of low) {
      const emp = empMap.get(r.id);
      resp += `- **${emp?.full_name ?? r.id}** (${emp?.position ?? '—'}): media ${Math.round(r.avg)}\n`;
    }
  }

  return resp;
}

// ─── Potential ───────────────────────────────────────────────────────

async function potentialResponse(): Promise<string> {
  const { data: assessments, error } = await supabase
    .from('potential_assessments')
    .select('employee_id, potential_level, potential_score, readiness, rationale')
    .order('potential_score', { ascending: false })
    .limit(100);

  if (error || !assessments?.length) {
    return 'No hay evaluaciones de potencial disponibles.';
  }

  const { data: employees } = await supabase.from('hr_employees').select('id, full_name, position, business_unit');
  const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

  const high = assessments.filter((a) => a.potential_level === 'high');

  let resp = '## Potencial y readiness\n\n';
  resp += `- Total evaluados: **${assessments.length}**\n`;
  resp += `- Alto potencial: **${high.length}** (${Math.round((high.length / assessments.length) * 100)}%)\n`;
  resp += `- Listos ahora: **${assessments.filter((a) => a.readiness === 'ready_now').length}**\n\n`;

  resp += '| Persona | Puesto | Unidad | Potencial | Score | Readiness |\n';
  resp += '|---|---|---|---|---|---|\n';

  for (const a of assessments.slice(0, 15)) {
    const emp = empMap.get(a.employee_id);
    resp += `| **${emp?.full_name ?? a.employee_id}** | ${emp?.position ?? '—'} | ${emp?.business_unit ?? '—'} | ${POTENTIAL_LABEL[a.potential_level] ?? a.potential_level} | ${Math.round(Number(a.potential_score))} | ${READINESS_LABEL[a.readiness] ?? a.readiness} |\n`;
  }

  return resp;
}

// ─── Training Recommendations ────────────────────────────────────────

async function trainingRecommendationsResponse(): Promise<string> {
  const { data: actions, error } = await supabase
    .from('hr_development_actions')
    .select('*')
    .in('action_type', ['training', 'mentoring'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !actions?.length) {
    const { data: dashboard } = await supabase
      .from('hr_integrated_talent_dashboard_v')
      .select('employee_id, full_name, sustained_performance_score, potential_score')
      .order('sustained_performance_score', { ascending: true })
      .limit(8);

    if (!dashboard?.length) return 'No hay recomendaciones de formación disponibles.';

    let fallback = '## Recomendaciones de formación (estimadas)\n\n';
    fallback += '| Persona | Motivo | Recomendación |\n';
    fallback += '|---|---|---|\n';
    for (const row of dashboard) {
      const perf = Math.round(Number(row.sustained_performance_score ?? 0));
      const pot = Math.round(Number(row.potential_score ?? 0));
      const action = pot >= 70 ? 'Programa acelerado + mentoring' : 'Itinerario upskilling trimestral';
      fallback += `| **${row.full_name}** | Desempeño ${perf} · Potencial ${pot} | ${action} |\n`;
    }
    return fallback;
  }

  const { data: employees } = await supabase.from('hr_employees').select('id, full_name');
  const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

  let resp = '## Acciones de formación y mentoring\n\n';
  resp += '| Persona | Tipo | Acción | Motivo | Prioridad | Estado |\n';
  resp += '|---|---|---|---|---|---|\n';

  for (const a of actions) {
    const empName = empMap.get(a.employee_id)?.full_name ?? a.employee_id;
    resp += `| **${empName}** | ${ACTION_TYPE_LABEL[a.action_type] ?? a.action_type} | ${a.title} | ${a.reason} | ${PRIORITY_LABEL[a.priority] ?? a.priority} | ${STATUS_LABEL[a.status] ?? a.status} |\n`;
  }

  return resp;
}

// ─── Bonus Objectives ────────────────────────────────────────────────

async function bonusObjectivesResponse(): Promise<string> {
  const { data: objectives, error } = await supabase
    .from('bonus_objectives')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(120);

  if (error || !objectives?.length) {
    return 'No hay objetivos de bonus importados. Carga ficheros M50 desde Admin.';
  }

  const { data: employees } = await supabase.from('hr_employees').select('id, full_name');
  const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

  const total = objectives.length;
  const atRisk = objectives.filter((o) => o.status === 'at_risk').length;
  const onTrack = objectives.filter((o) => o.status === 'on_track' || o.status === 'completed').length;

  let resp = '## Objetivos de bonus (M50)\n\n';
  resp += `- Total objetivos: **${total}**\n`;
  resp += `- On-track / completados: **${onTrack}** (${Math.round((onTrack / total) * 100)}%)\n`;
  resp += `- En riesgo: **${atRisk}** (${Math.round((atRisk / total) * 100)}%)\n\n`;

  resp += '| Persona | Ciclo | Objetivo | Peso | Progreso | Estado |\n';
  resp += '|---|---|---|---|---|---|\n';

  for (const obj of objectives) {
    const empName = empMap.get(obj.employee_id)?.full_name ?? obj.employee_id;
    resp += `| **${empName}** | ${obj.cycle} | ${obj.objective_name} | ${obj.weight}% | ${Math.round(Number(obj.progress_value ?? 0))}% | ${STATUS_LABEL[obj.status] ?? obj.status} |\n`;
  }

  return resp;
}

// ─── Succession Risk ─────────────────────────────────────────────────

async function successionRiskResponse(): Promise<string> {
  const { data: snapshots, error } = await supabase
    .from('hr_succession_risk_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(80);

  if (error || !snapshots?.length) {
    return 'No hay datos de riesgo sucesorio disponibles.';
  }

  const high = snapshots.filter((s) => s.risk_level === 'high');
  const medium = snapshots.filter((s) => s.risk_level === 'medium');

  let resp = '## Riesgo sucesorio\n\n';
  resp += `- Riesgo alto: **${high.length}** posiciones\n`;
  resp += `- Riesgo medio: **${medium.length}** posiciones\n`;
  resp += `- Total monitorizadas: **${snapshots.length}**\n\n`;

  resp += '| Posición | Unidad | Riesgo | Cobertura readiness | Bench |\n';
  resp += '|---|---|---|---|---|\n';

  for (const s of snapshots) {
    const riskEmoji = s.risk_level === 'high' ? '**ALTO**' : s.risk_level === 'medium' ? 'Medio' : 'Bajo';
    resp += `| **${s.position_name}** | ${s.business_unit} | ${riskEmoji} | ${Math.round(Number(s.readiness_coverage ?? 0))}% | ${Number(s.bench_size ?? 0)} |\n`;
  }

  if (high.length > 0) {
    resp += '\n### Acciones recomendadas para posiciones de alto riesgo\n\n';
    for (const s of high) {
      resp += `- **${s.position_name}** (${s.business_unit}): Cobertura ${Math.round(Number(s.readiness_coverage))}%, bench de ${s.bench_size}. Se recomienda ampliar bench e intensificar desarrollo de sucesores.\n`;
    }
  }

  return resp;
}

// ─── Career Paths ────────────────────────────────────────────────────

async function careerPathsResponse(): Promise<string> {
  const { data: paths, error } = await supabase
    .from('hr_career_paths')
    .select('*')
    .order('path_code', { ascending: true })
    .limit(50);

  if (error || !paths?.length) {
    return 'No hay trayectorias profesionales configuradas.';
  }

  let resp = '## Trayectorias profesionales\n\n';
  resp += '| Código | Desde | Hacia | Readiness mínimo | Skills requeridas |\n';
  resp += '|---|---|---|---|---|\n';

  for (const p of paths) {
    const skills = Array.isArray(p.required_skills) ? p.required_skills.join(', ') : '—';
    resp += `| **${p.path_code}** | ${p.from_role} | ${p.to_role} | ${Math.round(Number(p.min_readiness_score ?? 0))} | ${skills || '—'} |\n`;
  }

  const { data: employees } = await supabase
    .from('hr_integrated_talent_dashboard_v')
    .select('full_name, position, potential_score, readiness')
    .order('potential_score', { ascending: false })
    .limit(50);

  if (employees?.length) {
    const candidates: string[] = [];
    for (const p of paths) {
      const matches = employees.filter(
        (e) => e.position === p.from_role && Number(e.potential_score ?? 0) >= Number(p.min_readiness_score)
      );
      for (const m of matches) {
        candidates.push(`- **${m.full_name}** (${m.position} → ${p.to_role}): potencial ${Math.round(Number(m.potential_score))}, readiness ${READINESS_LABEL[m.readiness as string] ?? m.readiness}`);
      }
    }

    if (candidates.length > 0) {
      resp += '\n### Profesionales que cumplen requisitos de trayectoria\n\n';
      resp += candidates.join('\n') + '\n';
    }
  }

  return resp;
}

// ─── Development Actions ─────────────────────────────────────────────

async function developmentActionsResponse(): Promise<string> {
  const { data: actions, error } = await supabase
    .from('hr_development_actions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(120);

  if (error || !actions?.length) {
    return 'No hay acciones de desarrollo registradas.';
  }

  const { data: employees } = await supabase.from('hr_employees').select('id, full_name');
  const empMap = new Map((employees ?? []).map((e) => [e.id, e]));

  const pending = actions.filter((a) => a.status === 'pending').length;
  const inProgress = actions.filter((a) => a.status === 'in_progress').length;
  const completed = actions.filter((a) => a.status === 'completed').length;

  let resp = '## Acciones de desarrollo\n\n';
  resp += `- Pendientes: **${pending}**\n`;
  resp += `- En progreso: **${inProgress}**\n`;
  resp += `- Completadas: **${completed}**\n\n`;

  resp += '| Persona | Tipo | Prioridad | Acción | Motivo | Estado |\n';
  resp += '|---|---|---|---|---|---|\n';

  for (const a of actions) {
    const empName = empMap.get(a.employee_id)?.full_name ?? (a.employee_id === 'UNASSIGNED' ? 'Sin asignar' : a.employee_id);
    resp += `| **${empName}** | ${ACTION_TYPE_LABEL[a.action_type] ?? a.action_type} | ${PRIORITY_LABEL[a.priority] ?? a.priority} | ${a.title} | ${a.reason} | ${STATUS_LABEL[a.status] ?? a.status} |\n`;
  }

  return resp;
}

// ─── Employees ───────────────────────────────────────────────────────

async function employeesResponse(q: string): Promise<string> {
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('active', true)
    .order('full_name', { ascending: true })
    .limit(100);

  if (error || !employees?.length) {
    return 'No hay empleados en el sistema.';
  }

  const filtered = employees.filter((e) => {
    const norm = normalize(e.full_name) + ' ' + normalize(e.position ?? '') + ' ' + normalize(e.business_unit ?? '');
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    return words.length === 0 || words.some((w) => norm.includes(w));
  });

  const list = filtered.length > 0 ? filtered : employees;

  let resp = `## Plantilla (${list.length} profesionales)\n\n`;
  resp += '| Nombre | Puesto | Unidad | Departamento |\n';
  resp += '|---|---|---|---|\n';

  for (const e of list.slice(0, 25)) {
    resp += `| **${e.full_name}** | ${e.position ?? '—'} | ${e.business_unit ?? '—'} | ${e.department ?? '—'} |\n`;
  }

  if (list.length > 25) {
    resp += `\n*Mostrando 25 de ${list.length} resultados.*`;
  }

  return resp;
}

// ─── Business Units ──────────────────────────────────────────────────

async function businessUnitsResponse(): Promise<string> {
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('business_unit, department')
    .eq('active', true);

  if (error || !employees?.length) {
    return 'No hay datos organizativos.';
  }

  const units = new Map<string, Set<string>>();
  const counts = new Map<string, number>();

  for (const e of employees) {
    const bu = e.business_unit ?? 'Sin asignar';
    if (!units.has(bu)) units.set(bu, new Set());
    units.get(bu)!.add(e.department ?? 'General');
    counts.set(bu, (counts.get(bu) ?? 0) + 1);
  }

  let resp = '## Estructura organizativa\n\n';
  resp += '| Unidad de negocio | Departamentos | Personas |\n';
  resp += '|---|---|---|\n';

  for (const [bu, depts] of [...units.entries()].sort((a, b) => (counts.get(b[0]) ?? 0) - (counts.get(a[0]) ?? 0))) {
    resp += `| **${bu}** | ${[...depts].join(', ')} | ${counts.get(bu)} |\n`;
  }

  return resp;
}

// ─── Skill Gaps (from career paths) ──────────────────────────────────

async function skillGapsResponse(): Promise<string> {
  const { data: paths } = await supabase.from('hr_career_paths').select('*');
  const { data: dashboard } = await supabase
    .from('hr_integrated_talent_dashboard_v')
    .select('full_name, position, potential_score, readiness')
    .order('potential_score', { ascending: false });

  if (!paths?.length || !dashboard?.length) {
    return 'No hay datos suficientes para calcular brechas de skills. Asegúrate de tener trayectorias y evaluaciones cargadas.';
  }

  let resp = '## Brechas de skills por trayectoria\n\n';

  for (const p of paths) {
    const employees = dashboard.filter((e) => e.position === p.from_role);
    if (employees.length === 0) continue;

    const ready = employees.filter((e) => Number(e.potential_score ?? 0) >= Number(p.min_readiness_score));
    const notReady = employees.length - ready.length;

    resp += `### ${p.from_role} → ${p.to_role} (${p.path_code})\n\n`;
    resp += `- Profesionales en puesto origen: **${employees.length}**\n`;
    resp += `- Cumplen readiness (≥${Math.round(Number(p.min_readiness_score))}): **${ready.length}**\n`;
    resp += `- No alcanzan umbral: **${notReady}**\n`;

    if (Array.isArray(p.required_skills) && p.required_skills.length > 0) {
      resp += `- Skills clave requeridas: ${p.required_skills.join(', ')}\n`;
    }
    resp += '\n';
  }

  return resp;
}

// ─── General fallback ────────────────────────────────────────────────

async function generalResponse(): Promise<string> {
  const { data: empCount } = await supabase.from('hr_employees').select('id', { count: 'exact', head: true });
  const { data: evalCount } = await supabase.from('performance_evaluations').select('id', { count: 'exact', head: true });
  const { data: actCount } = await supabase.from('hr_development_actions').select('id', { count: 'exact', head: true });

  let resp = '## Asistente de talento Bankinter\n\n';
  resp += 'Soy tu asistente para consultar datos integrados de RRHH. Puedes preguntarme sobre:\n\n';
  resp += '- **"Cuadro de mando de talento"** — visión global integrada\n';
  resp += '- **"Desempeño sostenido"** — ranking por evaluaciones\n';
  resp += '- **"Alto potencial"** — personas con mayor potencial y readiness\n';
  resp += '- **"Objetivos bonus M50"** — estado on-track / at-risk\n';
  resp += '- **"Riesgo sucesorio"** — posiciones críticas y cobertura\n';
  resp += '- **"Acciones de desarrollo"** — formación, mentoring, rotaciones\n';
  resp += '- **"Trayectorias profesionales"** — rutas de carrera y requisitos\n';
  resp += '- **"Brechas de skills"** — gaps respecto a trayectorias\n';
  resp += '- **"Plantilla"** — búsqueda de empleados\n';
  resp += '- **"Estructura organizativa"** — unidades y departamentos\n';

  const stats: string[] = [];
  if (empCount !== null) stats.push(`${(empCount as unknown as { count: number }).count ?? 0} empleados`);
  if (evalCount !== null) stats.push(`${(evalCount as unknown as { count: number }).count ?? 0} evaluaciones`);
  if (actCount !== null) stats.push(`${(actCount as unknown as { count: number }).count ?? 0} acciones`);

  if (stats.length > 0) {
    resp += `\n**Datos disponibles:** ${stats.join(' · ')}`;
  }

  return resp;
}
