import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/context/PlanContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlanSync } from "@/context/PlanSync";
import { ProjectLibraryProvider } from "@/context/ProjectLibraryContext";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Pages
import Home from "@/pages/Home";
import Studio from "@/pages/Studio";
import Pricing from "@/pages/Pricing";
import Auth from "@/pages/Auth";
import VerifyEmail from "@/pages/VerifyEmail";
import Projects from "@/pages/Projects";
import Admin from "@/pages/Admin";
import PaymentCallback from "@/pages/PaymentCallback";
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
  const { isLoggedIn, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return null;

  if (!isLoggedIn) {
    const encoded = encodeURIComponent(location);
    return <Redirect to={`/auth?from=${encoded}`} />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, user } = useAuth();
  const [location] = useLocation();

  if (isLoading) return null;

  if (!isLoggedIn) {
    const encoded = encodeURIComponent(location);
    return <Redirect to={`/auth?from=${encoded}`} />;
  }

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/">
        <PageLayout><Home /></PageLayout>
      </Route>

      <Route path="/studio">
        <ProtectedRoute>
          <ProjectLibraryProvider>
            <PageLayout><Studio /></PageLayout>
          </ProjectLibraryProvider>
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <ProjectLibraryProvider>
            <PageLayout><Projects /></PageLayout>
          </ProjectLibraryProvider>
        </ProtectedRoute>
      </Route>

      <Route path="/pricing">
        <PageLayout><Pricing /></PageLayout>
      </Route>

      <Route path="/auth">
        <Auth />
      </Route>

      <Route path="/verify-email">
        <VerifyEmail />
      </Route>

      <Route path="/payment/callback">
        <PaymentCallback />
      </Route>

      <Route path="/admin">
        <AdminRoute>
          <Admin />
        </AdminRoute>
      </Route>

      <Route>
        <PageLayout><NotFound /></PageLayout>
      </Route>
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlanProvider>
            <PlanSync />
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
