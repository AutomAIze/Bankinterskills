import { brandConfig } from "./brand";

export const navLabels = {
  assistant: "Asistente",
  talentDashboard: "Cuadro de Mando",
  performance: "Desempeño y Potencial",
  succession: "Mapa de Talento",
  objectives: "Objetivos Bonus",
  development: "Planes de Desarrollo",
  careerPaths: "Trayectorias",
  taxonomy: "Taxonomía",
  intelligence: "Skills Intelligence",
  admin: "Admin",
} as const;

export const loginLabels = {
  heroTagline: brandConfig.platformName,
  heroTitle: "Gestión integral del talento",
  heroSubtitle:
    "Plataforma RRHH 360 para conectar desempeño, potencial, formación, sucesión y objetivos del bonus.",
  accessTitle: "Iniciar sesión",
  accessSubtitle: "Accede a la plataforma de talento",
  demoAccess: "Acceso demo",
} as const;

export const chatLabels = {
  footerSignature: `${brandConfig.platformName} · ${brandConfig.clientName}`,
  emptyStateTitle: "Asistente de talento",
  emptyStateSubtitle:
    "Consulta indicadores de trayectoria, evaluación, formación, sucesión y objetivos importados.",
} as const;

export const integrationLabels = {
  sources: {
    csod: "CSOD (MiFid)",
    sopra: "Sopra",
    m50: "M50",
  },
} as const;
