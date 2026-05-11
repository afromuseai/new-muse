import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/context/PlanContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Pages
import Home from "@/pages/Home";
import Studio from "@/pages/Studio";
import Pricing from "@/pages/Pricing";
import Auth from "@/pages/Auth";
import Projects from "@/pages/Projects";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [location] = useLocation();

  if (!isLoggedIn) {
    const encoded = encodeURIComponent(location);
    return <Redirect to={`/auth?from=${encoded}`} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PageLayout><Home /></PageLayout>
      </Route>

      <Route path="/studio">
        <ProtectedRoute>
          <PageLayout><Studio /></PageLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <PageLayout><Projects /></PageLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pricing">
        <PageLayout><Pricing /></PageLayout>
      </Route>

      <Route path="/auth">
        <Auth />
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>

      <Route>
        <PageLayout><NotFound /></PageLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlanProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </PlanProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
