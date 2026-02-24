import type {
  BonusObjective,
  CareerPathStep,
  DevelopmentAction,
  PerformanceEvaluation,
  PotentialAssessment,
  SuccessionRiskSnapshot,
} from "@/types/hr";
import type { IntegratedTalentEmployeeRow } from "@/lib/hr/queries";

const EMPLOYEES: Array<{
  id: string;
  name: string;
  bu: string;
  dept: string;
  pos: string;
  mgr: string | null;
}> = [
  { id: "emp-001", name: "Elena Martín Vega", bu: "Banca Comercial", dept: "Red Comercial Madrid", pos: "Directora de Oficina", mgr: null },
  { id: "emp-002", name: "Carlos Ruiz Hernández", bu: "Banca Comercial", dept: "Red Comercial Madrid", pos: "Gestor Comercial", mgr: "emp-001" },
  { id: "emp-003", name: "Ana García López", bu: "Banca Comercial", dept: "Red Comercial Cataluña", pos: "Gestor Comercial", mgr: "emp-001" },
  { id: "emp-004", name: "Miguel Torres Díaz", bu: "Banca Comercial", dept: "Red Comercial Andalucía", pos: "Gestor Comercial", mgr: "emp-001" },
  { id: "emp-005", name: "Laura Fernández Soto", bu: "Banca Privada", dept: "Patrimonio", pos: "Gestor Banca Privada", mgr: null },
  { id: "emp-006", name: "David Sánchez Navarro", bu: "Banca Privada", dept: "Patrimonio", pos: "Gestor Banca Privada", mgr: null },
  { id: "emp-007", name: "Patricia Moreno Ruiz", bu: "Banca Privada", dept: "HNWI", pos: "Director Banca Privada", mgr: null },
  { id: "emp-008", name: "Javier Ortega Gil", bu: "Riesgos", dept: "Riesgo Crediticio", pos: "Analista de Riesgos", mgr: null },
  { id: "emp-009", name: "Isabel Ramos Peña", bu: "Riesgos", dept: "Riesgo Crediticio", pos: "Analista de Riesgos", mgr: null },
  { id: "emp-010", name: "Roberto Jiménez Castro", bu: "Riesgos", dept: "Riesgo Operacional", pos: "Responsable de Riesgos", mgr: null },
  { id: "emp-011", name: "Marta Delgado Prieto", bu: "Tecnología", dept: "Desarrollo", pos: "Developer", mgr: null },
  { id: "emp-012", name: "Fernando Blanco Reyes", bu: "Tecnología", dept: "Desarrollo", pos: "Developer", mgr: null },
  { id: "emp-013", name: "Cristina López Aranda", bu: "Tecnología", dept: "Arquitectura", pos: "Tech Lead", mgr: null },
  { id: "emp-014", name: "Alejandro Muñoz Serrano", bu: "Tecnología", dept: "Producto Digital", pos: "Business Analyst", mgr: null },
  { id: "emp-015", name: "Beatriz Herrera Molina", bu: "Tecnología", dept: "Producto Digital", pos: "Product Owner", mgr: null },
  { id: "emp-016", name: "Raúl Campos Vargas", bu: "Personas", dept: "Talento", pos: "HR Business Partner", mgr: null },
  { id: "emp-017", name: "Sofía Navarro Díez", bu: "Personas", dept: "Formación", pos: "Responsable de Formación", mgr: null },
  { id: "emp-018", name: "Antonio Vidal Romero", bu: "Operaciones", dept: "Back Office", pos: "Responsable Operaciones", mgr: null },
  { id: "emp-019", name: "Carmen Iglesias Luna", bu: "Operaciones", dept: "Cumplimiento", pos: "Compliance Officer", mgr: null },
  { id: "emp-020", name: "Pablo Medina Fuentes", bu: "Banca Comercial", dept: "Red Comercial País Vasco", pos: "Gestor Comercial", mgr: "emp-001" },
  { id: "emp-021", name: "Lucía Romero Cabrera", bu: "Banca Comercial", dept: "Empresas", pos: "Gestor Banca Empresa", mgr: null },
  { id: "emp-022", name: "Daniel Guerrero Peña", bu: "Riesgos", dept: "Modelos", pos: "Analista de Riesgos", mgr: "emp-010" },
  { id: "emp-023", name: "Adriana Varela Santos", bu: "Tecnología", dept: "Data", pos: "Data Engineer", mgr: "emp-013" },
  { id: "emp-024", name: "Marcos Ibáñez Cano", bu: "Banca Privada", dept: "Inversiones", pos: "Gestor Banca Privada", mgr: "emp-007" },
];

function id(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

// ---------- Performance Evaluations ----------

function buildEvaluations(): PerformanceEvaluation[] {
  const evals: PerformanceEvaluation[] = [];
  const cycles = ["2024-H1", "2024-H2", "2025-H1"];
  let counter = 1;

  const scoreMap: Record<string, number[]> = {
    "emp-001": [88, 91, 90],
    "emp-002": [72, 68, 74],
    "emp-003": [85, 87, 89],
    "emp-004": [60, 63, 58],
    "emp-005": [92, 94, 93],
    "emp-006": [78, 75, 80],
    "emp-007": [95, 93, 96],
    "emp-008": [70, 72, 76],
    "emp-009": [82, 84, 81],
    "emp-010": [88, 86, 90],
    "emp-011": [65, 70, 73],
    "emp-012": [80, 82, 85],
    "emp-013": [90, 92, 91],
    "emp-014": [68, 72, 75],
    "emp-015": [85, 88, 86],
    "emp-016": [78, 80, 82],
    "emp-017": [84, 82, 86],
    "emp-018": [76, 74, 78],
    "emp-019": [90, 88, 92],
    "emp-020": [55, 60, 62],
    "emp-021": [82, 85, 87],
    "emp-022": [74, 78, 76],
    "emp-023": [86, 88, 90],
    "emp-024": [70, 72, 68],
  };

  for (const emp of EMPLOYEES) {
    const scores = scoreMap[emp.id] ?? [70, 72, 74];
    for (let i = 0; i < cycles.length; i++) {
      evals.push({
        id: id("eval", counter++),
        employeeId: emp.id,
        source: "CSOD",
        cycle: cycles[i],
        evaluationType: i === 1 ? "mid_year" : "annual",
        score: scores[i],
        normalizedScore: scores[i],
        qualitativeNotes: scores[i] >= 85 ? "Rendimiento sobresaliente, supera las expectativas del puesto" :
          scores[i] >= 75 ? "Cumple de forma sólida los objetivos asignados" :
          scores[i] >= 65 ? "Rendimiento adecuado con áreas de mejora identificadas" :
          "Necesita refuerzo en competencias clave del puesto",
        evaluator: emp.mgr ?? "Comité de evaluación",
        evaluatedAt: `2025-0${3 + i * 3}-15`,
      });
    }
  }
  return evals;
}

// ---------- Potential Assessments ----------

function buildPotentialAssessments(): PotentialAssessment[] {
  const assessments: PotentialAssessment[] = [];
  let counter = 1;

  const potentialMap: Record<string, { level: PotentialAssessment["potentialLevel"]; score: number; readiness: PotentialAssessment["readiness"] }> = {
    "emp-001": { level: "high", score: 88, readiness: "ready_now" },
    "emp-002": { level: "medium", score: 55, readiness: "ready_2y" },
    "emp-003": { level: "high", score: 82, readiness: "ready_1y" },
    "emp-004": { level: "low", score: 35, readiness: "not_ready" },
    "emp-005": { level: "high", score: 90, readiness: "ready_now" },
    "emp-006": { level: "medium", score: 60, readiness: "ready_1y" },
    "emp-007": { level: "high", score: 95, readiness: "ready_now" },
    "emp-008": { level: "medium", score: 62, readiness: "ready_2y" },
    "emp-009": { level: "high", score: 78, readiness: "ready_1y" },
    "emp-010": { level: "high", score: 85, readiness: "ready_now" },
    "emp-011": { level: "medium", score: 58, readiness: "ready_2y" },
    "emp-012": { level: "high", score: 76, readiness: "ready_1y" },
    "emp-013": { level: "high", score: 92, readiness: "ready_now" },
    "emp-014": { level: "medium", score: 64, readiness: "ready_1y" },
    "emp-015": { level: "high", score: 84, readiness: "ready_now" },
    "emp-016": { level: "medium", score: 68, readiness: "ready_1y" },
    "emp-017": { level: "high", score: 80, readiness: "ready_1y" },
    "emp-018": { level: "medium", score: 56, readiness: "ready_2y" },
    "emp-019": { level: "high", score: 86, readiness: "ready_now" },
    "emp-020": { level: "low", score: 38, readiness: "not_ready" },
    "emp-021": { level: "high", score: 79, readiness: "ready_1y" },
    "emp-022": { level: "medium", score: 65, readiness: "ready_2y" },
    "emp-023": { level: "high", score: 83, readiness: "ready_1y" },
    "emp-024": { level: "medium", score: 52, readiness: "ready_2y" },
  };

  for (const emp of EMPLOYEES) {
    const p = potentialMap[emp.id] ?? { level: "medium" as const, score: 50, readiness: "not_ready" as const };
    assessments.push({
      id: id("pot", counter++),
      employeeId: emp.id,
      source: "SOPRA",
      cycle: "2025-H1",
      potentialLevel: p.level,
      potentialScore: p.score,
      readiness: p.readiness,
      rationale: p.level === "high"
        ? "Demuestra capacidad para asumir responsabilidades superiores a corto-medio plazo"
        : p.level === "medium"
        ? "Perfil de crecimiento sostenido con desarrollo adicional necesario"
        : "Necesita consolidar competencias actuales antes de progresión",
      assessedAt: "2025-06-30",
    });
  }
  return assessments;
}

// ---------- Bonus Objectives ----------

function buildBonusObjectives(): BonusObjective[] {
  const objs: BonusObjective[] = [];
  let counter = 1;

  const objectiveTemplates: Array<{ code: string; name: string; weight: number }> = [
    { code: "OBJ-COM", name: "Captación neta de clientes", weight: 30 },
    { code: "OBJ-REN", name: "Margen de intermediación", weight: 25 },
    { code: "OBJ-SAT", name: "NPS Satisfacción cliente", weight: 20 },
    { code: "OBJ-DIG", name: "Índice de venta digital", weight: 15 },
    { code: "OBJ-COMP", name: "Cumplimiento normativo", weight: 10 },
  ];

  const statusOptions: BonusObjective["status"][] = ["on_track", "on_track", "on_track", "at_risk", "completed", "not_started"];

  for (const emp of EMPLOYEES) {
    const templates = objectiveTemplates.slice(0, 3 + Math.floor(Math.random() * 3));
    const totalWeight = templates.reduce((s, t) => s + t.weight, 0);
    for (const tpl of templates) {
      const normalizedWeight = Math.round((tpl.weight / totalWeight) * 100);
      const statusIdx = (counter + emp.id.charCodeAt(4)) % statusOptions.length;
      const status = statusOptions[statusIdx];
      const progress = status === "completed" ? 100 :
        status === "on_track" ? 60 + (counter % 30) :
        status === "at_risk" ? 20 + (counter % 25) :
        5;
      objs.push({
        id: id("obj", counter++),
        employeeId: emp.id,
        source: "M50",
        cycle: "2025",
        objectiveCode: `${tpl.code}-${emp.id.slice(-3)}`,
        objectiveName: tpl.name,
        weight: normalizedWeight,
        targetValue: 100,
        progressValue: progress,
        status,
        dueDate: "2025-12-31",
        importedAt: "2025-03-01T10:00:00Z",
      });
      counter++;
    }
  }
  return objs;
}

// ---------- Development Actions ----------

function buildDevelopmentActions(): DevelopmentAction[] {
  const actions: DevelopmentAction[] = [];
  let counter = 1;

  const templates: Array<{
    empId: string;
    type: DevelopmentAction["actionType"];
    title: string;
    reason: string;
    priority: DevelopmentAction["priority"];
    status: DevelopmentAction["status"];
  }> = [
    { empId: "emp-002", type: "training", title: "Certificación MiFID II avanzada", reason: "Gap normativo detectado para trayectoria a Director de Oficina", priority: "high", status: "in_progress" },
    { empId: "emp-003", type: "mentoring", title: "Mentoring con Directora de Oficina (Elena Martín)", reason: "Preparación para sucesión en Red Cataluña", priority: "high", status: "in_progress" },
    { empId: "emp-004", type: "training", title: "Programa de refuerzo en técnicas de venta consultiva", reason: "Desempeño bajo umbral sostenido en últimos 3 ciclos", priority: "high", status: "pending" },
    { empId: "emp-008", type: "training", title: "Máster en gestión avanzada de riesgo crediticio", reason: "Gap en análisis crediticio avanzado para rol de Responsable", priority: "medium", status: "pending" },
    { empId: "emp-009", type: "rotation", title: "Rotación a Riesgo Operacional (6 meses)", reason: "Ampliar bench para Responsable de Riesgos · potencial alto", priority: "medium", status: "pending" },
    { empId: "emp-011", type: "training", title: "Certificación Cloud Architecture (AWS/Azure)", reason: "Skill gap para trayectoria a Tech Lead", priority: "medium", status: "in_progress" },
    { empId: "emp-012", type: "mentoring", title: "Pair programming con Tech Lead (Cristina López)", reason: "Perfil high potential, preparación acelerada", priority: "medium", status: "in_progress" },
    { empId: "emp-014", type: "training", title: "Product Management Fundamentals", reason: "Gap en product strategy para trayectoria a Product Owner", priority: "medium", status: "pending" },
    { empId: "emp-020", type: "training", title: "Programa intensivo de habilidades comerciales", reason: "Rendimiento por debajo de umbral mínimo", priority: "high", status: "pending" },
    { empId: "emp-005", type: "succession", title: "Plan de sucesión Director Banca Privada", reason: "Candidata preferente para sustitución de Patricia Moreno a medio plazo", priority: "low", status: "completed" },
    { empId: "emp-021", type: "training", title: "Programa Banca Empresa avanzado", reason: "Desarrollo skill de análisis de balances y estructuración", priority: "medium", status: "in_progress" },
    { empId: "emp-023", type: "training", title: "Certificación Data Engineering (Spark, dbt)", reason: "Skill gap para trayectoria a Data Lead", priority: "medium", status: "pending" },
    { empId: "emp-006", type: "rotation", title: "Asignación temporal a HNWI (3 meses)", reason: "Ampliar experiencia con grandes patrimonios para readiness", priority: "low", status: "completed" },
    { empId: "emp-016", type: "training", title: "Certificación en People Analytics", reason: "Reforzar competencia analítica para HR Business Partner senior", priority: "low", status: "in_progress" },
  ];

  for (const t of templates) {
    actions.push({
      id: id("act", counter++),
      employeeId: t.empId,
      source: "automation",
      actionType: t.type,
      title: t.title,
      reason: t.reason,
      priority: t.priority,
      status: t.status,
      dueDate: t.status === "completed" ? "2025-06-30" : "2025-12-31",
      createdAt: "2025-03-15T09:00:00Z",
    });
  }
  return actions;
}

// ---------- Succession Risk Snapshots ----------

function buildSuccessionRiskSnapshots(): SuccessionRiskSnapshot[] {
  return [
    { id: "sr-001", positionId: "pos-001", positionName: "Director Banca Privada", businessUnit: "Banca Privada", riskLevel: "high", readinessCoverage: 35, benchSize: 2, snapshotDate: "2025-06-30" },
    { id: "sr-002", positionId: "pos-002", positionName: "Responsable de Riesgos", businessUnit: "Riesgos", riskLevel: "high", readinessCoverage: 45, benchSize: 2, snapshotDate: "2025-06-30" },
    { id: "sr-003", positionId: "pos-003", positionName: "Tech Lead", businessUnit: "Tecnología", riskLevel: "medium", readinessCoverage: 60, benchSize: 3, snapshotDate: "2025-06-30" },
    { id: "sr-004", positionId: "pos-004", positionName: "Directora de Oficina Madrid", businessUnit: "Banca Comercial", riskLevel: "medium", readinessCoverage: 55, benchSize: 2, snapshotDate: "2025-06-30" },
    { id: "sr-005", positionId: "pos-005", positionName: "Product Owner Digital", businessUnit: "Tecnología", riskLevel: "low", readinessCoverage: 80, benchSize: 4, snapshotDate: "2025-06-30" },
    { id: "sr-006", positionId: "pos-006", positionName: "Compliance Officer", businessUnit: "Operaciones", riskLevel: "high", readinessCoverage: 25, benchSize: 1, snapshotDate: "2025-06-30" },
    { id: "sr-007", positionId: "pos-007", positionName: "Responsable de Formación", businessUnit: "Personas", riskLevel: "low", readinessCoverage: 70, benchSize: 3, snapshotDate: "2025-06-30" },
    { id: "sr-008", positionId: "pos-008", positionName: "Director Banca Empresa", businessUnit: "Banca Comercial", riskLevel: "medium", readinessCoverage: 50, benchSize: 2, snapshotDate: "2025-06-30" },
  ];
}

// ---------- Career Paths ----------

function buildCareerPaths(): CareerPathStep[] {
  return [
    { id: "cp-001", pathCode: "COM-01", fromRole: "Gestor Comercial", toRole: "Director de Oficina", minReadinessScore: 75, requiredSkills: ["Liderazgo de equipos", "Gestión de P&L", "MiFID II avanzado", "Venta consultiva"] },
    { id: "cp-002", pathCode: "PRI-01", fromRole: "Gestor Banca Privada", toRole: "Director Banca Privada", minReadinessScore: 80, requiredSkills: ["Gestión de grandes patrimonios", "Planificación fiscal", "Relación institucional", "MiFID II avanzado"] },
    { id: "cp-003", pathCode: "RSK-01", fromRole: "Analista de Riesgos", toRole: "Responsable de Riesgos", minReadinessScore: 70, requiredSkills: ["Análisis crediticio avanzado", "Modelos de scoring", "Normativa Basilea III/IV", "Gestión de equipos"] },
    { id: "cp-004", pathCode: "TEC-01", fromRole: "Developer", toRole: "Tech Lead", minReadinessScore: 72, requiredSkills: ["Cloud Architecture", "System Design", "Code Review avanzado", "Mentoring técnico"] },
    { id: "cp-005", pathCode: "TEC-02", fromRole: "Business Analyst", toRole: "Product Owner", minReadinessScore: 68, requiredSkills: ["Product Strategy", "Métricas de producto", "User Research", "Agile avanzado"] },
    { id: "cp-006", pathCode: "COM-02", fromRole: "Gestor Banca Empresa", toRole: "Director Banca Empresa", minReadinessScore: 78, requiredSkills: ["Estructuración financiera", "Análisis de balances", "Negociación corporativa", "Gestión de cartera"] },
    { id: "cp-007", pathCode: "TEC-03", fromRole: "Data Engineer", toRole: "Data Lead", minReadinessScore: 70, requiredSkills: ["MLOps", "Data Governance", "Spark avanzado", "Liderazgo técnico"] },
    { id: "cp-008", pathCode: "HR-01", fromRole: "HR Business Partner", toRole: "Director de Personas", minReadinessScore: 80, requiredSkills: ["People Analytics", "Compensación y beneficios", "Relaciones laborales", "Diseño organizativo"] },
  ];
}

// ---------- Integrated Talent Rows ----------

function buildIntegratedTalentRows(
  evaluations: PerformanceEvaluation[],
  potential: PotentialAssessment[],
  objectives: BonusObjective[],
  actions: DevelopmentAction[],
): IntegratedTalentEmployeeRow[] {
  return EMPLOYEES.map((emp) => {
    const empEvals = evaluations.filter((e) => e.employeeId === emp.id);
    const avgScore = empEvals.length
      ? Math.round(empEvals.reduce((s, e) => s + e.normalizedScore, 0) / empEvals.length)
      : 0;
    const latestEval = empEvals.sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0] ?? null;

    const empPot = potential.find((p) => p.employeeId === emp.id) ?? null;

    const empObjs = objectives.filter((o) => o.employeeId === emp.id);
    const objsOnTrack = empObjs.filter((o) => o.status === "on_track" || o.status === "completed").length;

    const empActions = actions.filter((a) => a.employeeId === emp.id);
    const actionsPending = empActions.filter((a) => a.status !== "completed").length;

    return {
      employeeId: emp.id,
      fullName: emp.name,
      businessUnit: emp.bu,
      department: emp.dept,
      position: emp.pos,
      sustainedPerformanceScore: avgScore,
      latestEvalAt: latestEval?.evaluatedAt ?? null,
      potentialLevel: empPot?.potentialLevel ?? null,
      potentialScore: empPot?.potentialScore ?? null,
      readiness: empPot?.readiness ?? null,
      objectivesTotal: empObjs.length,
      objectivesOnTrack: objsOnTrack,
      actionsTotal: empActions.length,
      actionsPending,
    };
  });
}

// ---------- Singleton store (for mutations in mock mode) ----------

let _evaluations: PerformanceEvaluation[] | null = null;
let _potential: PotentialAssessment[] | null = null;
let _objectives: BonusObjective[] | null = null;
let _actions: DevelopmentAction[] | null = null;
let _successionRisks: SuccessionRiskSnapshot[] | null = null;
let _careerPaths: CareerPathStep[] | null = null;
let _rows: IntegratedTalentEmployeeRow[] | null = null;

function ensureInitialized() {
  if (!_evaluations) _evaluations = buildEvaluations();
  if (!_potential) _potential = buildPotentialAssessments();
  if (!_objectives) _objectives = buildBonusObjectives();
  if (!_actions) _actions = buildDevelopmentActions();
  if (!_successionRisks) _successionRisks = buildSuccessionRiskSnapshots();
  if (!_careerPaths) _careerPaths = buildCareerPaths();
  if (!_rows) _rows = buildIntegratedTalentRows(_evaluations, _potential, _objectives, _actions);
}

export function getMockEvaluations(): PerformanceEvaluation[] {
  ensureInitialized();
  return _evaluations!;
}

export function getMockPotentialAssessments(): PotentialAssessment[] {
  ensureInitialized();
  return _potential!;
}

export function getMockBonusObjectives(): BonusObjective[] {
  ensureInitialized();
  return _objectives!;
}

export function getMockDevelopmentActions(): DevelopmentAction[] {
  ensureInitialized();
  return _actions!;
}

export function getMockSuccessionRiskSnapshots(): SuccessionRiskSnapshot[] {
  ensureInitialized();
  return _successionRisks!;
}

export function getMockCareerPaths(): CareerPathStep[] {
  ensureInitialized();
  return _careerPaths!;
}

export function getMockIntegratedTalentRows(): IntegratedTalentEmployeeRow[] {
  ensureInitialized();
  return _rows!;
}

export function updateMockActionStatus(actionId: string, status: DevelopmentAction["status"]): void {
  ensureInitialized();
  const action = _actions!.find((a) => a.id === actionId);
  if (action) action.status = status;
  _rows = buildIntegratedTalentRows(_evaluations!, _potential!, _objectives!, _actions!);
}

export function addMockDevelopmentActions(newActions: DevelopmentAction[]): void {
  ensureInitialized();
  const existingIds = new Set(_actions!.map((a) => a.id));
  for (const a of newActions) {
    if (!existingIds.has(a.id)) {
      _actions!.push(a);
    }
  }
  _rows = buildIntegratedTalentRows(_evaluations!, _potential!, _objectives!, _actions!);
}
