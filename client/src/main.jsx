import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './locales/i18n'; // Initialize i18n
import App from './App.jsx';
import Cookies from 'js-cookie';

// Apply theme immediately before React renders to prevent flash
(function applyInitialTheme() {
  try {
    const savedTheme = Cookies.get('pureskin_theme') || 'light';
    const html = document.documentElement;
    // Remove dark class first to ensure clean state
    html.classList.remove('dark');
    // Then add it if needed
    if (savedTheme === 'dark') {
      html.classList.add('dark');
    }
  } catch (error) {
    console.error('Error applying initial theme:', error);
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
