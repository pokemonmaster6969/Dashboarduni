import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from 'next-themes';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectForm from '@/pages/ProjectForm';
import InvoiceForm from '@/pages/InvoiceForm';
import Clients from '@/pages/Clients';
import Services from '@/pages/Services';
import Scientists from '@/pages/Scientists';
import Territories from '@/pages/Territories';
import Invoices from '@/pages/Invoices';
import Payments from '@/pages/Payments';
import Analytics from '@/pages/Analytics';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/new" component={ProjectForm} />
        <Route path="/projects/:id/edit" component={ProjectForm} />
        <Route path="/projects/:id" component={ProjectDetail} />
        <Route path="/clients" component={Clients} />
        <Route path="/services" component={Services} />
        <Route path="/scientists" component={Scientists} />
        <Route path="/territories" component={Territories} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/new" component={InvoiceForm} />
        <Route path="/invoices/:id/edit" component={InvoiceForm} />
        <Route path="/payments" component={Payments} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
