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
  heroTitle: "Cuadro de mando integrado del talento",
  heroSubtitle:
    "Conecta CSOD, Sopra y M50 en una sola vista: desempeño, potencial, objetivos de bonus, sucesión, recomendaciones de formación y acciones de desarrollo.",
  accessTitle: "Iniciar sesión",
  accessSubtitle: "Accede a la plataforma de talento",
  demoAccess: "Acceso demo",
} as const;

export const chatLabels = {
  footerSignature: `${brandConfig.platformName} · ${brandConfig.clientName}`,
  emptyStateTitle: "Asistente de talento",
  emptyStateSubtitle:
    "Consulta datos integrados de CSOD, Sopra y M50: cuadro de mando, desempeño, potencial, objetivos bonus, sucesión, formación y trayectorias.",
} as const;

export const integrationLabels = {
  sources: {
    csod: "CSOD (MiFid)",
    sopra: "Sopra",
    m50: "M50",
  },
} as const;
