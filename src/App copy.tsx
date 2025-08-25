import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TeamTasks } from './pages/TeamTasks';
import { Upload } from './pages/Upload';
import { Settings } from './pages/Settings';
import { Reviews } from './pages/Reviews';
import { Newsletter } from './pages/Newsletter';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;