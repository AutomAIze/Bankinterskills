import { WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionErrorBannerProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export function ConnectionErrorBanner({
  onRetry,
  message = 'Error de conexión con la base de datos. Comprueba tu conexión a internet. Si usas Supabase, verifica que el proyecto no esté pausado (Dashboard → Settings → General → Restore project).',
  className = '',
}: ConnectionErrorBannerProps) {
  return (
    <div className={`border border-destructive/30 bg-destructive/5 p-4 sm:p-6 space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <WifiOff className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-destructive text-sm sm:text-base">
            Fallo en la conexión
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
