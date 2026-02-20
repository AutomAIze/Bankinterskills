import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload, Database, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  FileSpreadsheet, Users, Briefcase, Brain, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface TableStats {
  name: string;
  count: number;
  icon: React.ReactNode;
}

type ImportTarget = 'candidates' | 'roles' | 'skills' | 'candidate_roles';

const IMPORT_TEMPLATES: Record<ImportTarget, { label: string; columns: string[]; description: string }> = {
  candidates: {
    label: 'Candidatos',
    columns: ['full_name', 'email', 'current_position', 'notes'],
    description: 'Importar candidatos nuevos al sistema',
  },
  roles: {
    label: 'Roles',
    columns: ['name', 'unit', 'department', 'description'],
    description: 'Importar definiciones de roles',
  },
  skills: {
    label: 'Skills',
    columns: ['name', 'esco_code', 'skill_type', 'reusability_level', 'description'],
    description: 'Importar skills al catálogo',
  },
  candidate_roles: {
    label: 'Asignaciones Candidato-Rol',
    columns: ['candidate_id', 'role_id', 'declarative_score', 'validated_score', 'pipeline_stage'],
    description: 'Importar o actualizar asignaciones y scores',
  },
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(/[,;\t]/).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

const AdminView = () => {
  const qc = useQueryClient();
  const [stats, setStats] = useState<TableStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [importTarget, setImportTarget] = useState<ImportTarget>('candidates');
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const fileRef = useRef<HTMLInputElement>(null);

  const [scoreRoleId, setScoreRoleId] = useState('');
  const [scoreCandidateId, setScoreCandidateId] = useState('');
  const [panoramaScore, setPanoramaScore] = useState('');
  const [savingScore, setSavingScore] = useState(false);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const tables = ['candidates', 'roles', 'skills', 'candidate_roles', 'role_skills', 'skill_clusters', 'skill_aliases'];
      const icons: Record<string, React.ReactNode> = {
        candidates: <Users className="h-4 w-4" />,
        roles: <Briefcase className="h-4 w-4" />,
        skills: <Brain className="h-4 w-4" />,
        candidate_roles: <FileSpreadsheet className="h-4 w-4" />,
        role_skills: <FileSpreadsheet className="h-4 w-4" />,
        skill_clusters: <Database className="h-4 w-4" />,
        skill_aliases: <Database className="h-4 w-4" />,
      };
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          return { name: t, count: count ?? 0, icon: icons[t] ?? <Database className="h-4 w-4" /> };
        })
      );
      setStats(results);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setImportData(rows);
      if (rows.length === 0) toast.error('El archivo está vacío o tiene formato incorrecto');
      else toast.success(`${rows.length} filas detectadas`);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    setImportResult(null);
    let success = 0;
    let errors = 0;

    const BATCH = 50;
    for (let i = 0; i < importData.length; i += BATCH) {
      const batch = importData.slice(i, i + BATCH);
      const cleaned = batch.map((row) => {
        const obj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (v === '') continue;
          const num = Number(v);
          obj[k] = !isNaN(num) && k.includes('score') ? num : v;
        }
        return obj;
      });

      const { error } = await supabase.from(importTarget).upsert(cleaned as any, { onConflict: 'id' });
      if (error) {
        errors += batch.length;
      } else {
        success += batch.length;
      }
    }

    setImportResult({ success, errors });
    setImporting(false);
    if (success > 0) {
      toast.success(`${success} registros importados correctamente`);
      qc.invalidateQueries();
      loadStats();
    }
    if (errors > 0) toast.error(`${errors} registros con errores`);
  };

  const handleSaveScore = async () => {
    if (!scoreCandidateId || !scoreRoleId || !panoramaScore) return;
    setSavingScore(true);
    try {
      const score = Number(panoramaScore);
      if (isNaN(score) || score < 0 || score > 100) {
        toast.error('Score debe ser un número entre 0 y 100');
        return;
      }

      const { data: cr, error: fetchErr } = await supabase
        .from('candidate_roles')
        .select('declarative_score')
        .eq('candidate_id', scoreCandidateId)
        .eq('role_id', scoreRoleId)
        .single();

      if (fetchErr) throw fetchErr;

      const declarative = Number(cr.declarative_score ?? 0);
      const combined = Math.round(declarative * 0.4 + score * 0.6);

      const { error } = await supabase
        .from('candidate_roles')
        .update({
          validated_score: score,
          combined_score: combined,
          confidence: 1.0,
          pipeline_stage: 'validated',
        })
        .eq('candidate_id', scoreCandidateId)
        .eq('role_id', scoreRoleId);

      if (error) throw error;

      toast.success(`Score Panorama guardado: ${score} → Combinado: ${combined}`);
      qc.invalidateQueries();
      setPanoramaScore('');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar score');
    } finally {
      setSavingScore(false);
    }
  };

  const handleRecalculateAll = async () => {
    setImporting(true);
    try {
      const { data: crs, error } = await supabase
        .from('candidate_roles')
        .select('candidate_id, role_id, declarative_score, validated_score')
        .not('validated_score', 'is', null);

      if (error) throw error;

      let updated = 0;
      for (const cr of (crs ?? [])) {
        const decl = Number(cr.declarative_score ?? 0);
        const val = Number(cr.validated_score ?? 0);
        const combined = Math.round(decl * 0.4 + val * 0.6);

        await supabase
          .from('candidate_roles')
          .update({ combined_score: combined, confidence: 1.0 })
          .eq('candidate_id', cr.candidate_id)
          .eq('role_id', cr.role_id);

        updated++;
      }

      toast.success(`${updated} scores recalculados (40% CV + 60% Panorama)`);
      qc.invalidateQueries();
    } catch {
      toast.error('Error al recalcular scores');
    } finally {
      setImporting(false);
    }
  };

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const SectionHeader = ({ id, title, icon }: { id: string; title: string; icon: React.ReactNode }) => (
    <button
      onClick={() => toggle(id)}
      className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-sm font-bold text-navy">{title}</span>
      </div>
      {expandedSection === id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Administración de Datos</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          Gestión de base de datos, importación y recálculo de scores
        </p>
      </div>

      {/* Overview */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="overview" title="Estado de la Base de Datos" icon={<Database className="h-4 w-4 text-primary" />} />
        {expandedSection === 'overview' && (
          <CardContent className="p-4 pt-0 space-y-4">
            <button
              onClick={loadStats}
              disabled={loadingStats}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loadingStats ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {loadingStats ? 'Cargando...' : 'Cargar estadísticas'}
            </button>

            {stats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {stats.map((t) => (
                  <div key={t.name} className="border bg-secondary/20 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-muted-foreground">{t.icon}</span>
                      <span className="text-[11px] font-semibold text-navy truncate">{t.name}</span>
                    </div>
                    <p className="text-xl font-extrabold text-navy tabular-nums">{t.count.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">registros</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Import */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="import" title="Importar Datos (CSV)" icon={<Upload className="h-4 w-4 text-accent" />} />
        {expandedSection === 'import' && (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(IMPORT_TEMPLATES) as [ImportTarget, typeof IMPORT_TEMPLATES[ImportTarget]][]).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => { setImportTarget(key); setImportData([]); setImportResult(null); }}
                  className={`border p-3 text-left transition-all ${
                    importTarget === key
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <p className="text-xs font-bold text-navy">{tpl.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.description}</p>
                </button>
              ))}
            </div>

            <div className="border bg-secondary/10 p-4">
              <p className="text-[11px] font-bold text-navy mb-1">Columnas esperadas para {IMPORT_TEMPLATES[importTarget].label}:</p>
              <div className="flex flex-wrap gap-1.5">
                {IMPORT_TEMPLATES[importTarget].columns.map((col) => (
                  <span key={col} className="px-2 py-0.5 text-[10px] font-mono bg-navy/5 border text-navy">{col}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Formato: CSV separado por comas, punto y coma o tabulador. Primera fila = cabecera.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Seleccionar archivo CSV
              </button>

              {importData.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-accent text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {importing ? 'Importando...' : `Importar ${importData.length} filas`}
                </button>
              )}
            </div>

            {importData.length > 0 && (
              <div className="border overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-navy/5 border-b sticky top-0">
                      {Object.keys(importData[0]).map((k) => (
                        <th key={k} className="px-2 py-1.5 text-left font-bold text-navy whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-secondary/20">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-2 py-1 text-muted-foreground whitespace-nowrap max-w-[150px] truncate">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 10 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1.5 bg-secondary/10">
                    ...y {importData.length - 10} filas más
                  </p>
                )}
              </div>
            )}

            {importResult && (
              <div className={`flex items-center gap-2 p-3 border ${importResult.errors > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/5 border-accent/20'}`}>
                {importResult.errors > 0 ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-accent" />}
                <p className="text-xs">
                  <span className="font-bold text-accent">{importResult.success}</span> importados correctamente
                  {importResult.errors > 0 && (
                    <span className="ml-2"><span className="font-bold text-destructive">{importResult.errors}</span> con errores</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Score Panorama */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="scores" title="Registrar Score Panorama" icon={<Brain className="h-4 w-4 text-score-high" />} />
        {expandedSection === 'scores' && (
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-[11px] text-muted-foreground">
              Introduce el score de una sesión Panorama. El sistema recalculará automáticamente el score combinado (40% CV + 60% Panorama).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Candidate ID</label>
                <input
                  type="text"
                  value={scoreCandidateId}
                  onChange={(e) => setScoreCandidateId(e.target.value)}
                  placeholder="UUID del candidato"
                  className="w-full px-3 py-2 text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role ID</label>
                <input
                  type="text"
                  value={scoreRoleId}
                  onChange={(e) => setScoreRoleId(e.target.value)}
                  placeholder="UUID del rol"
                  className="w-full px-3 py-2 text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Score Panorama (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={panoramaScore}
                  onChange={(e) => setPanoramaScore(e.target.value)}
                  placeholder="75"
                  className="w-full px-3 py-2 text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSaveScore}
              disabled={savingScore || !scoreCandidateId || !scoreRoleId || !panoramaScore}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {savingScore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {savingScore ? 'Guardando...' : 'Guardar Score'}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Recalculate */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="recalc" title="Recálculo Masivo de Scores" icon={<RefreshCw className="h-4 w-4 text-warning" />} />
        {expandedSection === 'recalc' && (
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="border border-warning/20 bg-warning/5 p-4">
              <p className="text-xs text-foreground/80 leading-relaxed">
                <span className="font-bold text-warning">Atención:</span> Este proceso recalcula el score combinado de todos los candidatos que tienen score Panorama, usando la fórmula <span className="font-mono font-semibold">40% declarativo + 60% validado</span>. El valor de confianza se actualiza a 100%.
              </p>
            </div>
            <button
              onClick={handleRecalculateAll}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-warning text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {importing ? 'Recalculando...' : 'Recalcular todos los scores'}
            </button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AdminView;
