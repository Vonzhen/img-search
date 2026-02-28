// src/middlewares/auth.ts
import { getCookie } from 'hono/cookie';

// 1. 核心密码校验逻辑
export const checkAuth = (c: any) => {
  return getCookie(c, 'auth_token') === c.env.TEAM_PASSWORD;
};

// 2. 路由拦截保安 (Middleware)
export const authMiddleware = async (c: any, next: any) => {
  // 如果是去登录或退出的，直接放行
  if (['/api/login', '/api/logout'].includes(c.req.path)) {
    return await next();
  }
  
  // 如果是其它带 /api/ 的敏感操作，必须查验令牌
  if (!checkAuth(c)) {
    return c.json({ error: 'Unauthorized，请先登录管理员' }, 401);
  }
  
  // 查验通过，放行到下一步的业务逻辑
  await next();
};
