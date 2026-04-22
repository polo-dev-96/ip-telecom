import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useDashboard } from "@/hooks/useDashboard";
import { Overview } from "@/pages/Overview";
import { Attendances } from "@/pages/Attendances";
import { Channels } from "@/pages/Channels";
import { Agents } from "@/pages/Agents";
import { LiveMonitoring } from "@/pages/LiveMonitoring";
import { Ramais } from "@/pages/Ramais";
import { TelefoneOverview } from "@/pages/TelefoneOverview";
import { Chamadas } from "@/pages/Chamadas";
import { ChamadaDetalhe } from "@/pages/ChamadaDetalhe";
import { AgentesTelefonia } from "@/pages/AgentesTelefonia";
import { MonitoramentoGeral } from "@/pages/MonitoramentoGeral";
import { AttendanceDetail } from "@/pages/AttendanceDetail";
import { UserManagement } from "@/pages/UserManagement";
import { Login } from "@/pages/Login";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function DashboardLayout() {
  const dashboard = useDashboard();
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header dashboard={dashboard} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <Switch>
              <Route path="/" component={() => <Overview dashboard={dashboard} />} />
              <Route path="/monitoramento-geral" component={() => <MonitoramentoGeral />} />
              <Route path="/atendimentos" component={() => <Attendances dashboard={dashboard} />} />
              <Route path="/canais" component={() => <Channels dashboard={dashboard} />} />
              <Route path="/agentes" component={() => <Agents dashboard={dashboard} />} />
              <Route path="/acompanhamento" component={() => <LiveMonitoring />} />
              <Route path="/ramais" component={() => <Ramais />} />
              <Route path="/telefonia" component={() => <TelefoneOverview dashboard={dashboard} />} />
              <Route path="/chamadas" component={() => <Chamadas dashboard={dashboard} />} />
              <Route path="/chamadas/:callid" component={() => <ChamadaDetalhe dashboard={dashboard} />} />
              <Route path="/agentes-telefonia" component={() => <AgentesTelefonia dashboard={dashboard} />} />
              <Route path="/atendimento/:id" component={AttendanceDetail} />
              {user?.role === "admin" && (
                <Route path="/usuarios" component={UserManagement} />
              )}
              <Route>
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <p className="text-2xl font-bold">404</p>
                  <p className="text-muted-foreground">Página não encontrada</p>
                </div>
              </Route>
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060e24]">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <DashboardLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
