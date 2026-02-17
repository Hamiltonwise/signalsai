import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/Signin";
import NewAccountOnboarding from "./pages/NewAccountOnboarding";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { Settings } from "./pages/Settings";
import { DFYWebsite } from "./pages/DFYWebsite";
import { Notifications } from "./pages/Notifications";
import Help from "./pages/Help";
import { PageWrapper } from "./components/PageWrapper";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { GSCProvider } from "./contexts/GSCContext.tsx";
import { GA4Provider } from "./contexts/GA4Context.tsx";
import { GBPProvider } from "./contexts/GBPContext.tsx";
import { ClarityProvider } from "./contexts/ClarityContext.tsx";
import { GoogleAuthProvider } from "./contexts/GoogleAuthContext.tsx";
import { OnboardingWizardProvider } from "./contexts/OnboardingWizardContext.tsx";
import { WizardController } from "./components/onboarding-wizard";
import {
  SetupProgressProvider,
  SetupProgressWizard,
} from "./components/SetupProgressWizard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { DFYRoute } from "./components/DFYRoute";
import { PilotHandler } from "./components/PilotHandler";
import { PilotBanner } from "./components/Admin/PilotBanner";

function AuthOnlyProviders({ children }: { children: ReactNode }) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}

// AppProviders wrapper - now used as a layout route to avoid remounting on navigation
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GoogleAuthProvider>
      <GSCProvider>
        <GA4Provider>
          <GBPProvider>
            <ClarityProvider>{children}</ClarityProvider>
          </GBPProvider>
        </GA4Provider>
      </GSCProvider>
    </GoogleAuthProvider>
  );
}

// Layout component for protected routes with AppProviders
// This keeps providers mounted across route changes, preventing duplicate API calls
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppProviders>
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </AppProviders>
    </ProtectedRoute>
  );
}

// Layout for admin routes (no PageWrapper)
function AdminLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PilotHandler />
      <AuthProvider>
        <OnboardingWizardProvider>
          <SetupProgressProvider>
            <Toaster position="top-right" />
            <WizardController />
            <SetupProgressWizard />
            <Routes>
              <Route path="/" element={<Navigate to="/signin" replace />} />
              <Route
                path="/signin"
                element={
                  <PublicRoute>
                    <AuthOnlyProviders>
                      <SignIn />
                    </AuthOnlyProviders>
                  </PublicRoute>
                }
              />
              <Route
                path="/new-account-onboarding"
                element={
                  <PublicRoute>
                    <AuthOnlyProviders>
                      <NewAccountOnboarding />
                    </AuthOnlyProviders>
                  </PublicRoute>
                }
              />

              {/* Protected routes with shared AppProviders - prevents remounting on navigation */}
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patientJourneyInsights" element={<Dashboard />} />
                <Route path="/pmsStatistics" element={<Dashboard />} />
                <Route path="/tasks" element={<Dashboard />} />
                <Route path="/rankings" element={<Dashboard />} />
                <Route
                  path="/dfy/website"
                  element={
                    <DFYRoute>
                      <DFYWebsite />
                    </DFYRoute>
                  }
                />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/help" element={<Help />} />
              </Route>

              {/* Admin routes with AppProviders but no PageWrapper */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/*" element={<Admin />} />
              </Route>
            </Routes>
            <PilotBanner />
          </SetupProgressProvider>
        </OnboardingWizardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
