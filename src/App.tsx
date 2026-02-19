import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RolView from "./pages/RolView";
import RankingView from "./pages/RankingView";
import CandidateDetailView from "./pages/CandidateDetailView";
import ShortlistView from "./pages/ShortlistView";
import TaxonomyView from "./pages/TaxonomyView";
import SkillsIntelligenceView from "./pages/SkillsIntelligenceView";
import ChatView from "./pages/ChatView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
      <Route path="/roles" element={<RolView />} />
      <Route path="/ranking" element={<RankingView />} />
      <Route path="/shortlist" element={<ShortlistView />} />
      <Route path="/candidato/:candidateId" element={<CandidateDetailView />} />
      <Route path="/taxonomia" element={<TaxonomyView />} />
      <Route path="/skills-intelligence" element={<SkillsIntelligenceView />} />
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
