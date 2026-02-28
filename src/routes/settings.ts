import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const router = new Hono<{ Bindings: Bindings }>();

router.get('/settings/bg', async (c) => {
  const obj = await c.env.BUCKET.get('_site_custom_bg_');
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  return new Response(obj.body, { headers });
});

router.post('/settings/bg', authMiddleware, async (c) => {
  const fd = await c.req.parseBody();
  const file = fd['file'];
  if (!(file instanceof File)) return c.json({ error: 'No file' }, 400);
  await c.env.BUCKET.put('_site_custom_bg_', file.stream(), { httpMetadata: { contentType: file.type } });
  return c.json({ success: true, url: '/api/settings/bg' });
});

export default router;
