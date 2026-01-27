import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { asyncCSSPlugin } from './plugins/vite-plugin-async-css';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement selon le mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Lire la version depuis package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  const appVersion = packageJson.version || '1.0.0';
  const buildDate = new Date().toISOString();
  
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
      asyncCSSPlugin(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'script-defer', // Defer SW registration to avoid render blocking
        includeAssets: ['kwenda-logo.png', 'app-icon-1024.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
        manifest: {
          name: 'Kwenda - Mobilité Africaine',
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
              src: '/kwenda-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/kwenda-logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/kwenda-logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/kwenda-logo.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/kwenda-logo.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            // Cache des images statiques - 1 an (assets avec hash)
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache-v1',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 31536000 // 1 an pour assets immutables
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Cache des JS/CSS - 1 an (avec hash dans le nom)
            {
              urlPattern: /\.(?:js|css)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-resources-v1',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 31536000 // 1 an pour fichiers versionnés
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Cache des fonts - 1 an
            {
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache-v1',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 31536000 // 1 an
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Google Fonts CSS - 1 an
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-css-v1',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 31536000
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Google Fonts fichiers - 1 an
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files-v1',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 31536000
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Supabase API - NetworkFirst avec fallback
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-v1',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 300 // 5 minutes pour API
                },
                cacheableResponse: {
                  statuses: [0, 200]
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
    build: {
      cssCodeSplit: false, // Un seul fichier CSS pour FCP rapide
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Supprimer console.log en prod
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info']
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
            maps: ['@googlemaps/react-wrapper', 'mapbox-gl']
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Accepter des chunks plus gros pour réduire le nombre de requêtes
    },
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
      // Injecter la version de l'app dans le Service Worker
      '__APP_VERSION__': JSON.stringify(appVersion),
      '__BUILD_DATE__': JSON.stringify(buildDate),
    }
  };
});
