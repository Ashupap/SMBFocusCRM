import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Deals from "@/pages/deals";
import Activities from "@/pages/activities";
import Campaigns from "@/pages/campaigns";
import Reports from "@/pages/reports";
import AIInsights from "@/pages/AIInsights";
import EmailTemplates from "@/pages/EmailTemplates";
import Approvals from "@/pages/Approvals";
import CustomDashboard from "@/pages/CustomDashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Authentication routes - always accessible */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      
      {/* Protected routes */}
      {isLoading ? (
        <Route path="*">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg">Loading...</div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/deals" component={Deals} />
          <Route path="/activities" component={Activities} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/reports" component={Reports} />
          <Route path="/ai-insights" component={AIInsights} />
          <Route path="/email-templates" component={EmailTemplates} />
          <Route path="/approvals" component={Approvals} />
          <Route path="/custom-dashboard" component={CustomDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
