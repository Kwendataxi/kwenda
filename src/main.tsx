import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalInitService } from './services/globalInit'
import { logger } from './utils/logger'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize global services
GlobalInitService.initialize().catch((error) => logger.error('Global init failed', error));

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('SW registered', registration);
      })
      .catch((registrationError) => {
        logger.error('SW registration failed', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
