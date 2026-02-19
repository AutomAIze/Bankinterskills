import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { roles, getCandidatesForRole, getScoreLabel, getStatusLabel } from '@/data/mockData';
import type { Candidate } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, ThumbsUp, Shuffle, X } from 'lucide-react';
import { toast } from 'sonner';

const RankingView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRoleId = searchParams.get('role') || roles[0].id;
  const navigate = useNavigate();

  const [minScore, setMinScore] = useState(0);
  const [onlyRecommended, setOnlyRecommended] = useState(false);

  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];
  let candidates = getCandidatesForRole(role.id);

  if (minScore > 0) candidates = candidates.filter((c) => c.globalScore >= minScore);
  if (onlyRecommended) candidates = candidates.filter((c) => c.globalScore >= 80);

  const topSkills = role.skills.slice(0, 4);

  const handleAction = (candidate: Candidate, action: string) => {
    const messages: Record<string, string> = {
      recommend: `${candidate.name} recomendado para entrevista`,
      move: `${candidate.name} movido a otro rol`,
      discard: `${candidate.name} descartado`,
    };
    toast.success(messages[action]);
  };

  const scoreBg = (score: number) => {
    const { color } = getScoreLabel(score);
    return color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low';
  };

  const scoreText = (score: number) => {
    const { color } = getScoreLabel(score);
    return color === 'high' ? 'score-high' : color === 'medium' ? 'score-medium' : 'score-low';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Ranking de Candidatos</h2>
        <p className="text-sm text-muted-foreground">Score de encaje basado en skills normalizadas · Filtro rápido para reducir tiempo de revisión</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-end gap-6 flex-wrap">
            <div className="w-64">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Rol</label>
              <Select value={selectedRoleId} onValueChange={(v) => setSearchParams({ role: v })}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Score mínimo: {minScore}
              </label>
              <Slider
                value={[minScore]}
                onValueChange={([v]) => setMinScore(v)}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="only-rec"
                checked={onlyRecommended}
                onCheckedChange={(v) => setOnlyRecommended(!!v)}
              />
              <label htmlFor="only-rec" className="text-sm text-foreground cursor-pointer">
                Solo altamente recomendados
              </label>
            </div>
            <span className="ml-auto text-sm text-muted-foreground">{candidates.length} candidatos</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Candidato</th>
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">Score</th>
              {topSkills.map((s) => (
                <th key={s.name} className="text-center px-3 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {s.name}
                </th>
              ))}
              <th className="text-center px-3 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const { label } = getScoreLabel(c.globalScore);
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-primary-foreground ${scoreBg(c.globalScore)}`}>
                      {c.globalScore}
                    </span>
                  </td>
                  {topSkills.map((rs) => {
                    const cs = c.skills.find((s) => s.name === rs.name);
                    return (
                      <td key={rs.name} className="text-center px-3 py-3 hidden lg:table-cell">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scoreBg(cs?.level || 0)}`}
                              style={{ width: `${cs?.level || 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${scoreText(cs?.level || 0)}`}>{cs?.level || 0}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === 'recomendado' ? 'bg-success/15 text-success' :
                      c.status === 'descartado' ? 'bg-destructive/15 text-destructive' :
                      c.status === 'en_pool' ? 'bg-info/15 text-info' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/candidato/${c.id}?role=${role.id}`)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction(c, 'recommend')}
                        className="rounded p-1.5 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors"
                        title="Recomendar para entrevista"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction(c, 'move')}
                        className="rounded p-1.5 text-muted-foreground hover:bg-info/10 hover:text-info transition-colors"
                        title="Mover a otro rol"
                      >
                        <Shuffle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction(c, 'discard')}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Descartar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankingView;
