import { useNavigate, useSearchParams } from 'react-router-dom';
import { roles, getCandidatesForRole, getScoreLabel } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Star } from 'lucide-react';

const RolView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRoleId = searchParams.get('role') || roles[0].id;
  const navigate = useNavigate();

  const role = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const candidates = getCandidatesForRole(role.id);
  const avgScore = Math.round(candidates.reduce((s, c) => s + c.globalScore, 0) / candidates.length);
  const highlyRecommended = candidates.filter((c) => c.globalScore >= 80);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Vista de Rol</h2>
          <p className="text-sm text-muted-foreground">Modelo de skills y contexto del puesto</p>
        </div>
        <Select value={selectedRoleId} onValueChange={(v) => setSearchParams({ role: v })}>
          <SelectTrigger className="w-72 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card z-50">
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{role.unit}</p>
            </div>
            <button
              onClick={() => navigate(`/ranking?role=${role.id}`)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Ver candidatos →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 mb-6">{role.description}</p>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-semibold text-foreground">{candidates.length}</p>
                <p className="text-xs text-muted-foreground">Candidatos en pool</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-4">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-semibold text-foreground">{avgScore}</p>
                <p className="text-xs text-muted-foreground">Score medio de encaje</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-secondary/50 p-4">
              <Star className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-semibold text-foreground">{Math.round((highlyRecommended.length / candidates.length) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Altamente recomendados</p>
              </div>
            </div>
          </div>

          {/* Skills model */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Modelo de skills del rol</h3>
            <div className="space-y-3">
              {role.skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-4">
                  <span className="w-48 text-sm text-foreground truncate">{skill.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${skill.weight}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-muted-foreground">{skill.weight}%</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground italic">
              Modelo basado en ontología de skills (ESCO) + modelo interno Banco Sabadell
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolView;
