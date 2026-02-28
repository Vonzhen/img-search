// src/index.ts

import { Hono } from 'hono';
import { Bindings } from './types';

// 引入统一逻辑
import { checkAuth } from './middlewares/auth';
import { html } from './frontend/template';

// 引入各业务模块
import systemRoutes from './routes/system';
import mediaRoutes from './routes/media';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import settingsRoutes from './routes/settings';

const app = new Hono<{ Bindings: Bindings }>();

// 1. 挂载前端视觉层
app.get('/', (c) => {
  const isLoggedIn = checkAuth(c);
  return c.html(html(isLoggedIn));
});

// 2. 挂载后端业务层 (路由拼接组装)
app.route('/api', systemRoutes);
app.route('/api', uploadRoutes);
app.route('/api', searchRoutes);
app.route('/api', settingsRoutes);
app.route('/api/file', mediaRoutes); // 媒体路由映射到 /api/file/:id

export default app;
