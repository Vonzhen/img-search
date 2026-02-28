import { Hono } from 'hono';
import { Bindings } from '../types';

const router = new Hono<{ Bindings: Bindings }>();

router.get('/search', async (c) => {
  const rawQ = c.req.query('q') || '';
  const dateStr = c.req.query('date') || ''; // 🌟 接收前端传来的日期 (如 2026-02-28)
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let dateCondition = '';
  let dateParams: number[] = [];
  
  // 🌟 如果传入了日期，将当天的 00:00 到 23:59 转换为时间戳进行严格筛选
  if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = targetDate.setHours(0,0,0,0);
      const endOfDay = targetDate.setHours(23,59,59,999);
      dateCondition = ' AND i.created_at >= ? AND i.created_at <= ?';
      dateParams = [startOfDay, endOfDay];
  }

  let results;

  if (rawQ.trim() === '') {
    const whereClause = dateStr ? 'WHERE i.created_at >= ? AND i.created_at <= ?' : '';
    const params = dateStr ? [...dateParams, limit, offset] : [limit, offset];
    
    const res = await c.env.DB.prepare(`
      SELECT i.*, GROUP_CONCAT(it.tag) as tags_str FROM images i
      LEFT JOIN image_tags it ON i.id = it.image_id
      ${whereClause}
      GROUP BY i.id ORDER BY i.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...params).all();
    results = res.results;
  } 
  else {
    const ftsQuery = rawQ.trim().split(/\s+/).map(word => `"${word}"*`).join(' AND ');
    const params = [ftsQuery, ...dateParams, limit, offset];
    
    const res = await c.env.DB.prepare(`
      SELECT i.*, GROUP_CONCAT(it.tag) as tags_str 
      FROM images_fts f
      JOIN images i ON f.id = i.id
      LEFT JOIN image_tags it ON i.id = it.image_id
      WHERE images_fts MATCH ? ${dateCondition}
      GROUP BY i.id 
      ORDER BY i.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...params).all();
    results = res.results;
  }
  
  return c.json(results.map((r: any) => ({ ...r, tags: r.tags_str ? r.tags_str.split(',') : [] })));
});

router.get('/tags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT DISTINCT tag FROM image_tags ORDER BY tag ASC LIMIT 100').all();
  return c.json(results.map((r: any) => r.tag));
});

export default router;
