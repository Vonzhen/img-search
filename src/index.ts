import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  TEAM_PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ================= 高颜值 UI 部分 =================
const html = (isLoggedIn: boolean) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>幻彩图库</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.13.5/cdn.min.js" defer></script>
    <style>
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="min-h-screen p-4 transition-all duration-700 ease-in-out text-gray-800 relative" 
      :style="\`background-image: url('\${bgUrl}'); background-size: cover; background-attachment: fixed; background-position: center;\`" 
      x-data="app()">
    
    <div class="fixed inset-0 bg-black/10 -z-10 pointer-events-none"></div>

    <div class="max-w-6xl mx-auto relative z-10">
        <div class="flex justify-between items-center mb-8 bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/50">
            <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                ✨ 幻彩图库
            </h1>
            
            <div class="flex items-center gap-4">
                <div class="relative">
                    <button @click="showSettings = !showSettings" class="text-gray-600 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-white/50">
                        🎨 换背景
                    </button>
                    <div x-show="showSettings" @click.away="showSettings = false" x-cloak class="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-white/50 z-50 transition-all">
                        <label class="block text-sm font-medium text-gray-700 mb-2">图片 URL</label>
                        <input type="text" x-model="tempBgUrl" placeholder="输入图片链接..." class="w-full p-2 border border-gray-300 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50">
                        <div class="flex gap-2">
                            <button @click="saveBg" class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-1.5 rounded-lg text-sm shadow hover:shadow-lg transition">保存</button>
                            <button @click="resetBg" class="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition">恢复</button>
                        </div>
                    </div>
                </div>
                
                <div class="w-px h-6 bg-gray-300/50"></div>
                
                <button x-show="!isLoggedIn" @click="showLoginModal = true" class="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">管理员登录</button>
                <button x-show="isLoggedIn" @click="logout" x-cloak class="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">退出管理</button>
            </div>
        </div>

        <div x-show="showLoginModal" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
            <div @click.away="showLoginModal = false" class="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 w-96 text-center transform transition-all">
                <div class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center">
                    <span class="text-3xl">🔐</span>
                </div>
                <h2 class="text-xl font-bold mb-6 text-gray-800">管理员鉴权</h2>
                <input type="password" x-model="password" @keyup.enter="login" class="border-0 ring-1 ring-gray-300 p-3 rounded-xl w-full mb-6 outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-center text-lg tracking-widest shadow-inner" placeholder="输入密码解锁上传">
                <div class="flex gap-3">
                    <button @click="showLoginModal = false" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition font-medium">取消</button>
                    <button @click="login" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:shadow-lg transition font-medium">验证</button>
                </div>
            </div>
        </div>

        <div x-show="isLoggedIn" x-cloak class="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/50 mb-8 flex flex-col md:flex-row gap-6 items-end transition-all">
            <div class="flex-1 w-full">
                <label class="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2"><span>1</span> 选取相片 (可多选)</label>
                <input type="file" x-ref="fileInput" accept="image/*" multiple class="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition-colors"/>
            </div>
            <div class="flex-1 w-full">
                <label class="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2"><span>2</span> 标记属性 (支持联想)</label>
                <input type="text" x-model="manualTags" list="history-tags" placeholder="如: 旅行 海边 2026..." class="w-full p-2.5 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-sm transition-all">
                <datalist id="history-tags"><template x-for="tag in historyTags"><option :value="tag"></option></template></datalist>
            </div>
            <button @click="upload" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-2.5 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium" :disabled="isUploading">
                <span x-text="isUploading ? '处理中...' : '极速上传'"></span>
            </button>
        </div>

        <div class="mb-8 relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span class="text-gray-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
            </div>
            <input type="text" x-model="searchQuery" @input.debounce.300ms="search" placeholder="搜索任何你想找的画面..." class="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg text-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder-gray-400">
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <template x-for="img in images" :key="img.id">
                <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-2xl border border-white/50 overflow-hidden group transition-all duration-300 hover:-translate-y-1">
                    <div class="aspect-w-1 aspect-h-1 bg-gray-100/50 relative overflow-hidden">
                        <a :href="'/api/file/' + img.id" target="_blank">
                            <img :src="'/api/file/' + img.id" class="object-cover w-full h-56 group-hover:scale-110 transition-transform duration-500 cursor-zoom-in" loading="lazy">
                        </a>
                    </div>
                    <div class="p-4">
                        <div class="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
                            <template x-for="tag in img.tags">
                                <span class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 text-indigo-700 text-[10px] px-2.5 py-1 rounded-lg font-medium tracking-wide shadow-sm" x-text="tag"></span>
                            </template>
                        </div>
                        <div class="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                            <span class="font-medium" x-text="new Date(img.created_at).toLocaleDateString()"></span>
                            <button x-show="isLoggedIn" @click="deleteImage(img.id)" class="text-red-400 hover:text-white hover:bg-red-500 px-2 py-1 rounded transition-colors">删除</button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        
        <div x-show="images.length === 0" x-cloak class="text-center py-20 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 mt-8 shadow-sm">
            <div class="text-6xl mb-4 opacity-50">🍃</div>
            <p class="text-gray-500 text-lg font-medium">这里空空如也</p>
        </div>
    </div>
    
    <script>
        const DEFAULT_BG = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

        function app() {
            return {
                isLoggedIn: ${isLoggedIn}, password: '', isUploading: false, manualTags: '', searchQuery: '', images: [], historyTags: [],
                showSettings: false, showLoginModal: false,
                bgUrl: localStorage.getItem('my_gallery_bg') || DEFAULT_BG,
                tempBgUrl: '',

                async init() { 
                    this.search(); // 所有人进来都能触发搜索看图
                    this.tempBgUrl = this.bgUrl;
                    if(this.isLoggedIn) {
                        this.fetchHistoryTags(); // 只有登录了才拉取标签供联想
                    }
                },
                saveBg() {
                    if(this.tempBgUrl.trim() === '') return;
                    this.bgUrl = this.tempBgUrl;
                    localStorage.setItem('my_gallery_bg', this.bgUrl);
                    this.showSettings = false;
                },
                resetBg() {
                    this.bgUrl = DEFAULT_BG;
                    this.tempBgUrl = DEFAULT_BG;
                    localStorage.removeItem('my_gallery_bg');
                    this.showSettings = false;
                },
                async login() { 
                    const res = await fetch('/api/login', { method:'POST', body:JSON.stringify({pass:this.password})}); 
                    if(res.ok) window.location.reload(); 
                    else alert('密码错误'); 
                },
                async logout() { 
                    await fetch('/api/logout', { method:'POST'}); 
                    window.location.reload(); 
                },
                async fetchHistoryTags() { const res = await fetch('/api/tags'); if(res.ok) this.historyTags = await res.json(); },
                async search() { const res = await fetch('/api/search?q='+this.searchQuery); if(res.ok) this.images = await res.json(); },
                
                async upload() {
                    const files = this.$refs.fileInput.files;
                    if(!files.length) return alert('请选图');
                    if(!this.manualTags.trim()) return alert('打个标签方便以后寻找哦~');
                    
                    this.isUploading = true;
                    let successCount = 0;

                    for(let i = 0; i < files.length; i++) {
                        const fd = new FormData(); 
                        fd.append('file', files[i]); 
                        fd.append('tags', this.manualTags);
                        try {
                            const res = await fetch('/api/upload', {method:'POST', body:fd});
                            if(res.ok) successCount++;
                        } catch(e) { console.error('上传出错', e); }
                    }

                    this.$refs.fileInput.value = ''; 
                    this.manualTags = ''; 
                    this.search(); 
                    this.fetchHistoryTags();
                    this.isUploading = false;
                },
                async deleteImage(id) { if(confirm('美丽的照片要被删除了，确定吗?')) { await fetch('/api/file/'+id, {method:'DELETE'}); this.search(); } }
            }
        }
    </script>
</body>
</html>
`;

// ================= 后端逻辑 =================

// 辅助鉴权函数
const checkAuth = (c: any) => getCookie(c, 'auth_token') === c.env.TEAM_PASSWORD;

// 1. 首页 (任何人可访问，注入登录状态)
app.get('/', (c) => c.html(html(checkAuth(c))));

// 2. 登录接口
app.post('/api/login', async (c) => {
  const { pass } = await c.req.json();
  if (pass === c.env.TEAM_PASSWORD) {
    setCookie(c, 'auth_token', pass, { httpOnly: true, maxAge: 86400 * 30, path: '/' });
    return c.json({ ok: true });
  }
  return c.json({ error: 'Wrong' }, 401);
});

// 3. 退出接口
app.post('/api/logout', (c) => {
  setCookie(c, 'auth_token', '', { maxAge: 0, path: '/' });
  return c.json({ ok: true });
});

// ---------------- 以下是业务接口 ----------------

// 4. 获取历史标签 (完全公开，但其实只有上传时前端才调用)
app.get('/api/tags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT DISTINCT tag FROM image_tags ORDER BY tag ASC LIMIT 100').all();
  return c.json(results.map((r: any) => r.tag));
});

// 5. 搜索接口 (完全公开，无需鉴权即可看图)
app.get('/api/search', async (c) => {
  const term = `%${c.req.query('q') || ''}%`;
  const { results } = await c.env.DB.prepare(`
    SELECT i.*, GROUP_CONCAT(it.tag) as tags_str FROM images i
    LEFT JOIN image_tags it ON i.id = it.image_id
    WHERE i.filename LIKE ? OR it.tag LIKE ?
    GROUP BY i.id ORDER BY i.created_at DESC LIMIT 50
  `).bind(term, term).all();
  return c.json(results.map((r: any) => ({ ...r, tags: r.tags_str ? r.tags_str.split(',') : [] })));
});

// 6. 查看看图 (完全公开，带缓存机制)
app.get('/api/file/:id', async (c) => {
  const cache = caches.default, key = c.req.url;
  const cached = await cache.match(key);
  if (cached) return new Response(cached.body, cached);

  const id = c.req.param('id');
  const file = await c.env.DB.prepare('SELECT r2_key FROM images WHERE id = ?').bind(id).first();
  if (!file) return c.notFound();
  
  const obj = await c.env.BUCKET.get(file.r2_key as string);
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=14400'); // 允许访客缓存 4 小时
  
  const res = new Response(obj.body, { headers });
  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
});

// ---------------- 以下是敏感接口 (必须鉴权) ----------------

// 7. 上传接口 (仅管理员可传)
app.post('/api/upload', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401); // 🔴 鉴权拦截

  const fd = await c.req.parseBody();
  const file = fd['file'];
  const tagsStr = fd['tags'] as string;
  if (!(file instanceof File)) return c.json({ error: 'No file' }, 400);

  const tags = tagsStr ? tagsStr.split(/[,，\s]+/).filter(Boolean) : ['未分类'];
  const uniqueTags = [...new Set(tags)];
  const id = crypto.randomUUID();
  
  await c.env.BUCKET.put(id, file.stream(), { httpMetadata: { contentType: file.type } });
  
  const batch = [
    c.env.DB.prepare('INSERT INTO images (id, filename, r2_key, size, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, file.name, id, file.size, Date.now())
  ];
  uniqueTags.forEach(t => batch.push(c.env.DB.prepare('INSERT OR IGNORE INTO image_tags (image_id, tag) VALUES (?, ?)').bind(id, t.toLowerCase())));
  
  await c.env.DB.batch(batch);
  return c.json({ success: true });
});

// 8. 删除接口 (仅管理员可删)
app.delete('/api/file/:id', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401); // 🔴 鉴权拦截

  const id = c.req.param('id');
  const file = await c.env.DB.prepare('SELECT r2_key FROM images WHERE id = ?').bind(id).first();
  if (file) {
    await c.env.BUCKET.delete(file.r2_key as string);
    await c.env.DB.prepare('DELETE FROM image_tags WHERE image_id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
  }
  return c.json({ success: true });
});

export default app;
