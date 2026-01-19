import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import RestaurantDashboard from "./pages/dashboard/RestaurantDashboard";
import SupplierDashboard from "./pages/dashboard/SupplierDashboard";
import DeliveriesPage from "./pages/DeliveriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import UploadReceiptPage from "./pages/UploadReceiptPage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./components/onboarding/OnboardingPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function DashboardRoute() {
  const { user } = useUser();

  if (!user) return null;

  // Check user metadata for role, default to restaurant
  const role = (user.publicMetadata?.role as string) || 'restaurant';

  return role === 'restaurant' ? <RestaurantDashboard /> : <SupplierDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <LandingPage />
          </SignedOut>
        </>
      } />

      {/* Auth routes with Clerk */}
      <Route path="/login/*" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <LoginPage />
          </SignedOut>
        </>
      } />
      <Route path="/signup/*" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <SignupPage />
          </SignedOut>
        </>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><DeliveriesPage /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/upload-receipt" element={<ProtectedRoute><UploadReceiptPage /></ProtectedRoute>} />
      {/* Supplier routes */}
      <Route path="/reports" element={<ProtectedRoute><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><SupplierDashboard /></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes >
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
