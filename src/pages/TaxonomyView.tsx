import { useState, useMemo } from 'react';
import { useSkillsTaxonomy } from '@/hooks/useSkillsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, BookOpen, Layers, ArrowRight, ExternalLink, Search,
  Tag, GitBranch, Users, Briefcase, Sparkles, ChevronDown, ChevronRight,
} from 'lucide-react';
import type { TaxonomySkill } from '@/lib/queries';

const TYPE_LABELS: Record<string, string> = {
  knowledge: 'Conocimiento',
  competence: 'Competencia',
  transversal: 'Transversal',
};

const TYPE_BADGE: Record<string, string> = {
  knowledge: 'bg-primary/10 text-primary border border-primary/20',
  competence: 'bg-accent/10 text-accent border border-accent/20',
  transversal: 'bg-warning/10 text-warning border border-warning/20',
};

const REUSABILITY_LABELS: Record<string, string> = {
  transversal: 'Transversal',
  cross_sectoral: 'Intersectorial',
  sector_specific: 'Sector Financiero',
  occupation_specific: 'Puesto específico',
};

const SOURCE_LABELS: Record<string, string> = {
  CV_PARSE: 'CV Parsing',
  JOB_POSTING: 'Oferta empleo',
  ESCO_SYNONYM: 'ESCO',
  SABADELL_INTERNAL: 'Sabadell',
  MANUAL: 'Manual',
};

function SkillDetailPanel({ skill }: { skill: TaxonomySkill }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-navy">{skill.name}</h3>
          {skill.isEmerging && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
              <Sparkles className="h-2.5 w-2.5" /> Emergente
            </span>
          )}
        </div>
        <p className="text-xs text-foreground/60 leading-relaxed">{skill.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border bg-secondary/30 p-2.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tipo</p>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[skill.skillType]}`}>
            {TYPE_LABELS[skill.skillType]}
          </span>
        </div>
        <div className="border bg-secondary/30 p-2.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reutilización</p>
          <p className="text-xs font-semibold text-navy">{REUSABILITY_LABELS[skill.reusabilityLevel]}</p>
        </div>
        <div className="border bg-secondary/30 p-2.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Fuente</p>
          <p className="text-xs font-semibold text-navy">{skill.source}</p>
        </div>
        <div className="border bg-secondary/30 p-2.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Cluster</p>
          <p className="text-xs font-semibold text-navy">{skill.clusterName ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase className="h-3 w-3 text-primary" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Demanda (roles)</p>
          </div>
          <p className="text-lg font-extrabold text-navy tabular-nums">{skill.roleCount}</p>
        </div>
        <div className="border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3 w-3 text-accent" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Oferta (candidatos)</p>
          </div>
          <p className="text-lg font-extrabold text-navy tabular-nums">{skill.candidateCount}</p>
        </div>
      </div>

      {skill.escoUri && (
        <a
          href={skill.escoUri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Ver en clasificación ESCO
        </a>
      )}

      {skill.aliases.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Normalización — {skill.aliases.length} alias
            </h4>
          </div>
          <div className="space-y-1">
            {skill.aliases.map((a, i) => (
              <div key={i} className="flex items-center justify-between border bg-secondary/20 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground font-medium">{SOURCE_LABELS[a.source] ?? a.source}</span>
                  <div className="w-12 h-1 bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${a.confidence * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-semibold text-navy tabular-nums w-8 text-right">
                    {Math.round(a.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skill.adjacentSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <GitBranch className="h-3.5 w-3.5 text-accent" />
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Skills adyacentes
            </h4>
          </div>
          <div className="space-y-1">
            {skill.adjacentSkills.map((a) => (
              <div key={a.id} className="flex items-center justify-between border bg-secondary/20 px-2.5 py-1.5">
                <span className="text-xs text-foreground font-medium">{a.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-muted overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${a.similarity * 100}%` }} />
                  </div>
                  <span className="text-[9px] font-semibold text-navy tabular-nums w-8 text-right">
                    {Math.round(a.similarity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TaxonomyView = () => {
  const { data: skills = [], isLoading } = useSkillsTaxonomy();
  const [selectedSkill, setSelectedSkill] = useState<TaxonomySkill | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = skills;
    if (filterType !== 'all') result = result.filter((s) => s.skillType === filterType);
    if (filterSource !== 'all') result = result.filter((s) => s.source === filterSource);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.name.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [skills, filterType, filterSource, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, TaxonomySkill[]>();
    for (const s of filtered) {
      const cat = s.category || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const typeStats = {
    knowledge: skills.filter((s) => s.skillType === 'knowledge').length,
    competence: skills.filter((s) => s.skillType === 'competence').length,
    transversal: skills.filter((s) => s.skillType === 'transversal').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-navy tracking-tight">Taxonomía de Skills</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ontología ESCO + modelo Sabadell · Normalización y adjacencia
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="shadow-metric">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{skills.length}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Total Skills</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{typeStats.knowledge}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Conocimiento</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{typeStats.competence}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Competencias</p>
          </CardContent>
        </Card>
        <Card className="shadow-metric">
          <CardContent className="p-2.5 sm:pt-4 sm:pb-4">
            <p className="text-xl sm:text-2xl font-extrabold text-navy tabular-nums">{typeStats.transversal}</p>
            <p className="text-[8px] sm:text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Transversales</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-3 sm:pt-4 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 flex-wrap">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre, alias o categoría..."
                  className="w-full border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <div className="flex-1 sm:w-44 sm:flex-none">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Tipo</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-card text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="knowledge">Conocimiento</SelectItem>
                    <SelectItem value="competence">Competencia</SelectItem>
                    <SelectItem value="transversal">Transversal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 sm:w-36 sm:flex-none">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Fuente</label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="bg-card text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ESCO">ESCO</SelectItem>
                    <SelectItem value="SABADELL">Sabadell</SelectItem>
                    <SelectItem value="MIX">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <span className="text-xs font-semibold text-navy tabular-nums sm:pb-2">
              {filtered.length} <span className="font-normal text-muted-foreground">skills</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-1">
          {grouped.map(([category, catSkills]) => {
            const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0;
            return (
              <div key={category} className="border bg-card shadow-card">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-navy">{category}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold tabular-nums">{catSkills.length}</span>
                </button>
                {isExpanded && (
                  <div className="border-t">
                    {catSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => setSelectedSkill(skill)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-primary/[0.03] transition-colors border-b last:border-0 ${
                          selectedSkill?.id === skill.id ? 'bg-primary/[0.05] border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-medium text-foreground truncate">{skill.name}</span>
                          {skill.isEmerging && <Sparkles className="h-2.5 w-2.5 text-accent shrink-0" />}
                        </div>
                        <span className={`shrink-0 px-1.5 py-0.5 text-[8px] font-bold uppercase ${TYPE_BADGE[skill.skillType]}`}>
                          {TYPE_LABELS[skill.skillType]?.charAt(0)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {selectedSkill ? (
            <Card className="shadow-card sticky top-20">
              <CardHeader className="pb-3 border-b bg-secondary/30">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-navy">Detalle de Skill</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <SkillDetailPanel skill={selectedSkill} />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  Selecciona una skill de la jerarquía para ver su detalle,<br />
                  aliases de normalización y skills adyacentes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxonomyView;
