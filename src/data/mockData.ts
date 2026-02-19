export interface Skill {
  name: string;
  weight: number; // 0-100 importance for the role
}

export interface Role {
  id: string;
  name: string;
  unit: string;
  description: string;
  skills: Skill[];
}

export interface CandidateSkill {
  name: string;
  level: number; // 0-100
  expected: number; // 0-100 (from role model)
}

export type CandidateStatus = 'nuevo' | 'recomendado' | 'descartado' | 'en_pool';

export interface Candidate {
  id: string;
  name: string;
  roleId: string;
  globalScore: number;
  skills: CandidateSkill[];
  status: CandidateStatus;
}

export const roles: Role[] = [
  {
    id: 'gestor-oficina-empresas',
    name: 'Gestor de Oficina Empresas',
    unit: 'Banca de Empresas',
    description: 'Responsable de la gestión integral de clientes empresa, asesoramiento financiero y desarrollo comercial de la cartera asignada.',
    skills: [
      { name: 'Gestión Comercial', weight: 95 },
      { name: 'Análisis Financiero', weight: 85 },
      { name: 'Negociación', weight: 80 },
      { name: 'Normativa Bancaria', weight: 75 },
      { name: 'Gestión de Riesgos', weight: 70 },
      { name: 'Comunicación', weight: 65 },
    ],
  },
  {
    id: 'analista-riesgo',
    name: 'Analista de Riesgo',
    unit: 'Dirección de Riesgos',
    description: 'Evaluación y seguimiento del riesgo crediticio, elaboración de informes y modelos de scoring para la toma de decisiones.',
    skills: [
      { name: 'Gestión de Riesgos', weight: 95 },
      { name: 'Análisis Financiero', weight: 90 },
      { name: 'Modelización Estadística', weight: 85 },
      { name: 'Normativa Bancaria', weight: 80 },
      { name: 'Python / SQL', weight: 70 },
      { name: 'Comunicación', weight: 55 },
    ],
  },
  {
    id: 'gestor-banca-personal',
    name: 'Gestor de Banca Personal',
    unit: 'Banca Personal',
    description: 'Asesoramiento financiero personalizado a clientes de alto valor, gestión patrimonial y planificación de inversiones.',
    skills: [
      { name: 'Asesoramiento Financiero', weight: 95 },
      { name: 'Gestión Comercial', weight: 85 },
      { name: 'Productos de Inversión', weight: 80 },
      { name: 'Comunicación', weight: 80 },
      { name: 'Normativa MiFID', weight: 75 },
      { name: 'Gestión de Carteras', weight: 70 },
    ],
  },
  {
    id: 'especialista-datos',
    name: 'Especialista en Ciencia de Datos',
    unit: 'Transformación Digital',
    description: 'Desarrollo de modelos analíticos, machine learning y soluciones basadas en datos para optimizar procesos y productos bancarios.',
    skills: [
      { name: 'Machine Learning', weight: 95 },
      { name: 'Python / SQL', weight: 90 },
      { name: 'Modelización Estadística', weight: 90 },
      { name: 'Visualización de Datos', weight: 75 },
      { name: 'Cloud / Big Data', weight: 70 },
      { name: 'Comunicación', weight: 55 },
    ],
  },
];

const firstNames = [
  'María', 'Carlos', 'Ana', 'Javier', 'Laura', 'Daniel', 'Elena', 'Pablo',
  'Sofía', 'Alejandro', 'Marta', 'Sergio', 'Isabel', 'Andrés', 'Lucía',
  'Raúl', 'Patricia', 'Diego', 'Carmen', 'Álvaro',
];

const lastNames = [
  'García López', 'Martínez Ruiz', 'Fernández Torres', 'Sánchez Moreno',
  'Rodríguez Díaz', 'López Hernández', 'González Muñoz', 'Hernández Álvarez',
  'Pérez Romero', 'Gómez Navarro', 'Díaz Castro', 'Muñoz Ortega',
  'Álvarez Gil', 'Romero Jiménez', 'Navarro Serrano', 'Torres Delgado',
  'Jiménez Vega', 'Ruiz Molina', 'Moreno Blanco', 'Ortega Suárez',
];

function generateCandidatesForRole(role: Role, count: number): Candidate[] {
  const candidates: Candidate[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    // Create candidate archetype: strong, medium, or weak
    const archetype = i < count * 0.3 ? 'strong' : i < count * 0.7 ? 'medium' : 'weak';
    const baseOffset = archetype === 'strong' ? 15 : archetype === 'medium' ? -5 : -25;

    const skills: CandidateSkill[] = role.skills.map((rs) => {
      const variation = Math.floor(Math.random() * 20) - 10;
      const level = Math.min(100, Math.max(10, rs.weight + baseOffset + variation));
      return {
        name: rs.name,
        level,
        expected: rs.weight,
      };
    });

    const globalScore = Math.round(
      skills.reduce((sum, s) => {
        const roleSkill = role.skills.find((rs) => rs.name === s.name)!;
        return sum + s.level * (roleSkill.weight / 100);
      }, 0) / skills.reduce((sum, s) => {
        const roleSkill = role.skills.find((rs) => rs.name === s.name)!;
        return sum + roleSkill.weight / 100;
      }, 0)
    );

    const statuses: CandidateStatus[] = ['nuevo', 'recomendado', 'en_pool', 'descartado'];
    let status: CandidateStatus;
    if (globalScore >= 80) status = Math.random() > 0.3 ? 'recomendado' : 'nuevo';
    else if (globalScore >= 60) status = Math.random() > 0.5 ? 'nuevo' : 'en_pool';
    else status = Math.random() > 0.4 ? 'descartado' : 'nuevo';

    candidates.push({
      id: `${role.id}-${i + 1}`,
      name,
      roleId: role.id,
      globalScore,
      skills,
      status,
    });
  }

  return candidates.sort((a, b) => b.globalScore - a.globalScore);
}

export const candidates: Candidate[] = roles.flatMap((role) =>
  generateCandidatesForRole(role, 15)
);

export function getCandidatesForRole(roleId: string): Candidate[] {
  return candidates.filter((c) => c.roleId === roleId);
}

export function getCandidateById(candidateId: string): Candidate | undefined {
  return candidates.find((c) => c.id === candidateId);
}

export function getRoleById(roleId: string): Role | undefined {
  return roles.find((r) => r.id === roleId);
}

export function getScoreLabel(score: number): { label: string; color: 'high' | 'medium' | 'low' } {
  if (score >= 80) return { label: 'Alto encaje', color: 'high' };
  if (score >= 60) return { label: 'Encaje medio', color: 'medium' };
  return { label: 'Bajo encaje', color: 'low' };
}

export function getStatusLabel(status: CandidateStatus): string {
  const labels: Record<CandidateStatus, string> = {
    nuevo: 'Nuevo',
    recomendado: 'Recomendado',
    descartado: 'Descartado',
    en_pool: 'En pool',
  };
  return labels[status];
}
