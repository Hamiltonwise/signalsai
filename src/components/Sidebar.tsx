import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Mount the app. If #root is missing, create it (avoid template-string innerHTML).
function mountApp() {
  let rootEl = document.getElementById('root');

  if (!rootEl) {
    console.warn('[main] #root not found. Creating one.');
    rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);
  }

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

mountApp();

// Vite HMR (safe to keep)
if (import.meta && import.meta.hot) {
  import.meta.hot.accept();
}