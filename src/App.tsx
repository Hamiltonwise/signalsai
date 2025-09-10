import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/Signin";
import Dashboard from "./pages/Dashboard";

import { AuthProvider } from "./contexts/AuthContext.tsx";
import { GSCProvider } from "./contexts/GSCContext.tsx";
import { GA4Provider } from "./contexts/GA4Context.tsx";
import { GBPProvider } from "./contexts/GBPContext.tsx";

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
              <GSCProvider>
                <GA4Provider>
                  <GBPProvider>
                    <Dashboard />
                  </GBPProvider>
                </GA4Provider>
              </GSCProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
