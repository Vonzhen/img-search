// src/index.ts
import { Hono } from 'hono';
import { Bindings } from './types';

import { checkAuth } from './middlewares/auth';
import { html } from './frontend/template';

import systemRoutes from './routes/system';
import mediaRoutes from './routes/media';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import settingsRoutes from './routes/settings';

const app = new Hono<{ Bindings: Bindings }>();

// 🌟 新增：为 Android 和桌面端 PWA 提供绝对稳定的标准清单
app.get('/manifest.json', (c) => {
  return c.json({
    name: "幻彩图库",
    short_name: "图库",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF8A00",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  });
});

// 🌟 新增：纯代码绘制的超高清 SVG 图标 (Infuse 渐变色)
app.get('/icon.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml');
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#ffffff"/>
    <linearGradient id="infuse" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8A00"/>
      <stop offset="100%" stop-color="#E53900"/>
    </linearGradient>
    <circle cx="256" cy="256" r="210" fill="url(#infuse)"/>
    <text x="256" y="272" fill="#ffffff" font-size="200" font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">图</text>
  </svg>`);
});

app.get('/', (c) => {
  const isLoggedIn = checkAuth(c);
  return c.html(html(isLoggedIn));
});

app.route('/api', systemRoutes);
app.route('/api', uploadRoutes);
app.route('/api', searchRoutes);
app.route('/api', settingsRoutes);
app.route('/api/file', mediaRoutes);

export default app;
