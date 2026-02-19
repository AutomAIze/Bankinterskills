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
}

export const PIPELINE_CONFIG: Record<PipelineStage, { label: string; shortLabel: string; color: string; bgClass: string; textClass: string; borderClass: string }> = {
  applied:     { label: 'Aplicado',    shortLabel: 'Apl',  color: '#94a3b8', bgClass: 'bg-slate-400',     textClass: 'text-slate-500',     borderClass: 'border-slate-300' },
  screened:    { label: 'Filtrado',    shortLabel: 'Filt', color: '#3b82f6', bgClass: 'bg-blue-500',      textClass: 'text-blue-600',      borderClass: 'border-blue-300' },
  validated:   { label: 'Validado',    shortLabel: 'Val',  color: '#0891b2', bgClass: 'bg-cyan-600',      textClass: 'text-cyan-700',      borderClass: 'border-cyan-300' },
  shortlisted: { label: 'Shortlist',   shortLabel: 'Shl',  color: '#0d9488', bgClass: 'bg-teal-600',      textClass: 'text-teal-700',      borderClass: 'border-teal-300' },
  interview:   { label: 'Entrevista',  shortLabel: 'Ent',  color: '#003DA5', bgClass: 'bg-primary',       textClass: 'text-primary',       borderClass: 'border-primary/30' },
  offer:       { label: 'Oferta',      shortLabel: 'Ofe',  color: '#059669', bgClass: 'bg-emerald-600',   textClass: 'text-emerald-700',   borderClass: 'border-emerald-300' },
  hired:       { label: 'Contratado',  shortLabel: 'Con',  color: '#047857', bgClass: 'bg-emerald-700',   textClass: 'text-emerald-800',   borderClass: 'border-emerald-400' },
  rejected:    { label: 'Descartado',  shortLabel: 'Desc', color: '#dc2626', bgClass: 'bg-red-600',       textClass: 'text-red-600',       borderClass: 'border-red-300' },
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
  return { label: source === 'SABADELL' ? 'Sabadell' : 'Declarativo', type: 'declarative' };
}
