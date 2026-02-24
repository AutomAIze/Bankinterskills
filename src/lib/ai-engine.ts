import { supabase } from './supabase';
import { openaiClient, OPENAI_MODEL } from './openai';

export interface ResponseMeta {
  section?: string;
}

export interface GenerateResult {
  text: string;
  meta?: ResponseMeta;
}

const SYSTEM_PROMPT = `Eres el asistente de talento de Bankinter, integrado en la plataforma "Talent Intelligence — Suite RRHH 360".

Tu misión es responder preguntas sobre la gestión del talento de la organización usando EXCLUSIVAMENTE los datos que se te proporcionan como contexto. Nunca inventes datos ni empleados.

Reglas de formato:
- Responde siempre en español.
- Usa Markdown: encabezados ##/###, tablas |...|, listas -, negritas **.
- Cuando muestres tablas, incluye encabezados claros y separadores |---|.
- Sé conciso pero completo. Prioriza datos cuantitativos.
- Si los datos de contexto están vacíos o no responden la pregunta, indícalo amablemente y sugiere qué puede preguntar el usuario.
- No incluyas saludos ni despedidas, ve directo a la respuesta.
- No añadas disclaimers sobre que eres una IA.

Módulos disponibles en la plataforma:
1. Cuadro de mando integrado (desempeño + potencial + objetivos + acciones)
2. Evaluaciones de desempeño (fuente CSOD)
3. Evaluaciones de potencial y readiness (fuente SOPRA)
4. Objetivos de bonus importados (fuente M50)
5. Acciones de desarrollo (formación, mentoring, rotación, sucesión)
6. Riesgo sucesorio por posición
7. Trayectorias profesionales y gaps de skills
8. Estructura organizativa (unidades, departamentos, personas)`;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesAny(q: string, keywords: string[]): boolean {
  return keywords.some((kw) => q.includes(kw));
}

interface DataBlock {
  label: string;
  rows: Record<string, unknown>[];
}

async function gatherContext(q: string): Promise<{ blocks: DataBlock[]; section: string }> {
  const blocks: DataBlock[] = [];
  let section = 'general';

  const fetchDashboard = async () => {
    const { data } = await supabase
      .from('hr_integrated_talent_dashboard_v')
      .select('*')
      .order('sustained_performance_score', { ascending: false })
      .limit(30);
    return data ?? [];
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('hr_employees')
      .select('id, full_name, position, business_unit, department, manager_id, active')
      .eq('active', true)
      .order('full_name')
      .limit(50);
    return data ?? [];
  };

  if (matchesAny(q, ['cuadro de mando', 'talento 360', 'vision integrada', 'vision completa', 'dashboard', 'resumen general', 'rrhh', 'general'])) {
    section = 'dashboard';
    blocks.push({ label: 'Cuadro de mando integrado', rows: await fetchDashboard() });
  }

  if (matchesAny(q, ['desempeno', 'desempeño', '9box', '9-box', 'rendimiento', 'evaluacion', 'evaluación'])) {
    section = 'performance';
    const { data } = await supabase
      .from('performance_evaluations')
      .select('employee_id, cycle, evaluation_type, score, normalized_score, qualitative_notes')
      .order('evaluated_at', { ascending: false })
      .limit(100);
    blocks.push({ label: 'Evaluaciones de desempeño', rows: data ?? [] });
    blocks.push({ label: 'Empleados', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['potencial', 'high potential', 'alto potencial', 'readiness'])) {
    section = 'potential';
    const { data } = await supabase
      .from('potential_assessments')
      .select('employee_id, potential_level, potential_score, readiness, rationale')
      .order('potential_score', { ascending: false })
      .limit(50);
    blocks.push({ label: 'Evaluaciones de potencial', rows: data ?? [] });
    blocks.push({ label: 'Empleados', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['formacion', 'formación', 'upskilling', 'reskilling', 'plan de desarrollo', 'recomendacion', 'capacitacion', 'mentoring'])) {
    section = 'training';
    const { data } = await supabase
      .from('hr_development_actions')
      .select('*')
      .in('action_type', ['training', 'mentoring'])
      .order('created_at', { ascending: false })
      .limit(30);
    blocks.push({ label: 'Acciones de formación y mentoring', rows: data ?? [] });
    blocks.push({ label: 'Empleados', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['objetivo', 'bonus', 'm50', 'on track', 'at risk', 'incentivo', 'variable'])) {
    section = 'objectives';
    const { data } = await supabase
      .from('bonus_objectives')
      .select('*')
      .order('imported_at', { ascending: false })
      .limit(50);
    blocks.push({ label: 'Objetivos de bonus (M50)', rows: data ?? [] });
    blocks.push({ label: 'Empleados', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['sucesion', 'sucesorio', 'sucesoria', 'riesgo sucesorio', 'bench', 'cobertura sucesoria'])) {
    section = 'succession';
    const { data } = await supabase
      .from('hr_succession_risk_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(30);
    blocks.push({ label: 'Riesgo sucesorio por posición', rows: data ?? [] });
  }

  if (matchesAny(q, ['trayectoria', 'trayectorias', 'career path', 'movilidad', 'carrera', 'promocion', 'promoción'])) {
    section = 'career';
    const { data } = await supabase
      .from('hr_career_paths')
      .select('*')
      .order('path_code')
      .limit(30);
    blocks.push({ label: 'Trayectorias profesionales', rows: data ?? [] });
    blocks.push({ label: 'Cuadro de mando (posición y readiness)', rows: await fetchDashboard() });
  }

  if (matchesAny(q, ['accion automatica', 'automatizacion', 'automatizaciones', 'acciones pendientes', 'workflow', 'accion de desarrollo', 'acciones de desarrollo', 'accion', 'acciones'])) {
    section = 'actions';
    const { data } = await supabase
      .from('hr_development_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    blocks.push({ label: 'Acciones de desarrollo', rows: data ?? [] });
    blocks.push({ label: 'Empleados', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['empleado', 'persona', 'plantilla', 'equipo', 'organigrama', 'quien', 'quienes', 'busca', 'buscar'])) {
    section = 'employees';
    blocks.push({ label: 'Plantilla', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['unidad', 'departamento', 'area', 'negocio', 'estructura', 'organizacion'])) {
    section = 'units';
    blocks.push({ label: 'Plantilla (estructura)', rows: await fetchEmployees() });
  }

  if (matchesAny(q, ['gap', 'gaps', 'brecha', 'brechas', 'carencia', 'skill', 'competencia'])) {
    section = 'gaps';
    const { data: paths } = await supabase.from('hr_career_paths').select('*');
    blocks.push({ label: 'Trayectorias (skills requeridas)', rows: paths ?? [] });
    blocks.push({ label: 'Cuadro de mando (posición actual)', rows: await fetchDashboard() });
  }

  if (blocks.length === 0) {
    section = 'general';
    blocks.push({ label: 'Cuadro de mando integrado', rows: await fetchDashboard() });

    const { data: actions } = await supabase
      .from('hr_development_actions')
      .select('id, employee_id, action_type, title, priority, status')
      .order('created_at', { ascending: false })
      .limit(10);
    blocks.push({ label: 'Últimas acciones de desarrollo', rows: actions ?? [] });

    const { data: succession } = await supabase
      .from('hr_succession_risk_snapshots')
      .select('position_name, business_unit, risk_level, readiness_coverage, bench_size')
      .limit(10);
    blocks.push({ label: 'Riesgo sucesorio', rows: succession ?? [] });
  }

  return { blocks, section };
}

function blocksToText(blocks: DataBlock[]): string {
  return blocks
    .filter((b) => b.rows.length > 0)
    .map((b) => {
      const sample = b.rows.slice(0, 25);
      return `### ${b.label} (${b.rows.length} registros)\n${JSON.stringify(sample, null, 1)}`;
    })
    .join('\n\n');
}

async function callOpenAI(question: string, contextText: string): Promise<string> {
  if (!openaiClient) {
    throw new Error('NO_API_KEY');
  }

  const response = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `## Datos de contexto (Supabase)\n\n${contextText}\n\n---\n\n## Pregunta del usuario\n\n${question}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? 'No se pudo generar una respuesta.';
}

// ─── Fallback sin OpenAI (respuestas locales) ────────────────────────

function localFallback(question: string, blocks: DataBlock[], section: string): string {
  const q = normalize(question);

  if (section === 'dashboard' || section === 'general') {
    return buildDashboardResponse(blocks);
  }
  if (section === 'performance') return buildPerformanceResponse(blocks);
  if (section === 'potential') return buildPotentialResponse(blocks);
  if (section === 'objectives') return buildObjectivesResponse(blocks);
  if (section === 'succession') return buildSuccessionResponse(blocks);
  if (section === 'career') return buildCareerResponse(blocks);
  if (section === 'actions') return buildActionsResponse(blocks);
  if (section === 'training') return buildTrainingResponse(blocks);
  if (section === 'employees' || section === 'units') return buildEmployeesResponse(blocks, q);
  if (section === 'gaps') return buildGapsResponse(blocks);

  return buildGeneralResponse();
}

function getBlock(blocks: DataBlock[], label: string): Record<string, unknown>[] {
  return blocks.find((b) => b.label.startsWith(label))?.rows ?? [];
}

function empName(employees: Record<string, unknown>[], id: string): string {
  const emp = employees.find((e) => e.id === id);
  return (emp?.full_name as string) ?? id;
}

const READINESS_L: Record<string, string> = { ready_now: 'Listo ahora', ready_1y: '1 año', ready_2y: '2 años', not_ready: 'No listo' };
const STATUS_L: Record<string, string> = { not_started: 'Sin iniciar', on_track: 'En curso', at_risk: 'En riesgo', completed: 'Completado', pending: 'Pendiente', in_progress: 'En progreso' };
const ACTION_L: Record<string, string> = { training: 'Formación', mentoring: 'Mentoring', rotation: 'Rotación', succession: 'Sucesión' };
const PRIORITY_L: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };
const POTENTIAL_L: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'Alto' };

function buildDashboardResponse(blocks: DataBlock[]): string {
  const rows = getBlock(blocks, 'Cuadro de mando');
  if (!rows.length) return 'No hay datos integrados de talento disponibles.';

  const total = rows.length;
  const highPerf = rows.filter((r) => Number(r.sustained_performance_score ?? 0) >= 80).length;
  const highPot = rows.filter((r) => Number(r.potential_score ?? 0) >= 75).length;

  let resp = '## Cuadro de mando integrado de talento\n\n';
  resp += `- Profesionales: **${total}**\n`;
  resp += `- Desempeño alto (≥80): **${highPerf}**\n`;
  resp += `- Alto potencial (≥75): **${highPot}**\n\n`;
  resp += '| Persona | Unidad | Puesto | Desempeño | Potencial | Readiness |\n|---|---|---|---|---|---|\n';
  for (const r of rows.slice(0, 12)) {
    resp += `| **${r.full_name}** | ${r.business_unit ?? '—'} | ${r.position ?? '—'} | ${Math.round(Number(r.sustained_performance_score ?? 0))} | ${Math.round(Number(r.potential_score ?? 0))} | ${READINESS_L[r.readiness as string] ?? '—'} |\n`;
  }
  return resp;
}

function buildPerformanceResponse(blocks: DataBlock[]): string {
  const evals = getBlock(blocks, 'Evaluaciones de desempeño');
  const employees = getBlock(blocks, 'Empleados');
  if (!evals.length) return 'No hay evaluaciones de desempeño.';

  const byEmp = new Map<string, { total: number; count: number }>();
  for (const ev of evals) {
    const e = byEmp.get(ev.employee_id as string) ?? { total: 0, count: 0 };
    e.total += Number(ev.normalized_score); e.count++;
    byEmp.set(ev.employee_id as string, e);
  }
  const ranked = [...byEmp.entries()].map(([id, d]) => ({ id, avg: d.total / d.count })).sort((a, b) => b.avg - a.avg);

  let resp = '## Desempeño sostenido\n\n| # | Persona | Media |\n|---|---|---|\n';
  for (let i = 0; i < Math.min(ranked.length, 15); i++) {
    resp += `| ${i + 1} | **${empName(employees, ranked[i].id)}** | ${Math.round(ranked[i].avg)} |\n`;
  }
  return resp;
}

function buildPotentialResponse(blocks: DataBlock[]): string {
  const assessments = getBlock(blocks, 'Evaluaciones de potencial');
  const employees = getBlock(blocks, 'Empleados');
  if (!assessments.length) return 'No hay evaluaciones de potencial.';

  let resp = '## Potencial y readiness\n\n| Persona | Potencial | Score | Readiness |\n|---|---|---|---|\n';
  for (const a of assessments.slice(0, 15)) {
    resp += `| **${empName(employees, a.employee_id as string)}** | ${POTENTIAL_L[a.potential_level as string] ?? a.potential_level} | ${Math.round(Number(a.potential_score))} | ${READINESS_L[a.readiness as string] ?? a.readiness} |\n`;
  }
  return resp;
}

function buildObjectivesResponse(blocks: DataBlock[]): string {
  const objectives = getBlock(blocks, 'Objetivos de bonus');
  const employees = getBlock(blocks, 'Empleados');
  if (!objectives.length) return 'No hay objetivos de bonus importados.';

  let resp = '## Objetivos de bonus (M50)\n\n| Persona | Objetivo | Progreso | Estado |\n|---|---|---|---|\n';
  for (const o of objectives) {
    resp += `| **${empName(employees, o.employee_id as string)}** | ${o.objective_name} | ${Math.round(Number(o.progress_value ?? 0))}% | ${STATUS_L[o.status as string] ?? o.status} |\n`;
  }
  return resp;
}

function buildSuccessionResponse(blocks: DataBlock[]): string {
  const snapshots = getBlock(blocks, 'Riesgo sucesorio');
  if (!snapshots.length) return 'No hay datos de riesgo sucesorio.';

  let resp = '## Riesgo sucesorio\n\n| Posición | Unidad | Riesgo | Cobertura | Bench |\n|---|---|---|---|---|\n';
  for (const s of snapshots) {
    resp += `| **${s.position_name}** | ${s.business_unit} | ${(s.risk_level as string) === 'high' ? '**ALTO**' : s.risk_level} | ${Math.round(Number(s.readiness_coverage ?? 0))}% | ${s.bench_size} |\n`;
  }
  return resp;
}

function buildCareerResponse(blocks: DataBlock[]): string {
  const paths = getBlock(blocks, 'Trayectorias');
  if (!paths.length) return 'No hay trayectorias profesionales configuradas.';

  let resp = '## Trayectorias profesionales\n\n| Código | Desde | Hacia | Readiness mín. | Skills |\n|---|---|---|---|---|\n';
  for (const p of paths) {
    const skills = Array.isArray(p.required_skills) ? (p.required_skills as string[]).join(', ') : '—';
    resp += `| **${p.path_code}** | ${p.from_role} | ${p.to_role} | ${Math.round(Number(p.min_readiness_score ?? 0))} | ${skills} |\n`;
  }
  return resp;
}

function buildActionsResponse(blocks: DataBlock[]): string {
  const actions = getBlock(blocks, 'Acciones de desarrollo');
  const employees = getBlock(blocks, 'Empleados');
  if (!actions.length) return 'No hay acciones de desarrollo.';

  const pending = actions.filter((a) => a.status === 'pending').length;
  const inProg = actions.filter((a) => a.status === 'in_progress').length;

  let resp = `## Acciones de desarrollo\n\n- Pendientes: **${pending}** · En progreso: **${inProg}**\n\n`;
  resp += '| Persona | Tipo | Acción | Prioridad | Estado |\n|---|---|---|---|---|\n';
  for (const a of actions) {
    const name = (a.employee_id as string) === 'UNASSIGNED' ? 'Sin asignar' : empName(employees, a.employee_id as string);
    resp += `| **${name}** | ${ACTION_L[a.action_type as string] ?? a.action_type} | ${a.title} | ${PRIORITY_L[a.priority as string] ?? a.priority} | ${STATUS_L[a.status as string] ?? a.status} |\n`;
  }
  return resp;
}

function buildTrainingResponse(blocks: DataBlock[]): string {
  return buildActionsResponse(blocks);
}

function buildEmployeesResponse(blocks: DataBlock[], q: string): string {
  const employees = getBlock(blocks, 'Plantilla');
  if (!employees.length) return 'No hay empleados en el sistema.';

  const filtered = employees.filter((e) => {
    const text = normalize(`${e.full_name} ${e.position ?? ''} ${e.business_unit ?? ''} ${e.department ?? ''}`);
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    return words.length === 0 || words.some((w) => text.includes(w));
  });
  const list = filtered.length > 0 ? filtered : employees;

  let resp = `## Plantilla (${list.length})\n\n| Nombre | Puesto | Unidad | Departamento |\n|---|---|---|---|\n`;
  for (const e of list.slice(0, 25)) {
    resp += `| **${e.full_name}** | ${e.position ?? '—'} | ${e.business_unit ?? '—'} | ${e.department ?? '—'} |\n`;
  }
  return resp;
}

function buildGapsResponse(blocks: DataBlock[]): string {
  const paths = getBlock(blocks, 'Trayectorias');
  const dashboard = getBlock(blocks, 'Cuadro de mando');
  if (!paths.length) return 'No hay trayectorias para analizar gaps.';

  let resp = '## Brechas de skills\n\n';
  for (const p of paths) {
    const inRole = dashboard.filter((d) => d.position === p.from_role);
    if (!inRole.length) continue;
    const ready = inRole.filter((d) => Number(d.potential_score ?? 0) >= Number(p.min_readiness_score));
    resp += `### ${p.from_role} → ${p.to_role}\n- En puesto: **${inRole.length}** · Cumplen readiness: **${ready.length}**\n`;
    if (Array.isArray(p.required_skills)) resp += `- Skills requeridas: ${(p.required_skills as string[]).join(', ')}\n`;
    resp += '\n';
  }
  return resp;
}

function buildGeneralResponse(): string {
  return '## Asistente de talento Bankinter\n\nPuedes preguntarme sobre:\n- **Cuadro de mando** — visión global\n- **Desempeño** — ranking por evaluaciones\n- **Potencial** — readiness y alto potencial\n- **Objetivos bonus** — estado M50\n- **Riesgo sucesorio** — posiciones críticas\n- **Acciones de desarrollo** — formación, mentoring\n- **Trayectorias** — rutas de carrera\n- **Brechas de skills** — gaps por trayectoria\n- **Plantilla** — búsqueda de empleados';
}

// ─── Public API ──────────────────────────────────────────────────────

export async function generateResponse(
  question: string,
  _context: { roleId?: string; candidateId?: string }
): Promise<GenerateResult> {
  const q = normalize(question);
  const { blocks, section } = await gatherContext(q);

  if (openaiClient) {
    try {
      const contextText = blocksToText(blocks);
      const text = await callOpenAI(question, contextText);
      return { text, meta: { section } };
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        return { text: localFallback(question, blocks, section), meta: { section } };
      }
      console.error('OpenAI error, falling back to local:', err);
      return { text: localFallback(question, blocks, section), meta: { section } };
    }
  }

  return { text: localFallback(question, blocks, section), meta: { section } };
}
