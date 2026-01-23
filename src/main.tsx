import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalInitService } from './services/globalInit'
import { logger } from './utils/logger'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize global services
GlobalInitService.initialize().catch((error) => logger.error('Global init failed', error));

// Register Service Worker for PWA - Deferred for better FCP
if ('serviceWorker' in navigator) {
  // Defer SW registration until after FCP
  if (document.readyState === 'complete') {
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => logger.info('SW registered', registration))
        .catch((error) => logger.error('SW registration failed', error));
    }, 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => logger.info('SW registered', registration))
          .catch((error) => logger.error('SW registration failed', error));
      }, 2000);
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
