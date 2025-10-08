import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Injecter les variables d'environnement pour les builds spécifiques
      'import.meta.env.VITE_APP_TYPE': JSON.stringify(env.VITE_APP_TYPE),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME),
      'import.meta.env.VITE_APP_ID': JSON.stringify(env.VITE_APP_ID),
      'import.meta.env.VITE_PRIMARY_COLOR': JSON.stringify(env.VITE_PRIMARY_COLOR),
      'import.meta.env.VITE_DEFAULT_ROUTE': JSON.stringify(env.VITE_DEFAULT_ROUTE),
      'import.meta.env.VITE_AUTH_ROUTE': JSON.stringify(env.VITE_AUTH_ROUTE),
    }
  };
});
