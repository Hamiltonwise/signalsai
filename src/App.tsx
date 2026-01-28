import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/Signin";
import NewAccountOnboarding from "./pages/NewAccountOnboarding";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { Settings } from "./pages/Settings";
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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { PilotHandler } from "./components/PilotHandler";
import { PilotBanner } from "./components/Admin/PilotBanner";

function AuthOnlyProviders({ children }: { children: ReactNode }) {
  return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}

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

function App() {
  return (
    <BrowserRouter>
      <PilotHandler />
      <AuthProvider>
        <OnboardingWizardProvider>
          <Toaster position="top-right" />
          <WizardController />
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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Dashboard />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patientJourneyInsights"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Dashboard />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pmsStatistics"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Dashboard />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Dashboard />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rankings"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Dashboard />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <AppProviders>
                  <Admin />
                </AppProviders>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Settings />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Notifications />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <AppProviders>
                    <PageWrapper>
                      <Help />
                    </PageWrapper>
                  </AppProviders>
                </ProtectedRoute>
              }
            />
          </Routes>
          <PilotBanner />
        </OnboardingWizardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
