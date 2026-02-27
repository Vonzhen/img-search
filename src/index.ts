import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  TEAM_PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ================= 高颜值 & 全自适应 UI 部分 =================
const html = (isLoggedIn: boolean) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✨ 幻彩图库</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.13.5/cdn.min.js" defer></script>
    <style>
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
        [x-cloak] { display: none !important; }
        video::-webkit-media-controls-fullscreen-button { display: none; }
    </style>
</head>
<body class="min-h-screen p-3 md:p-6 transition-all duration-700 ease-in-out text-gray-800 relative pb-24" 
      :style="\`background-image: url('\${bgUrl}'); background-size: cover; background-attachment: fixed; background-position: center;\`" 
      x-data="app()">
    
    <div class="fixed inset-0 bg-black/10 -z-10 pointer-events-none"></div>

    <div class="max-w-6xl mx-auto relative z-10">
        
        <div class="flex justify-between items-center mb-6 md:mb-8 bg-white/70 backdrop-blur-xl p-3 md:p-5 rounded-xl md:rounded-2xl shadow-lg border border-white/50 relative z-40">
            <h1 class="text-lg md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight whitespace-nowrap" x-text="galleryName"></h1>
            
            <div class="flex items-center gap-2 md:gap-4">
                <button x-show="!isLoggedIn" @click="showLoginModal = true" class="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors text-xs md:text-sm font-medium whitespace-nowrap">
                    管理员登录
                </button>

                <div x-show="isLoggedIn" x-cloak class="flex items-center gap-2 md:gap-4">
                    <div class="relative">
                        <button @click="showSettings = !showSettings" class="text-gray-600 hover:text-indigo-600 transition-colors p-1.5 md:p-2 rounded-full hover:bg-white/50 text-xs md:text-sm whitespace-nowrap flex items-center gap-1">
                            ⚙️ <span class="hidden sm:inline">设置</span>
                        </button>
                        <div x-show="showSettings" @click.away="showSettings = false" x-cloak class="absolute right-0 mt-2 w-72 md:w-80 bg-white/95 backdrop-blur-xl p-5 rounded-xl shadow-2xl border border-white/50 z-[100] transition-all">
                            <div class="mb-4">
                                <label class="block text-sm font-bold text-gray-700 mb-2">🏷️ 图库名称</label>
                                <div class="flex gap-2">
                                    <input type="text" x-model="tempName" class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-sm">
                                    <button @click="saveName" class="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm hover:bg-indigo-200 transition font-medium">应用</button>
                                </div>
                            </div>
                            <hr class="border-gray-200 mb-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">🎨 背景设置</label>
                                <div class="flex gap-2 mb-3">
                                    <button @click="bgMode = 'url'" :class="bgMode === 'url' ? 'bg-indigo-500 text-white shadow' : 'bg-gray-100 text-gray-600'" class="flex-1 py-1.5 rounded-md text-xs font-medium transition">网络链接</button>
                                    <button @click="bgMode = 'upload'" :class="bgMode === 'upload' ? 'bg-indigo-500 text-white shadow' : 'bg-gray-100 text-gray-600'" class="flex-1 py-1.5 rounded-md text-xs font-medium transition">本地上传</button>
                                </div>
                                <div x-show="bgMode === 'url'" class="flex flex-col gap-2">
                                    <input type="text" x-model="tempBgUrl" placeholder="输入图片 URL..." class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-sm">
                                    <button @click="saveBgUrl" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg text-sm shadow hover:shadow-lg transition font-medium">保存链接壁纸</button>
                                </div>
                                <div x-show="bgMode === 'upload'" class="flex flex-col gap-2">
                                    <input type="file" x-ref="bgFileInput" accept="image/*" class="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer border border-gray-200 rounded-lg p-1 bg-white/50">
                                    <button @click="uploadBg" :disabled="isUploadingBg" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg text-sm shadow hover:shadow-lg transition font-medium disabled:opacity-50">
                                        <span x-text="isUploadingBg ? '上传中...' : '上传并设为壁纸'"></span>
                                    </button>
                                </div>
                                <button @click="resetBg" class="w-full mt-3 bg-gray-100 text-gray-500 py-1.5 rounded-lg text-xs hover:bg-gray-200 hover:text-gray-700 transition">恢复默认壁纸</button>
                            </div>
                        </div>
                    </div>
                    <div class="w-px h-4 md:h-6 bg-gray-300/50"></div>
                    <button @click="logout" class="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors text-xs md:text-sm font-medium whitespace-nowrap">退出管理</button>
                </div>
            </div>
        </div>

        <div x-show="showLoginModal" x-cloak class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
            <div @click.away="showLoginModal = false" class="bg-white/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-sm text-center transform transition-all">
                <div class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center"><span class="text-3xl">🔐</span></div>
                <h2 class="text-xl font-bold mb-6 text-gray-800">管理员鉴权</h2>
                <input type="password" x-model="password" @keyup.enter="login" class="border-0 ring-1 ring-gray-300 p-3 rounded-xl w-full mb-6 outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-center text-lg tracking-widest shadow-inner" placeholder="输入密码解锁权限">
                <div class="flex gap-3">
                    <button @click="showLoginModal = false" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition font-medium">取消</button>
                    <button @click="login" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:shadow-lg transition font-medium">验证</button>
                </div>
            </div>
        </div>

        <div x-show="isLoggedIn" x-cloak class="bg-white/70 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-lg border border-white/50 mb-6 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-6 md:items-end transition-all">
            <div class="flex-1 w-full">
                <label class="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1"><span>1️⃣</span> 选取文件 (图片/视频可多选)</label>
                <input type="file" x-ref="fileInput" accept="image/*,video/*" multiple class="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition-colors"/>
            </div>
            <div class="flex-1 w-full">
                <label class="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1"><span>2️⃣</span> 标记属性 (支持联想)</label>
                <input type="text" x-model="manualTags" list="history-tags" placeholder="如: 旅行 视频 2026..." class="w-full p-2 bg-white/50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-sm md:text-base">
                <datalist id="history-tags"><template x-for="tag in historyTags"><option :value="tag"></option></template></datalist>
            </div>
            <button @click="upload" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm md:text-base w-full md:w-auto" :disabled="isUploading">
                <span x-text="isUploading ? '处理中...' : '极速上传'"></span>
            </button>
        </div>

        <div class="mb-6 md:mb-8 flex gap-3 relative z-10">
            <div class="relative group flex-1">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                </div>
                <input type="text" x-model="searchQuery" @input.debounce.500ms="executeSearch" placeholder="搜索你想找的画面..." class="w-full pl-11 pr-4 py-3 md:py-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl md:rounded-2xl shadow-lg text-base md:text-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400">
            </div>
            <button x-show="isLoggedIn" @click="toggleSelectMode" x-cloak 
                    :class="isSelectMode ? 'bg-indigo-600 text-white shadow-inner' : 'bg-white/80 text-gray-700 hover:text-indigo-600 hover:bg-white'"
                    class="backdrop-blur-xl border border-white/60 px-4 rounded-xl md:rounded-2xl shadow-lg transition-all font-medium flex items-center gap-2 whitespace-nowrap">
                <span x-text="isSelectMode ? '取消选择' : '☑️ 管理'"></span>
            </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6" id="gallery-grid">
            <template x-for="(img, index) in images" :key="img.id">
                <div class="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl border border-white/50 overflow-hidden group transition-all duration-300"
                     :class="{'ring-4 ring-indigo-500 scale-[0.98]': selectedIds.includes(img.id)}">
                    
                    <div class="aspect-square bg-black/5 relative overflow-hidden" 
                         @click="isSelectMode ? selectImage(img.id) : openLightbox(index)" 
                         class="cursor-pointer">
                        
                        <div x-show="isSelectMode" class="absolute inset-0 bg-black/20 z-10 transition-opacity" :class="selectedIds.includes(img.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"></div>
                        <div x-show="isSelectMode" class="absolute top-2 right-2 md:top-3 md:right-3 z-20 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all"
                             :class="selectedIds.includes(img.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white bg-black/30'">
                            <svg x-show="selectedIds.includes(img.id)" class="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>

                        <div class="w-full h-full block">
                            <template x-if="img.filename.match(/\\.(mp4|mov|webm)$/i)">
                                <video :src="'/api/file/' + img.id" preload="metadata" class="object-cover w-full h-full transition-transform duration-500" :class="isSelectMode ? '' : 'group-hover:scale-110'" autoplay loop muted playsinline></video>
                            </template>
                            <template x-if="!img.filename.match(/\\.(mp4|mov|webm)$/i)">
                                <img :src="'/api/file/' + img.id + '?thumb=true'" class="object-cover w-full h-full transition-transform duration-500" :class="isSelectMode ? '' : 'group-hover:scale-110'" loading="lazy">
                            </template>
                        </div>
                        
                        <div x-show="img.filename.match(/\\.(mp4|mov|webm)$/i)" class="absolute bottom-2 right-2 bg-black/50 backdrop-blur text-white p-1 rounded-md">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
                        </div>
                    </div>

                    <div class="p-3 md:p-4">
                        <div class="flex flex-wrap gap-1 mb-2 md:mb-3 min-h-[24px]">
                            <template x-for="tag in img.tags">
                                <span class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 text-indigo-700 text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded font-medium tracking-wide shadow-sm" x-text="tag"></span>
                            </template>
                        </div>
                        <div class="flex justify-between items-center text-[10px] md:text-xs text-gray-400 border-t border-gray-100 pt-2 md:pt-3">
                            <span class="font-medium" x-text="new Date(img.created_at).toLocaleDateString()"></span>
                            <button x-show="isLoggedIn && !isSelectMode" @click="deleteImage(img.id, index)" class="text-red-400 hover:text-white hover:bg-red-500 px-2 py-1 rounded transition-colors">删除</button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        
        <div x-ref="loadMoreTarget" class="h-10 mt-6 flex items-center justify-center">
            <template x-if="isLoadingMore">
                <div class="flex items-center gap-2 text-indigo-600">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span class="text-sm font-medium">加载更多精彩...</span>
                </div>
            </template>
            <template x-if="!hasMore && images.length > 0">
                <span class="text-gray-400 text-sm">我也是有底线的 🍃</span>
            </template>
        </div>

        <div x-show="images.length === 0 && !isLoadingMore" x-cloak class="text-center py-16 md:py-20 bg-white/50 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm mx-4 md:mx-0">
            <div class="text-5xl md:text-6xl mb-4 opacity-50">🍃</div>
            <p class="text-gray-500 text-base md:text-lg font-medium">这里空空如也</p>
        </div>

        <div x-show="isSelectMode" x-cloak class="fixed bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 px-4 py-2.5 md:px-6 md:py-4 rounded-full shadow-2xl z-[100] flex items-center justify-between gap-3 md:gap-6 w-[85%] md:w-auto max-w-md animate-bounce-short">
            <span class="text-gray-200 font-medium text-sm md:text-base whitespace-nowrap pl-2">已选 <strong class="text-indigo-400 text-lg md:text-xl" x-text="selectedIds.length"></strong> 张</span>
            <div class="h-4 md:h-6 w-px bg-gray-700"></div>
            <button @click="bulkDelete" class="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 md:px-5 md:py-2 rounded-full font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap" :disabled="selectedIds.length === 0 || isDeletingBatch">
                <span x-text="isDeletingBatch ? '清理中...' : '批量删除'"></span>
            </button>
        </div>
    </div>
    
    <div x-show="isLightboxOpen" x-cloak class="fixed inset-0 z-[200] bg-black transition-opacity flex flex-col items-center justify-center"
         @keydown.escape.window="closeLightbox"
         @keydown.left.window="prevImg"
         @keydown.right.window="nextImg">
        
        <div class="absolute inset-0 z-10" @click="showUI = !showUI"></div>

        <button x-show="showUI" x-transition.opacity @click.stop="closeLightbox" class="absolute top-4 right-4 md:top-6 md:right-6 text-white bg-black/50 hover:bg-black/70 p-2 md:p-3 rounded-full backdrop-blur-md transition-all z-50">
            <svg class="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <button x-show="showUI && images.length > 1" x-transition.opacity @click.stop="prevImg" class="hidden md:flex absolute left-6 top-1/2 transform -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 p-4 rounded-full backdrop-blur-md transition-all z-50">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <button x-show="showUI && images.length > 1" x-transition.opacity @click.stop="nextImg" class="hidden md:flex absolute right-6 top-1/2 transform -translate-y-1/2 text-white bg-black/20 hover:bg-black/50 p-4 rounded-full backdrop-blur-md transition-all z-50">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <template x-if="activeImgIndex !== null && images[activeImgIndex]">
            <div class="w-full h-full grid place-items-center overflow-auto z-20" 
                 @touchstart="touchStartX = $event.touches[0].clientX; touchStartY = $event.touches[0].clientY"
                 @touchend="handleSwipe($event.changedTouches[0].clientX, $event.changedTouches[0].clientY)">
                
                <template x-if="images[activeImgIndex].filename.match(/\\.(mp4|mov|webm)$/i)">
                    <video :src="'/api/file/' + images[activeImgIndex].id" controls autoplay playsinline class="max-w-full max-h-[85vh] rounded outline-none" @click.stop></video>
                </template>
                
                <template x-if="!images[activeImgIndex].filename.match(/\\.(mp4|mov|webm)$/i)">
                    <img :src="'/api/file/' + images[activeImgIndex].id"
                         @dblclick.stop="isZoomed = !isZoomed"
                         :class="isZoomed ? 'cursor-zoom-out max-w-none max-h-none' : 'cursor-zoom-in max-w-full max-h-[100vh] object-contain'"
                         class="transition-transform duration-200 m-auto select-none" 
                         title="双击切换放大/缩小">
                </template>
            </div>
        </template>

        <div x-show="showUI && activeImgIndex !== null && !isZoomed" x-transition.opacity class="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl items-center z-50">
            <span class="text-white text-sm max-w-[150px] md:max-w-[300px] truncate" x-text="images[activeImgIndex] ? images[activeImgIndex].filename : ''"></span>
            <div class="w-px h-4 bg-white/30"></div>
            <a :href="images[activeImgIndex] ? '/api/file/' + images[activeImgIndex].id : '#'" download class="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                下载
            </a>
        </div>
    </div>

    <style>
        @keyframes bounce-short { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -10px); } }
        .animate-bounce-short { animation: bounce-short 0.4s ease-out 1; }
    </style>

    <script>
        const DEFAULT_BG = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
        const DEFAULT_NAME = '✨ 幻彩图库';

        async function generateThumbnail(file) {
            if (!file.type.startsWith('image/')) return null; 
            return new Promise((resolve) => {
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const max = 400; 
                    if (width > max || height > max) {
                        if (width > height) { height = Math.round(height * max / width); width = max; }
                        else { width = Math.round(width * max / height); height = max; }
                    }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(b => resolve(b), 'image/webp', 0.7);
                };
                img.onerror = () => resolve(null);
                img.src = url;
            });
        }

        function app() {
            return {
                isLoggedIn: ${isLoggedIn}, password: '', isUploading: false, manualTags: '', searchQuery: '', images: [], historyTags: [],
                showSettings: false, showLoginModal: false, bgMode: 'url', isUploadingBg: false,
                bgUrl: localStorage.getItem('my_gallery_bg') || DEFAULT_BG, tempBgUrl: '',
                galleryName: localStorage.getItem('my_gallery_name') || DEFAULT_NAME, tempName: '',
                isSelectMode: false, selectedIds: [], isDeletingBatch: false,
                
                page: 1, hasMore: true, isLoadingMore: false,

                // 🌟 沉浸式灯箱状态
                isLightboxOpen: false,
                activeImgIndex: null,
                isZoomed: false,
                showUI: true, // 🌟 新增：控制顶部/底部工具栏的显示
                
                // 触摸坐标记录
                touchStartX: 0,
                touchStartY: 0,

                async init() { 
                    this.executeSearch(); 
                    this.tempBgUrl = this.bgUrl;
                    this.tempName = this.galleryName;
                    document.title = this.galleryName;
                    this.$watch('galleryName', value => { document.title = value; });
                    if(this.isLoggedIn) this.fetchHistoryTags(); 

                    const observer = new IntersectionObserver((entries) => {
                        if(entries[0].isIntersecting && this.hasMore && !this.isLoadingMore && this.images.length > 0) {
                            this.loadMore();
                        }
                    }, { rootMargin: '200px' });
                    observer.observe(this.$refs.loadMoreTarget);
                },

                // 🌟 全新灯箱逻辑
                openLightbox(index) {
                    this.activeImgIndex = index;
                    this.isZoomed = false;
                    this.showUI = true; // 打开时默认显示 UI
                    this.isLightboxOpen = true;
                    document.body.style.overflow = 'hidden';
                },
                closeLightbox() {
                    this.isLightboxOpen = false;
                    document.body.style.overflow = '';
                    setTimeout(() => { this.activeImgIndex = null; this.isZoomed = false; this.showUI = true; }, 300);
                },
                prevImg() {
                    if (!this.isLightboxOpen || this.images.length <= 1) return;
                    this.isZoomed = false;
                    this.showUI = true;
                    this.activeImgIndex = (this.activeImgIndex - 1 + this.images.length) % this.images.length;
                },
                nextImg() {
                    if (!this.isLightboxOpen || this.images.length <= 1) return;
                    this.isZoomed = false;
                    this.showUI = true;
                    this.activeImgIndex = (this.activeImgIndex + 1) % this.images.length;
                },
                // 🌟 复刻 Apple Photos 手势：左右切图，上下拉关闭
                handleSwipe(touchEndX, touchEndY) {
                    if (this.isZoomed) return; // 如果图片处于放大状态，允许用户随意拖动，不触发关闭/切换

                    const diffX = this.touchStartX - touchEndX;
                    const diffY = this.touchStartY - touchEndY;

                    // 判断是水平滑动还是垂直滑动为主
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        // 水平滑动切图
                        if (diffX > 50) this.nextImg();
                        else if (diffX < -50) this.prevImg();
                    } else {
                        // 🌟 垂直滑动：无论是上滑还是下滑，只要幅度够大就关闭大图
                        if (Math.abs(diffY) > 80) {
                            this.closeLightbox();
                        }
                    }
                },

                async executeSearch() {
                    this.page = 1; this.hasMore = true;
                    const res = await fetch(\`/api/search?q=\${this.searchQuery}&page=\${this.page}\`);
                    if(res.ok) {
                        const data = await res.json();
                        this.images = data;
                        if(data.length < 50) this.hasMore = false; 
                    }
                },
                async loadMore() {
                    this.isLoadingMore = true; this.page++;
                    const res = await fetch(\`/api/search?q=\${this.searchQuery}&page=\${this.page}\`);
                    if(res.ok) {
                        const data = await res.json();
                        this.images = [...this.images, ...data];
                        if(data.length < 50) this.hasMore = false;
                    }
                    this.isLoadingMore = false;
                },

                toggleSelectMode() { this.isSelectMode = !this.isSelectMode; this.selectedIds = []; },
                selectImage(id) {
                    const idx = this.selectedIds.indexOf(id);
                    if (idx > -1) this.selectedIds.splice(idx, 1);
                    else this.selectedIds.push(id);
                },
                async bulkDelete() {
                    if (this.selectedIds.length === 0) return;
                    if (!confirm(\`⚠️ 警告！\\n确定要永久删除这 \${this.selectedIds.length} 个文件吗？\\n此操作不可恢复！\`)) return;

                    this.isDeletingBatch = true;
                    let deleted = 0;
                    for (const id of this.selectedIds) {
                        try {
                            const res = await fetch('/api/file/' + id, { method: 'DELETE' });
                            if(res.ok) {
                                deleted++;
                                this.images = this.images.filter(img => img.id !== id);
                            }
                        } catch(e) {}
                    }
                    
                    alert(\`✅ 成功清理 \${deleted} 个文件！\`);
                    this.isSelectMode = false;
                    this.selectedIds = [];
                    this.isDeletingBatch = false;
                },
                
                async deleteImage(id, index) { 
                    if(confirm('确定永久删除该文件吗?')) { 
                        await fetch('/api/file/'+id, {method:'DELETE'}); 
                        this.images.splice(index, 1); 
                    } 
                },

                saveName() { if(this.tempName.trim()) { this.galleryName = this.tempName; localStorage.setItem('my_gallery_name', this.galleryName); } },
                saveBgUrl() { if(this.tempBgUrl.trim()) { this.bgUrl = this.tempBgUrl; localStorage.setItem('my_gallery_bg', this.bgUrl); this.showSettings = false; } },
                async uploadBg() { /*...*/ },
                resetBg() { this.bgUrl = DEFAULT_BG; this.tempBgUrl = DEFAULT_BG; localStorage.removeItem('my_gallery_bg'); this.showSettings = false; },
                async login() { const res = await fetch('/api/login', { method:'POST', body:JSON.stringify({pass:this.password})}); if(res.ok) window.location.reload(); else alert('密码错误'); },
                async logout() { await fetch('/api/logout', { method:'POST'}); window.location.reload(); },
                async fetchHistoryTags() { const res = await fetch('/api/tags'); if(res.ok) this.historyTags = await res.json(); },
                
                async upload() {
                    const files = this.$refs.fileInput.files;
                    if(!files.length) return alert('请选文件');
                    if(!this.manualTags.trim()) return alert('打个标签方便以后寻找哦~');
                    
                    this.isUploading = true;
                    let successCount = 0, failCount = 0;

                    for(let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const fd = new FormData(); 
                        fd.append('file', file); 
                        fd.append('tags', this.manualTags);
                        
                        const thumbBlob = await generateThumbnail(file);
                        if (thumbBlob) fd.append('thumb', thumbBlob, 'thumb.webp');

                        try {
                            const res = await fetch('/api/upload', {method:'POST', body:fd});
                            if(res.ok) successCount++; else failCount++;
                        } catch(e) { failCount++; }
                    }

                    if (failCount > 0) alert(\`执行完毕！成功 \${successCount} 个，失败 \${failCount} 个。\`);
                    else alert(\`🎉 完美！成功上传 \${successCount} 个文件！\`);

                    this.$refs.fileInput.value = ''; 
                    this.manualTags = ''; 
                    this.executeSearch(); 
                    this.fetchHistoryTags();
                    this.isUploading = false;
                }
            }
        }
    </script>
</body>
</html>
`;

// ================= 后端逻辑 =================

const checkAuth = (c: any) => getCookie(c, 'auth_token') === c.env.TEAM_PASSWORD;

app.get('/', (c) => c.html(html(checkAuth(c))));

app.post('/api/login', async (c) => {
  const { pass } = await c.req.json();
  if (pass === c.env.TEAM_PASSWORD) {
    setCookie(c, 'auth_token', pass, { httpOnly: true, maxAge: 86400 * 30, path: '/' });
    return c.json({ ok: true });
  }
  return c.json({ error: 'Wrong' }, 401);
});

app.post('/api/logout', (c) => {
  setCookie(c, 'auth_token', '', { maxAge: 0, path: '/' });
  return c.json({ ok: true });
});

app.get('/api/settings/bg', async (c) => {
  const obj = await c.env.BUCKET.get('_site_custom_bg_');
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400');
  return new Response(obj.body, { headers });
});

app.post('/api/settings/bg', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
  const fd = await c.req.parseBody();
  const file = fd['file'];
  if (!(file instanceof File)) return c.json({ error: 'No file' }, 400);
  await c.env.BUCKET.put('_site_custom_bg_', file.stream(), { httpMetadata: { contentType: file.type } });
  return c.json({ success: true, url: '/api/settings/bg' });
});

app.get('/api/tags', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT DISTINCT tag FROM image_tags ORDER BY tag ASC LIMIT 100').all();
  return c.json(results.map((r: any) => r.tag));
});

app.get('/api/search', async (c) => {
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

app.get('/api/file/:id', async (c) => {
  const cache = caches.default, key = c.req.url;
  const cached = await cache.match(key);
  if (cached) return new Response(cached.body, cached);

  const id = c.req.param('id');
  const isThumbReq = c.req.query('thumb') === 'true'; 
  
  const file = await c.env.DB.prepare('SELECT r2_key FROM images WHERE id = ?').bind(id).first();
  if (!file) return c.notFound();
  
  const r2Key = file.r2_key as string;
  let obj = null;

  if (isThumbReq) {
      obj = await c.env.BUCKET.get(r2Key + '_thumb');
  }
  if (!obj) {
      obj = await c.env.BUCKET.get(r2Key);
  }
  
  if (!obj) return c.notFound();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=14400');
  
  const res = new Response(obj.body, { headers });
  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
});

app.post('/api/upload', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
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
  
  const batch = [
    c.env.DB.prepare('INSERT INTO images (id, filename, r2_key, size, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, file.name, id, file.size, Date.now())
  ];
  uniqueTags.forEach(t => batch.push(c.env.DB.prepare('INSERT OR IGNORE INTO image_tags (image_id, tag) VALUES (?, ?)').bind(id, t.toLowerCase())));
  
  await c.env.DB.batch(batch);
  return c.json({ success: true });
});

app.delete('/api/file/:id', async (c) => {
  if (!checkAuth(c)) return c.json({ error: 'Unauthorized' }, 401);
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

export default app;
