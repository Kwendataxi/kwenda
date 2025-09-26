import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalInitService } from './services/globalInit'

// Initialize global services
GlobalInitService.initialize().catch(console.error);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
