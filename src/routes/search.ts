import { Hono } from 'hono';
import { Bindings } from '../types';

const router = new Hono<{ Bindings: Bindings }>();

router.get('/search', async (c) => {
  const term = `%${c.req.query('q') || ''}%`;
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const { results } = await c.env.DB.prepare(`
    SELECT i.*, GROUP_CONCAT(it.tag) as tags_str FROM images i
    LEFT JOIN image_tags it ON i.id = it.image_id
    WHERE i.filename LIKE ? OR it.tag LIKE ?
    GROUP BY i.id ORDER BY i.created_at DESC 
    LIMIT ? OFFSET ?
  `).bind(term, term, limit, offset).all();
  
  return c.json(results.map((r: any) => ({ ...r, tags: r.tags_str ? r.tags_str.split(',') : [] })));
});

router.get('/tags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT DISTINCT tag FROM image_tags ORDER BY tag ASC LIMIT 100').all();
  return c.json(results.map((r: any) => r.tag));
});

export default router;
