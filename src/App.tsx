import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RolView from "./pages/RolView";
import RankingView from "./pages/RankingView";
import CandidateDetailView from "./pages/CandidateDetailView";
import InsightsView from "./pages/InsightsView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<RolView />} />
            <Route path="/ranking" element={<RankingView />} />
            <Route path="/candidato/:candidateId" element={<CandidateDetailView />} />
            <Route path="/insights" element={<InsightsView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
