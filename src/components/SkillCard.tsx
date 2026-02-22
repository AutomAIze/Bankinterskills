import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CandidateSkill } from '@/data/mockData';

interface SkillCardProps {
  skill: CandidateSkill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);
  const diff = skill.level - skill.expected;
  const status = diff >= 0 ? 'above' : diff >= -10 ? 'aligned' : 'below';
  const isSoft = skill.skillType === 'soft';

  return (
    <div
      className={`border transition-all duration-200 ${
        isSoft
          ? 'border-accent/40 bg-accent/[0.04] hover:border-accent/60'
          : 'border-border/80 bg-card hover:border-primary/30'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        <span className="flex-1 min-w-0 text-[12px] sm:text-[13px] font-medium text-foreground leading-tight">
          {skill.name}
        </span>
        <span
          className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${
            isSoft ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isSoft ? 'Soft' : 'Hard'}
        </span>
        <span className="text-[11px] sm:text-xs text-muted-foreground tabular-nums shrink-0">
          {skill.level}/{skill.expected}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-0 border-t border-border/60">
          <div className="flex items-center gap-2 sm:gap-3 mt-2">
            <div className="flex-1 h-2 bg-muted overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 ${
                  status === 'above' ? 'bg-score-high' : status === 'aligned' ? 'bg-score-medium' : 'bg-score-low'
                }`}
                style={{ width: `${skill.level}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-navy/50"
                style={{ left: `${skill.expected}%` }}
                title={`Nivel esperado: ${skill.expected}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              Gap: {diff >= 0 ? '+' : ''}{diff}
            </span>
          </div>
          {isSoft && (
            <p className="text-[10px] text-accent/80 mt-1.5">
              Soft skill evaluable por Panorama y futura IA
            </p>
          )}
        </div>
      )}
    </div>
  );
}
