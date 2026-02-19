import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Lock, Mail, Brain, Layers, ShieldCheck, Search } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setEmail('admin@sabadell.com');
    setPassword('skills2024');
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-navy">
        <div className="absolute top-0 right-0 w-[45%] h-full bg-primary/40 clip-diagonal" />
        <div className="absolute bottom-0 left-0 w-full h-[2px] gradient-teal" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div>
            <img
              src="/sabadell-logo.png"
              alt="Banco Sabadell"
              className="h-7 w-auto brightness-0 invert"
            />
          </div>

          <div className="max-w-md">
            <p className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase mb-4">
              Skills Intelligence
            </p>
            <h2 className="text-[30px] font-bold text-white leading-[1.15] tracking-tight mb-5">
              Selección basada en<br />
              inteligencia de skills
            </h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm">
              Modelo científico de competencias para optimizar
              la precisión y eficiencia en procesos de selección.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/8 pt-6">
              {[
                { icon: Brain, title: 'Inteligencia multidimensional', desc: 'IQ · EQ · DQ · BQ · AQ' },
                { icon: Layers, title: 'Taxonomía ESCO', desc: 'Hard skills · Soft skills · Digital' },
                { icon: ShieldCheck, title: 'Validación científica', desc: 'Scoring declarativo + Panorama' },
                { icon: Search, title: 'Buscador inteligente', desc: 'Consultas por rol, skill o candidato' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <f.icon className="h-4 w-4 text-white/50 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-white leading-tight">{f.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-white/15 font-medium">
            © 2024 Banco Sabadell — Módulo de Selección
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background px-4 sm:px-8">
        <div className="w-full max-w-[360px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src="/sabadell-logo.png"
              alt="Banco Sabadell"
              className="h-6 w-auto"
            />
          </div>

          <div className="hidden lg:block mb-8">
            <img
              src="/sabadell-logo.png"
              alt="Banco Sabadell"
              className="h-6 w-auto mb-6"
            />
          </div>

          <div className="mb-7">
            <h3 className="text-lg font-bold text-navy tracking-tight">Iniciar sesión</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accede a la plataforma de selección
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="nombre@sabadell.com"
                  required
                  autoComplete="email"
                  className="w-full border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border bg-card pl-9 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="border-l-2 border-destructive bg-destructive/5 px-3 py-2.5">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 gradient-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
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

          <div className="mt-8 border-l-2 border-primary bg-primary/[0.03] p-4">
            <p className="text-[9px] font-bold text-primary uppercase tracking-[0.15em] mb-2">
              Acceso demo
            </p>
            <div className="space-y-1 text-xs font-mono">
              <p className="text-foreground/60">
                <span className="text-muted-foreground/50 mr-2">email</span>
                admin@sabadell.com
              </p>
              <p className="text-foreground/60">
                <span className="text-muted-foreground/50 mr-2">pass</span>
                skills2024
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
