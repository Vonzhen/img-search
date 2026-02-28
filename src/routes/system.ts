import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { Bindings } from '../types';

const router = new Hono<{ Bindings: Bindings }>();

router.post('/login', async (c) => {
  const { pass } = await c.req.json();
  if (pass === c.env.TEAM_PASSWORD) {
    setCookie(c, 'auth_token', pass, { httpOnly: true, maxAge: 86400 * 30, path: '/' });
    return c.json({ ok: true });
  }
  return c.json({ error: 'Wrong' }, 401);
});

router.post('/logout', (c) => {
  setCookie(c, 'auth_token', '', { maxAge: 0, path: '/' });
  return c.json({ ok: true });
});

export default router;
