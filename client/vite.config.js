import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)

// Анализатор бандла (практика 25) — опциональный.
// Если пакет не установлен — vite запустится без него, не падая.
let visualizer = null
try {
  visualizer = require('rollup-plugin-visualizer').visualizer
} catch {
  console.warn('[vite] rollup-plugin-visualizer не установлен. Запустите `npm install` чтобы включить анализатор.')
}

// HTTPS включаем только если найдены файлы сертификата (практика 15).
const certDir = path.resolve(__dirname, 'certs');
const keyPath = path.join(certDir, 'localhost+2-key.pem');
const certPath = path.join(certDir, 'localhost+2.pem');

const httpsConfig = (fs.existsSync(keyPath) && fs.existsSync(certPath))
  ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  : false;

// Конфиг — функция, чтобы получить mode и прочитать .env через loadEnv.
// (process.env НЕ содержит переменных из .env — их даёт только loadEnv.)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  // Протокол прокси сам совпадает с бэкендом: если есть сертификаты,
  // server/index.js поднимается по HTTPS — значит и проксируем на https.
  // Явный VITE_API_TARGET в .env всё перекрывает.
  const defaultProtocol = httpsConfig ? 'https' : 'http';
  const apiTarget = env.VITE_API_TARGET || `${defaultProtocol}://127.0.0.1:3000`;

  const proxyCommon = {
    target: apiTarget,
    changeOrigin: true,
    secure: false,          // принимаем самоподписанный сертификат бэкенда
  };

  return {
    plugins: [
      react(),
      visualizer && visualizer({
        filename: 'dist/bundle-report.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false
      })
    ].filter(Boolean),
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          // Ручное разделение чанков (практика 25)
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'net-vendor': ['axios', 'socket.io-client']
          }
        }
      }
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      https: httpsConfig,
      proxy: {
        // Проксируем /api и /socket.io на бэкенд (по умолчанию 127.0.0.1:3000).
        // 127.0.0.1 вместо localhost — чтобы Node не ушёл в IPv6 (::1).
        '/api': proxyCommon,
        '/socket.io': { ...proxyCommon, ws: true }
      }
    }
  }
})
