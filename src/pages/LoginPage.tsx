import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { brandConfig, getPrimaryDemoCredential } from '@/config/brand';
import { loginLabels } from '@/config/labels';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const primaryDemo = getPrimaryDemoCredential();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setEmail(primaryDemo.email);
    setPassword(primaryDemo.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-navy">
        <div className="absolute top-0 right-0 w-[45%] h-full bg-primary/30 clip-diagonal" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] gradient-shine" />
        <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-accent/5 blur-3xl" />
        <div className="absolute bottom-[15%] left-[5%] w-48 h-48 bg-primary/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div>
            <img
              src={brandConfig.logoWhitePath}
              alt={brandConfig.logoAlt}
              className="h-10 w-auto"
            />
          </div>

          <div className="max-w-md">
            <p className="text-[10px] font-bold text-white/35 tracking-[0.25em] uppercase mb-4">
              {loginLabels.heroTagline}
            </p>
            <h2 className="text-[32px] font-bold text-white leading-[1.12] tracking-tight mb-5">
              {loginLabels.heroTitle}
            </h2>
            <p className="text-sm text-white/35 leading-relaxed max-w-sm">
              {loginLabels.heroSubtitle}
            </p>

            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/8 pt-6">
              {[
                { title: 'Evaluación y potencial', desc: 'Desempeño sostenido · 9-box · readiness' },
                { title: 'Formación basada en gaps', desc: 'Recomendaciones automáticas por brecha' },
                { title: 'Sucesión y riesgo', desc: 'Cobertura de puestos clave · bench' },
                { title: 'Objetivos y bonus', desc: 'Importación M50 · seguimiento on-track' },
              ].map((f, i) => (
                <div key={i} className="group">
                  <p className="text-[11px] font-semibold text-white leading-tight">{f.title}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-white/12 font-medium">
            © {brandConfig.footerYear} {brandConfig.clientName} — {brandConfig.moduleName}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-8">
        <div className="w-full max-w-[360px] animate-fadeIn">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src={brandConfig.logoPath}
              alt={brandConfig.logoAlt}
              className="h-7 w-auto"
            />
          </div>

          <div className="mb-7">
            <h3 className="text-lg font-bold text-navy tracking-tight">{loginLabels.accessTitle}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {loginLabels.accessSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={`nombre@${brandConfig.emailDomain}`}
                  required
                  autoComplete="email"
                  className="w-full border border-border/80 bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 shadow-sm hover:border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-border/80 bg-card pl-9 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200 shadow-sm hover:border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/35 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="border-l-2 border-destructive bg-destructive/5 px-3 py-2.5 animate-fadeIn">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acceder'
              )}
            </button>
          </form>

          <div className="mt-8 border border-primary/10 bg-primary/[0.02] p-4">
            <p className="text-[9px] font-bold text-primary uppercase tracking-[0.15em] mb-2">
              {loginLabels.demoAccess}
            </p>
            <div className="space-y-1 text-xs font-mono">
              <p className="text-foreground/55">
                <span className="text-muted-foreground/40 mr-2">email</span>
                {primaryDemo.email}
              </p>
              <p className="text-foreground/55">
                <span className="text-muted-foreground/40 mr-2">pass</span>
                {primaryDemo.password}
              </p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-3 text-[11px] font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              Rellenar credenciales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
