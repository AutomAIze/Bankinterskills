export interface Skill {
  name: string;
  weight: number;
}

export interface Role {
  id: string;
  name: string;
  unit: string;
  description: string;
  skills: Skill[];
  positionsCount: number;
  declarativeWeight: number;
  scientificWeight: number;
}

export interface CandidateSkill {
  name: string;
  level: number;
  expected: number;
  /** 'soft' | 'hard' - from hr_dimension in DB */
  skillType?: 'soft' | 'hard';
}

export type CandidateStatus = 'nuevo' | 'recomendado' | 'descartado' | 'en_pool';

export type PipelineStage = 'applied' | 'screened' | 'validated' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  name: string;
  roleId: string;
  globalScore: number;
  declarativeScore: number;
  validatedScore: number | null;
  combinedScore: number;
  confidence: number;
  pipelineStage: PipelineStage;
  skills: CandidateSkill[];
  status: CandidateStatus;
  /** Adecuación asignada por RRHH (0-100%) */
  hrAdequacyPercentage?: number | null;
}

export const PIPELINE_CONFIG: Record<PipelineStage, { label: string; shortLabel: string; color: string; bgClass: string; textClass: string; borderClass: string }> = {
  applied:     { label: 'Aplicado',    shortLabel: 'Apl',  color: 'hsl(215, 35%, 65%)', bgClass: 'bg-muted-foreground/40', textClass: 'text-muted-foreground',  borderClass: 'border-border' },
  screened:    { label: 'Filtrado',    shortLabel: 'Filt', color: 'hsl(215, 48%, 52%)', bgClass: 'bg-[hsl(215,48%,52%)]', textClass: 'text-[hsl(215,48%,52%)]', borderClass: 'border-[hsl(215,48%,52%)]/30' },
  validated:   { label: 'Validado',    shortLabel: 'Val',  color: 'hsl(192, 100%, 38%)', bgClass: 'bg-accent',             textClass: 'text-accent',             borderClass: 'border-accent/30' },
  shortlisted: { label: 'Shortlist',   shortLabel: 'Shl',  color: 'hsl(205, 75%, 48%)', bgClass: 'bg-[hsl(205,75%,48%)]', textClass: 'text-[hsl(205,75%,48%)]', borderClass: 'border-[hsl(205,75%,48%)]/30' },
  interview:   { label: 'Entrevista',  shortLabel: 'Ent',  color: 'hsl(218, 100%, 32%)', bgClass: 'bg-primary',            textClass: 'text-primary',            borderClass: 'border-primary/30' },
  offer:       { label: 'Oferta',      shortLabel: 'Ofe',  color: 'hsl(218, 100%, 26%)', bgClass: 'bg-primary/80',         textClass: 'text-primary/80',         borderClass: 'border-primary/20' },
  hired:       { label: 'Contratado',  shortLabel: 'Con',  color: 'hsl(215, 50%, 14%)', bgClass: 'bg-navy',               textClass: 'text-navy',               borderClass: 'border-navy/30' },
  rejected:    { label: 'Descartado',  shortLabel: 'Desc', color: 'hsl(5, 58%, 44%)',   bgClass: 'bg-destructive',        textClass: 'text-destructive',        borderClass: 'border-destructive/30' },
};

export const PIPELINE_ORDER: PipelineStage[] = ['applied', 'screened', 'validated', 'shortlisted', 'interview', 'offer', 'hired'];

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

export function getPipelineLabel(stage: PipelineStage): string {
  return PIPELINE_CONFIG[stage]?.label ?? stage;
}

export function getConfidenceLabel(confidence: number): { label: string; color: 'high' | 'medium' | 'low' } {
  if (confidence >= 0.75) return { label: 'Alta', color: 'high' };
  if (confidence >= 0.50) return { label: 'Media', color: 'medium' };
  return { label: 'Baja', color: 'low' };
}

export function getSourceLabel(source: string): { label: string; type: 'declarative' | 'scientific' } {
  const scientific = ['PANORAMA', 'TKT_AGENT'];
  if (scientific.includes(source)) return { label: source === 'PANORAMA' ? 'Panorama' : 'TKT Agent', type: 'scientific' };
  return { label: source === 'SABADELL' ? 'Cliente' : 'Declarativo', type: 'declarative' };
}
