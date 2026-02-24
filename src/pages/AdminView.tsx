import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  Database, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  FileSpreadsheet, ChevronDown, ChevronUp, History,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  previewImport, runBatchImport, fetchBatchAuditHistory,
  type IntegrationSource, type BatchAuditRecord, type ImportExecutionResult,
} from '@/lib/integrations/import-service';
import { runHrAutomations } from '@/lib/hr/mutations';
import { integrationLabels } from '@/config/labels';

interface TableStats {
  name: string;
  count: number;
}

type BatchSource = IntegrationSource;

const HR_TABLES = [
  'hr_employees',
  'performance_evaluations',
  'potential_assessments',
  'bonus_objectives',
  'hr_development_actions',
  'hr_succession_risk_snapshots',
  'hr_training_recommendations',
  'hr_career_paths',
  'hr_import_batches',
];

const AdminView = () => {
  const qc = useQueryClient();
  const [stats, setStats] = useState<TableStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [importing, setImporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('batch');
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawImportContent, setRawImportContent] = useState('');
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [batchSource, setBatchSource] = useState<BatchSource>('CSOD');
  const [batchCycle, setBatchCycle] = useState(new Date().getFullYear().toString());
  const [batchPreview, setBatchPreview] = useState<ReturnType<typeof previewImport> | null>(null);
  const [batchDryRun, setBatchDryRun] = useState(true);
  const [batchResult, setBatchResult] = useState<ImportExecutionResult | null>(null);
  const [batchAuditLog, setBatchAuditLog] = useState<BatchAuditRecord[]>([]);
  const [automationResult, setAutomationResult] = useState<{ generatedActions: number; syncedRecommendations: number } | null>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const results = await Promise.all(
        HR_TABLES.map(async (t) => {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          return { name: t, count: count ?? 0 };
        })
      );
      setStats(results);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, []);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchPreview(null);
    setBatchResult(null);
    setAutomationResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawImportContent(text);
      const rows = parseCsv(text);
      setImportData(rows);
      if (rows.length === 0) toast.error('El archivo está vacío o tiene formato incorrecto');
      else toast.success(`${rows.length} filas detectadas`);
    };
    reader.readAsText(file);
  };

  const handleBatchPreview = () => {
    if (!rawImportContent.trim()) {
      toast.error('Primero selecciona un archivo para generar preview');
      return;
    }
    try {
      const preview = previewImport({
        source: batchSource,
        content: rawImportContent,
        cycle: batchCycle,
      });
      setBatchPreview(preview);
      setBatchResult(null);
      if (preview.errors.length > 0) {
        toast.warning(`Preview generado con ${preview.errors.length} errores de validación`);
      } else {
        toast.success('Preview generado sin errores');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo generar el preview batch';
      toast.error(message);
    }
  };

  const handleBatchImport = async () => {
    if (!rawImportContent.trim()) {
      toast.error('Selecciona un archivo válido antes de importar');
      return;
    }
    setImporting(true);
    setAutomationResult(null);
    try {
      const result = await runBatchImport({
        source: batchSource,
        content: rawImportContent,
        cycle: batchCycle,
        dryRun: batchDryRun,
      });
      setBatchPreview(result);
      setBatchResult(result);
      if (batchDryRun) {
        toast.success('Dry-run completado: no se escribieron cambios');
      } else {
        const totalUpserts = Object.values(result.upserted).reduce((sum, n) => sum + n, 0);
        toast.success(`Importación completada: ${totalUpserts} filas upsertadas · Lote ${result.batchId?.slice(0, 8) ?? '—'}`);
        qc.invalidateQueries();
        loadStats();

        try {
          const autoResult = await runHrAutomations();
          setAutomationResult(autoResult);
          toast.success(`Automatizaciones post-import: ${autoResult.generatedActions} acciones + ${autoResult.syncedRecommendations} recomendaciones`);
        } catch {
          toast.warning('Importación OK, pero las automatizaciones post-import fallaron');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falló la importación batch';
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleLoadAuditLog = async () => {
    try {
      const log = await fetchBatchAuditHistory(20);
      setBatchAuditLog(log);
    } catch {
      toast.error('No se pudo cargar el histórico de lotes');
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
        <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight">Administración RRHH</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
          Integración batch, trazabilidad de lotes y estado de la base de datos
        </p>
      </div>

      {/* Integración batch oficial */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="batch" title="Integración Batch RRHH (CSOD · Sopra · M50)" icon={<Database className="h-4 w-4 text-primary" />} />
        {expandedSection === 'batch' && (
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-[11px] text-muted-foreground">
              Flujo oficial de integración por ficheros con validación previa, dry-run e importación idempotente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Fuente
                </label>
                <select
                  value={batchSource}
                  onChange={(e) => setBatchSource(e.target.value as BatchSource)}
                  className="w-full px-3 py-2 text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  <option value="CSOD">{integrationLabels.sources.csod}</option>
                  <option value="SOPRA">{integrationLabels.sources.sopra}</option>
                  <option value="M50">{integrationLabels.sources.m50}</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Ciclo
                </label>
                <input
                  type="text"
                  value={batchCycle}
                  onChange={(e) => setBatchCycle(e.target.value)}
                  placeholder="2026"
                  className="w-full px-3 py-2 text-xs border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={batchDryRun}
                    onChange={(e) => setBatchDryRun(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Modo dry-run
                </label>
              </div>
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

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBatchPreview}
                disabled={importing || !rawImportContent}
                className="px-3 py-2 text-xs font-semibold border bg-secondary/20 hover:bg-secondary/35 disabled:opacity-50 transition-all"
              >
                Preview validación
              </button>
              <button
                onClick={handleBatchImport}
                disabled={importing || !rawImportContent}
                className="px-3 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {importing ? 'Procesando...' : (batchDryRun ? 'Ejecutar dry-run' : 'Ejecutar importación')}
              </button>
            </div>

            {batchPreview && (
              <div className="border p-3 bg-secondary/10 space-y-2">
                <p className="text-xs font-bold text-navy">
                  Resultado preview · {batchPreview.source}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="border p-2 bg-background">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Filas</p>
                    <p className="text-sm font-bold text-navy tabular-nums">{batchPreview.totalRows}</p>
                  </div>
                  <div className="border p-2 bg-background">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Válidas</p>
                    <p className="text-sm font-bold text-accent tabular-nums">{batchPreview.validRows}</p>
                  </div>
                  <div className="border p-2 bg-background">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Errores</p>
                    <p className="text-sm font-bold text-destructive tabular-nums">{batchPreview.errors.length}</p>
                  </div>
                  <div className="border p-2 bg-background">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ciclo</p>
                    <p className="text-sm font-bold text-navy tabular-nums">{batchCycle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(batchPreview.summary).map(([key, value]) => (
                    <div key={key} className="border p-2 bg-background">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</p>
                      <p className="text-sm font-bold text-navy tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>

                {batchPreview.errors.length > 0 && (
                  <div className="border border-destructive/20 bg-destructive/5 p-2 max-h-36 overflow-y-auto">
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">
                      Errores detectados
                    </p>
                    {batchPreview.errors.slice(0, 20).map((error, idx) => (
                      <p key={idx} className="text-[11px] text-destructive/90">{error}</p>
                    ))}
                    {batchPreview.errors.length > 20 && (
                      <p className="text-[10px] text-destructive/80 mt-1">
                        ...y {batchPreview.errors.length - 20} errores más
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {batchResult && Object.keys(batchResult.upserted).length > 0 && (
              <div className="border border-accent/20 bg-accent/5 p-3 space-y-2">
                <p className="text-xs font-bold text-accent mb-1">Resultado de upsert</p>
                {batchResult.batchId && (
                  <p className="text-[11px] text-muted-foreground">
                    Lote ID: <span className="font-mono font-bold text-navy">{batchResult.batchId.slice(0, 12)}…</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(batchResult.upserted).map(([table, count]) => (
                    <span key={table} className="px-2 py-1 text-[11px] font-semibold border border-accent/20 bg-background text-navy">
                      {table}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {automationResult && (
              <div className="border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-bold text-primary mb-1">Automatizaciones post-import</p>
                <div className="flex gap-4">
                  <span className="text-[11px] text-muted-foreground">
                    Acciones generadas: <strong className="text-navy">{automationResult.generatedActions}</strong>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Recomendaciones sincronizadas: <strong className="text-navy">{automationResult.syncedRecommendations}</strong>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Audit History */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="audit" title="Histórico de lotes importados" icon={<History className="h-4 w-4 text-primary" />} />
        {expandedSection === 'audit' && (
          <CardContent className="p-4 pt-0 space-y-3">
            <button
              onClick={handleLoadAuditLog}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-navy text-white hover:opacity-90 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Cargar histórico
            </button>
            {batchAuditLog.length > 0 && (
              <div className="border overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-navy/5 border-b sticky top-0">
                      <th className="px-2 py-1.5 text-left font-bold text-navy">Lote ID</th>
                      <th className="px-2 py-1.5 text-left font-bold text-navy">Fuente</th>
                      <th className="px-2 py-1.5 text-left font-bold text-navy">Ciclo</th>
                      <th className="px-2 py-1.5 text-left font-bold text-navy">Estado</th>
                      <th className="px-2 py-1.5 text-right font-bold text-navy">Total</th>
                      <th className="px-2 py-1.5 text-right font-bold text-navy">OK</th>
                      <th className="px-2 py-1.5 text-right font-bold text-navy">Errores</th>
                      <th className="px-2 py-1.5 text-left font-bold text-navy">Inicio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchAuditLog.map((b) => (
                      <tr key={b.batchId} className="border-b last:border-0 hover:bg-secondary/20">
                        <td className="px-2 py-1 font-mono text-muted-foreground">{b.batchId.slice(0, 8)}…</td>
                        <td className="px-2 py-1 text-navy font-semibold">{b.source}</td>
                        <td className="px-2 py-1 text-muted-foreground">{b.cycle}</td>
                        <td className="px-2 py-1">
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold ${
                            b.status === 'completed' ? 'bg-accent/10 text-accent' :
                            b.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums text-navy">{b.totalRows}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-accent">{b.validRows}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-destructive">{b.errorRows}</td>
                        <td className="px-2 py-1 text-muted-foreground">{new Date(b.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {batchAuditLog.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">
                Pulsa "Cargar histórico" para ver los lotes importados.
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* DB Overview */}
      <Card className="shadow-card overflow-hidden">
        <SectionHeader id="overview" title="Estado de la Base de Datos RRHH" icon={<Database className="h-4 w-4 text-primary" />} />
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
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
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
    </div>
  );
};

export default AdminView;
