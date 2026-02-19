import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getCandidateById, getRoleById, getScoreLabel, roles } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserCheck, FolderOpen, XCircle, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const CandidateDetailView = () => {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleId = searchParams.get('role') || '';

  const candidate = getCandidateById(candidateId || '');
  const role = getRoleById(roleId || candidate?.roleId || '');

  if (!candidate || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Candidato no encontrado</p>
      </div>
    );
  }

  const { label, color } = getScoreLabel(candidate.globalScore);

  const radarData = candidate.skills.map((s) => ({
    skill: s.name,
    Candidato: s.level,
    Rol: s.expected,
  }));

  const getRecommendation = () => {
    if (candidate.globalScore >= 80) {
      return {
        text: 'Recomendado para entrevista',
        detail: 'El candidato presenta un alto nivel de encaje con las skills requeridas para este rol. Se recomienda avanzar a la fase de entrevista.',
        icon: CheckCircle,
        variant: 'text-success',
      };
    }
    const gaps = candidate.skills.filter((s) => s.level < s.expected - 10);
    const gapNames = gaps.map((g) => g.name).join(', ');
    if (candidate.globalScore >= 60) {
      return {
        text: 'Candidato con potencial, con gaps identificados',
        detail: `Presenta gaps en: ${gapNames}. Estos gaps podrían cubrirse con formación específica.`,
        icon: AlertTriangle,
        variant: 'text-warning',
      };
    }
    return {
      text: 'Bajo encaje para este rol',
      detail: `Las competencias del candidato no se alinean suficientemente con el perfil requerido. Gaps principales: ${gapNames}.`,
      icon: MinusCircle,
      variant: 'text-destructive',
    };
  };

  const recommendation = getRecommendation();

  // Suggest alternative role
  const alternativeRole = roles.find((r) => r.id !== role.id && r.skills.some((rs) =>
    candidate.skills.some((cs) => cs.name === rs.name && cs.level >= rs.weight)
  ));

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al ranking
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{candidate.name}</h2>
          <p className="text-sm text-muted-foreground">{role.name} · {role.unit}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${
            color === 'high' ? 'score-high' : color === 'medium' ? 'score-medium' : 'score-low'
          }`}>
            {label}
          </span>
          <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-lg font-bold text-primary-foreground ${
            color === 'high' ? 'bg-score-high' : color === 'medium' ? 'bg-score-medium' : 'bg-score-low'
          }`}>
            {candidate.globalScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Skills & Science */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparativa de skills: candidato vs. rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Candidato" dataKey="Candidato" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Rol" dataKey="Rol" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle de skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidate.skills.map((s) => {
                  const diff = s.level - s.expected;
                  const status = diff >= 0 ? 'above' : diff >= -10 ? 'aligned' : 'below';
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="w-44 text-sm text-foreground truncate">{s.name}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === 'above' ? 'bg-score-high' : status === 'aligned' ? 'bg-score-medium' : 'bg-score-low'
                            }`}
                            style={{ width: `${s.level}%` }}
                          />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-foreground/40"
                            style={{ left: `${s.expected}%` }}
                            title={`Esperado: ${s.expected}`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{s.level}</span>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="text-xs text-muted-foreground w-8">{s.expected}</span>
                      </div>
                      {status === 'above' && <CheckCircle className="h-4 w-4 text-success" />}
                      {status === 'aligned' && <MinusCircle className="h-4 w-4 text-warning" />}
                      {status === 'below' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Decision */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recomendación del sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-start gap-3 rounded-lg border p-4 ${
                color === 'high' ? 'border-success/30 bg-success/5' :
                color === 'medium' ? 'border-warning/30 bg-warning/5' :
                'border-destructive/30 bg-destructive/5'
              }`}>
                <recommendation.icon className={`h-5 w-5 mt-0.5 ${recommendation.variant}`} />
                <div>
                  <p className={`font-medium text-sm ${recommendation.variant}`}>{recommendation.text}</p>
                  <p className="text-sm text-foreground/70 mt-1">{recommendation.detail}</p>
                </div>
              </div>

              {alternativeRole && candidate.globalScore < 80 && (
                <div className="mt-4 rounded-lg border p-4 bg-info/5 border-info/30">
                  <p className="text-sm text-foreground/80">
                    <span className="font-medium text-info">Sugerencia:</span> Este candidato podría encajar mejor en el rol de{' '}
                    <span className="font-medium">{alternativeRole.name}</span>.
                  </p>
                </div>
              )}

              {candidate.skills.some((s) => s.level < s.expected - 10) && (
                <div className="mt-4 rounded-lg border p-4 bg-secondary">
                  <p className="text-sm text-foreground/80">
                    <span className="font-medium">Formación sugerida:</span> Los gaps identificados podrían cubrirse con formación en{' '}
                    {candidate.skills
                      .filter((s) => s.level < s.expected - 10)
                      .map((s) => s.name)
                      .join(', ')}
                    .
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => toast.success(`${candidate.name} invitado a entrevista`)}
                className="w-full flex items-center gap-3 rounded-lg border p-3 text-sm font-medium text-foreground hover:bg-success/10 hover:border-success/30 transition-colors"
              >
                <UserCheck className="h-4 w-4 text-success" />
                Invitar a entrevista
              </button>
              <button
                onClick={() => toast.success(`${candidate.name} guardado en pool`)}
                className="w-full flex items-center gap-3 rounded-lg border p-3 text-sm font-medium text-foreground hover:bg-info/10 hover:border-info/30 transition-colors"
              >
                <FolderOpen className="h-4 w-4 text-info" />
                Guardar en pool para otro rol
              </button>
              <button
                onClick={() => toast.success(`${candidate.name} descartado`)}
                className="w-full flex items-center gap-3 rounded-lg border p-3 text-sm font-medium text-foreground hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
              >
                <XCircle className="h-4 w-4 text-destructive" />
                Descartar
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailView;
