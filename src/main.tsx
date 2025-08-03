import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalInitService } from './services/globalInit'

// Initialize global services
GlobalInitService.initialize().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
