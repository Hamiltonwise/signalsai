import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import BootDiagnostics from './components/BootDiagnostics';
import { ConnectionTester } from './utils/connectionTester';
import './index.css';

// Ensure a #root element exists (safe fallback; no template strings)
function ensureRoot(): HTMLElement {
  let el = document.getElementById('root');
  if (!el) {
    console.warn('[main] #root not found. Creating one.');
    el = document.createElement('div');
    el.id = 'root';
    document.body.appendChild(el);
  }
  return el as HTMLElement;
}

// Simple error handler for production
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

// Initialize connection tester for debugging
if (import.meta.env.DEV) {
  ConnectionTester.getInstance();
}

const container = ensureRoot();
const root = ReactDOM.createRoot(container);

const AppWithProviders = () => (
  <GlobalErrorBoundary>
    <BrowserRouter>
      <App />
      {import.meta.env.DEV && <BootDiagnostics />}
    </BrowserRouter>
  </GlobalErrorBoundary>
);

if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <AppWithProviders />
    </React.StrictMode>
  );
} else {
  root.render(<AppWithProviders />);
}

// HMR (no-op in prod)
if (import.meta?.hot) {
  import.meta.hot.accept();
}