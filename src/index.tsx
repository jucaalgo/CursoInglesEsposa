import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Clean up legacy manual API key — no longer needed
const LEGACY_KEY = 'profesoria_api_key';
if (localStorage.getItem(LEGACY_KEY)) {
    localStorage.removeItem(LEGACY_KEY);
}

// Register service worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // SW registration failed — app works without it
        });
    });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);