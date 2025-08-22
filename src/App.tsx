import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { TeamTasks } from "./pages/TeamTasks";
import { Upload } from "./pages/Upload";
import { Settings } from "./pages/Settings";
import { Reviews } from "./pages/Reviews";
import { Newsletter } from "./pages/Newsletter";
import { PreviewOnboarding } from "./pages/PreviewOnboarding";
import { OnboardingGBP } from "./pages/OnboardingGBP";
import VitalSignsDemo from "./pages/VitalSignsDemo";
import VitalsReference from "./pages/VitalsReference";
import DevPreviewRibbon from "./components/DevPreviewRibbon";
import OnboardingReference from "./pages/OnboardingReference";
import VitalSignsHeroLayout from "./components/VitalSignsHeroLayout";
import GBPCard from "./components/GBPCard";

function App() {
  return (
    <Router>
      <DevPreviewRibbon />
      <Routes>
        <Route path="/preview/onboarding" element={<PreviewOnboarding />} />
        <Route path="/onboarding/gbp" element={<OnboardingGBP />} />
        <Route path="/vital-signs-demo" element={<VitalSignsDemo />} />
        <Route path="/vitals-reference" element={<VitalsReference />} />
        <Route path="/onboarding-reference" element={<OnboardingReference />} />
        <Route path="/vital-signs-hero" element={<VitalSignsHeroLayout />} />
        <Route path="/gbp-card" element={<GBPCard />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/team-tasks" element={<TeamTasks />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
