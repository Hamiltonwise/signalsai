import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

import { AuthProvider } from "./contexts/AuthContext.tsx";
import { GSCProvider } from "./contexts/GSCContext.tsx";
import { GA4Provider } from "./contexts/GA4Context.tsx";
import { GBPProvider } from "./contexts/GBPContext.tsx";
import { ClarityProvider } from "./contexts/ClarityContext.tsx";
import { MondayProvider } from "./contexts/MondayContext.tsx";
import { GoogleAuthProvider } from "./contexts/GoogleAuthContext.tsx";

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GoogleAuthProvider>
      <GSCProvider>
        <GA4Provider>
          <GBPProvider>
            <ClarityProvider>
              <MondayProvider>{children}</MondayProvider>
            </ClarityProvider>
          </GBPProvider>
        </GA4Provider>
      </GSCProvider>
    </GoogleAuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/dashboard"
            element={
              <AppProviders>
                <Dashboard />
              </AppProviders>
            }
          />
          <Route
            path="/admin"
            element={
              <AppProviders>
                <Admin />
              </AppProviders>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
