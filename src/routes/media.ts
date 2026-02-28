import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const router = new Hono<{ Bindings: Bindings }>();

router.get('/:id', async (c) => {
  const cache = caches.default, key = c.req.url;
  const cached = await cache.match(key);
  if (cached) return new Response(cached.body, cached);

  const id = c.req.param('id');
  const isThumbReq = c.req.query('thumb') === 'true';
  
  const file = await c.env.DB.prepare('SELECT r2_key FROM images WHERE id = ?').bind(id).first();
  if (!file) return c.notFound();
  
  const r2Key = file.r2_key as string;
  let obj = isThumbReq ? await c.env.BUCKET.get(r2Key + '_thumb') : null;
  if (!obj) obj = await c.env.BUCKET.get(r2Key);
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=14400');
  
  const res = new Response(obj.body, { headers });
  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
});

// 删除操作加上了 authMiddleware 保安拦截
router.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const file = await c.env.DB.prepare('SELECT r2_key FROM images WHERE id = ?').bind(id).first();
  if (file) {
    const r2Key = file.r2_key as string;
    await c.env.BUCKET.delete(r2Key);
    await c.env.BUCKET.delete(r2Key + '_thumb');
    await c.env.DB.prepare('DELETE FROM image_tags WHERE image_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
  }
  return c.json({ success: true });
});

export default router;
