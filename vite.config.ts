import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // The app talks to a live REST/WebSocket API — only the app shell
        // (JS/CSS/HTML/fonts/icons) is service-worker controlled. API/WS
        // traffic is never intercepted, so task/notification data is always
        // fetched live and can't go stale behind a cache.
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Junction — Project & Task Management',
          short_name: 'Junction',
          description: 'Plan, assign, and track work across your team — projects, tasks, and real-time updates in one workspace.',
          lang: 'en',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#ffffff',
          theme_color: '#533afd',
          categories: ['productivity', 'business'],
          icons: [
            {src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
            {src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
            {src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
          ],
          shortcuts: [
            {name: 'Dashboard', url: '/dashboard', icons: [{src: '/shortcut-96.png', sizes: '96x96'}]},
            {name: 'My Tasks', url: '/my-tasks', icons: [{src: '/shortcut-96.png', sizes: '96x96'}]},
            {name: 'Inbox', url: '/inbox', icons: [{src: '/shortcut-96.png', sizes: '96x96'}]},
          ],
        },
        workbox: {
          // Precache the built app shell only; navigateFallback serves that
          // shell for any deep-link navigation (e.g. /invite/:token,
          // /dashboard) once the service worker is active — this also
          // shields installed/returning users from the current CloudFront
          // gap where nested paths 404 on a fresh (non-SW) request.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
