import { Switch, Route, Router as WouterRouter } from "wouter";
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
import { AttendanceDetail } from "@/pages/AttendanceDetail";
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

function DashboardLayout() {
  const dashboard = useDashboard();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header dashboard={dashboard} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <Switch>
              <Route path="/" component={() => <Overview dashboard={dashboard} />} />
              <Route path="/atendimentos" component={() => <Attendances dashboard={dashboard} />} />
              <Route path="/canais" component={() => <Channels dashboard={dashboard} />} />
              <Route path="/agentes" component={() => <Agents dashboard={dashboard} />} />
              <Route path="/acompanhamento" component={() => <LiveMonitoring />} />
              <Route path="/ramais" component={() => <Ramais />} />
              <Route path="/atendimento/:id" component={AttendanceDetail} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <DashboardLayout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
