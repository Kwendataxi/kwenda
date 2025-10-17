import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Déterminer le manifest selon le type d'app
  const getManifestPath = () => {
    const appType = env.VITE_APP_TYPE;
    if (appType === 'client') return './public/manifest.client.json';
    if (appType === 'driver') return './public/manifest.driver.json';
    if (appType === 'partner') return './public/manifest.partner.json';
    return './public/manifest.json';
  };
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['app-icon-1024.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'splash-screen.png'],
        manifest: {
          name: 'Kwenda Taxi',
          short_name: 'Kwenda',
          description: 'Application VTC multimodale pour l\'Afrique francophone - Transport, Livraison, Marketplace',
          theme_color: '#DC2626',
          background_color: '#0B1220',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: '/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/app-icon-1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB limit
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
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
