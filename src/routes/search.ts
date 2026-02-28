// src/routes/search.ts
import { Hono } from 'hono';
import { Bindings } from '../types';

const router = new Hono<{ Bindings: Bindings }>();

router.get('/search', async (c) => {
  const rawQ = c.req.query('q') || '';
  const dateStr = c.req.query('date') || '';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let params: any[] = [];

  // 1. 稳如老狗的中文多关键词搜索
  const keywords = rawQ.trim().split(/\s+/).filter(Boolean);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map(kw => {
      params.push(`%${kw}%`, `%${kw}%`);
      return `(i.filename LIKE ? OR it.tag LIKE ?)`;
    });
    whereClauses.push(`(${keywordConditions.join(' AND ')})`);
  }

  // 2. 日期精准过滤
  if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = targetDate.setHours(0,0,0,0);
      const endOfDay = targetDate.setHours(23,59,59,999);
      whereClauses.push(`(i.created_at >= ? AND i.created_at <= ?)`);
      params.push(startOfDay, endOfDay);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  params.push(limit, offset);

  // 核心查询
  const query = `
    SELECT i.*, GROUP_CONCAT(it.tag) as tags_str 
    FROM images i
    LEFT JOIN image_tags it ON i.id = it.image_id
    ${whereSql}
    GROUP BY i.id 
    ORDER BY i.created_at DESC 
    LIMIT ? OFFSET ?
  `;

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results.map((r: any) => ({ ...r, tags: r.tags_str ? r.tags_str.split(',') : [] })));
});

router.get('/tags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT DISTINCT tag FROM image_tags ORDER BY tag ASC LIMIT 100').all();
  return c.json(results.map((r: any) => r.tag));
});

export default router;
