import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const router = new Hono<{ Bindings: Bindings }>();

router.post('/upload', authMiddleware, async (c) => {
  const fd = await c.req.parseBody();
  const file = fd['file'];
  const thumb = fd['thumb']; 
  const tagsStr = fd['tags'] as string;
  
  if (!(file instanceof File)) return c.json({ error: 'No file' }, 400);

  const tags = tagsStr ? tagsStr.split(/[,，\s]+/).filter(Boolean) : ['未分类'];
  const uniqueTags = [...new Set(tags)];
  const id = crypto.randomUUID();
  
  await c.env.BUCKET.put(id, file.stream(), { httpMetadata: { contentType: file.type } });
  if (thumb instanceof File) {
      await c.env.BUCKET.put(id + '_thumb', thumb.stream(), { httpMetadata: { contentType: 'image/webp' } });
  }
  
  // 🌟 核心修改：将文件信息同时写入基础表和 FTS5 索引引擎表
  const batch = [
    c.env.DB.prepare('INSERT INTO images (id, filename, r2_key, size, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, file.name, id, file.size, Date.now()),
    c.env.DB.prepare('INSERT INTO images_fts (id, filename, tags) VALUES (?, ?, ?)').bind(id, file.name, uniqueTags.join(' '))
  ];
  uniqueTags.forEach(t => batch.push(c.env.DB.prepare('INSERT OR IGNORE INTO image_tags (image_id, tag) VALUES (?, ?)').bind(id, t.toLowerCase())));
  
  await c.env.DB.batch(batch);
  return c.json({ success: true });
});

export default router;
