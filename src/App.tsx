import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import TaxonomyView from "./pages/TaxonomyView";
import SkillsIntelligenceView from "./pages/SkillsIntelligenceView";
import AdminView from "./pages/AdminView";
import ChatView from "./pages/ChatView";
import PerformancePotentialView from "./pages/PerformancePotentialView";
import TalentMapSuccessionView from "./pages/TalentMapSuccessionView";
import ObjectivesBonusView from "./pages/ObjectivesBonusView";
import DevelopmentActionsView from "./pages/DevelopmentActionsView";
import CareerPathsView from "./pages/CareerPathsView";
import TalentDashboardView from "./pages/TalentDashboardView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const msg = String(error?.message ?? '');
      const isNetwork = /fetch|network|connection|failed to fetch|ERR_NETWORK|load failed/i.test(msg);
      const isSupabasePaused = /paused|project.*inactive|restore/i.test(msg);
      if (isNetwork || isSupabasePaused) {
        toast.error(
          isSupabasePaused
            ? "Proyecto Supabase pausado. Entra al Dashboard y restaura el proyecto."
            : "Error de conexión. Comprueba tu internet o el estado del proyecto Supabase."
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<ChatView />} />
      <Route path="/talent-dashboard" element={<TalentDashboardView />} />
      <Route path="/performance-potential" element={<PerformancePotentialView />} />
      <Route path="/talent-succession" element={<TalentMapSuccessionView />} />
      <Route path="/objectives-bonus" element={<ObjectivesBonusView />} />
      <Route path="/development-actions" element={<DevelopmentActionsView />} />
      <Route path="/career-paths" element={<CareerPathsView />} />
      <Route path="/taxonomia" element={<TaxonomyView />} />
      <Route path="/skills-intelligence" element={<SkillsIntelligenceView />} />
      <Route path="/admin" element={<AdminView />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
