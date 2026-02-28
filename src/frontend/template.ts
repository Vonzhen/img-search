// src/frontend/template.ts

export const html = (isLoggedIn: boolean) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✨ 幻彩图库</title>
    
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="图库">
    <meta name="theme-color" content="#ffffff">
    <link rel="apple-touch-icon" href="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/2728.png">
    <link rel="manifest" href='data:application/manifest+json,{"name":"幻彩图库","short_name":"图库","display":"standalone","background_color":"#ffffff","theme_color":"#4f46e5","icons":[{"src":"https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/2728.png","sizes":"72x72","type":"image/png"}]}'>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.13.5/cdn.min.js" defer></script>
    <style>
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        [x-cloak] { display: none !important; }
        video::-webkit-media-controls-fullscreen-button { display: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="h-screen w-full flex overflow-hidden text-gray-800 relative transition-all duration-700 ease-in-out" 
      :style="\`background-image: url('\${bgUrl}'); background-size: cover; background-attachment: fixed; background-position: center;\`" 
      x-data="app()">
    
    <div class="absolute inset-0 bg-black/10 -z-10 pointer-events-none"></div>
    <div x-show="isSidebarOpen" x-cloak class="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity" @click="isSidebarOpen = false"></div>

    <aside class="fixed inset-y-0 left-0 z-50 w-64 md:w-72 bg-white/85 backdrop-blur-2xl border-r border-white/50 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none"
           :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
        
        <div class="p-4 md:p-5 md:pt-8 flex justify-between items-center mb-2">
            <h1 class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight truncate" x-text="galleryName"></h1>
            <button class="md:hidden text-gray-400 hover:text-gray-600 p-1" @click="isSidebarOpen = false">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div class="px-3 md:px-5 mb-6 w-full box-border">
            <h3 class="text-xs font-bold text-gray-400 mb-2 px-1 uppercase tracking-wider">📅 时光归档</h3>
            <div class="relative w-full overflow-hidden rounded-xl">
                <input type="date" x-model="searchDate" @change="executeSearch(); if(window.innerWidth < 768) isSidebarOpen = false" 
                       class="block w-full px-2 py-2 bg-white/60 border border-gray-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-600 shadow-sm hover:bg-white focus:bg-white cursor-pointer box-border">
                <button x-show="searchDate" @click="searchDate = ''; executeSearch()" class="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 bg-white/80 rounded-full p-1 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto px-3 md:px-4 pb-4 scrollbar-hide">
            <h3 class="text-xs font-bold text-gray-400 mb-3 px-1 uppercase tracking-wider">🏷️ 画面分类</h3>
            <div class="flex flex-wrap gap-2">
                <button @click="searchQuery = ''; searchDate = ''; executeSearch(); if(window.innerWidth < 768) isSidebarOpen = false"
                        class="px-3 py-1.5 rounded-full text-xs transition-all duration-200 font-medium"
                        :class="(searchQuery === '' && searchDate === '') ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-200'">
                    全部照片
                </button>
                <template x-for="tag in historyTags">
                    <button @click="searchQuery = tag; searchDate = ''; executeSearch(); if(window.innerWidth < 768) isSidebarOpen = false"
                            class="px-3 py-1.5 rounded-full text-xs transition-all duration-200 font-medium truncate max-w-full"
                            :class="searchQuery === tag ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-200'">
                        <span x-text="tag"></span>
                    </button>
                </template>
            </div>
        </div>

        <div class="p-3 md:p-4 border-t border-gray-100/50 bg-white/40">
            <template x-if="!isLoggedIn">
                <button @click="showLoginModal = true" class="w-full flex justify-center items-center gap-2 bg-white/80 hover:bg-indigo-50 border border-gray-200 text-indigo-600 py-2 md:py-2.5 rounded-xl transition-all text-sm font-medium shadow-sm">
                    <span>🔐</span> 管理员登录
                </button>
            </template>
            <template x-if="isLoggedIn">
                <div class="flex gap-2">
                    <button @click="showSettings = true" class="flex-1 flex justify-center items-center gap-1 bg-white/80 hover:bg-white border border-gray-200 text-gray-600 py-2 rounded-xl transition-all text-xs font-medium shadow-sm hover:text-indigo-600">⚙️ 设置</button>
                    <button @click="logout" class="flex-1 flex justify-center items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 py-2 rounded-xl transition-all text-xs font-medium shadow-sm">🚪 退出</button>
                </div>
            </template>
        </div>
    </aside>

    <main class="flex-1 h-full overflow-y-auto relative scroll-smooth flex flex-col pb-24">
        
        <div class="md:hidden sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/50 px-4 py-3 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <button @click="isSidebarOpen = true" class="text-gray-600 hover:text-indigo-600 p-1 bg-white/50 rounded-lg shadow-sm border border-gray-200/50">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <h2 class="text-lg font-bold text-gray-800 truncate" x-text="(searchQuery || searchDate) ? ((searchQuery ? '#' + searchQuery + ' ' : '') + searchDate) : galleryName"></h2>
            </div>
            <button x-show="isLoggedIn" @click="toggleSelectMode" x-cloak class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" :class="isSelectMode ? 'bg-indigo-600 text-white' : 'bg-white/80 text-gray-700 border border-gray-200'">
                <span x-text="isSelectMode ? '取消' : '☑️ 管理'"></span>
            </button>
        </div>

        <div class="p-3 md:p-8 max-w-7xl mx-auto w-full">
            
            <div class="hidden md:flex justify-end mb-4 relative z-10">
                <button x-show="isLoggedIn" @click="toggleSelectMode" x-cloak class="text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm border" :class="isSelectMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-gray-700 hover:text-indigo-600 hover:bg-white border-white/60'">
                    <span x-text="isSelectMode ? '取消选择模式' : '☑️ 批量管理照片'"></span>
                </button>
            </div>

            <div x-show="isLoggedIn" x-cloak class="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-lg border border-white/50 mb-6 flex flex-col md:flex-row gap-4 md:gap-6 md:items-end transition-all">
                <div class="flex-1 w-full">
                    <label class="text-sm font-semibold text-gray-700 mb-2 block"><span>1️⃣</span> 选取文件</label>
                    <input type="file" x-ref="fileInput" accept="image/*,video/*" multiple class="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer transition-colors"/>
                </div>
                <div class="flex-1 w-full">
                    <label class="text-sm font-semibold text-gray-700 mb-2 block"><span>2️⃣</span> 分类标签 (空格分隔)</label>
                    <input type="text" x-model="manualTags" placeholder="如: 旅行 视频 2026..." class="w-full p-2 bg-white/60 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm">
                    <div class="mt-2 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto scrollbar-hide">
                        <template x-for="tag in historyTags">
                            <span @click="manualTags += (manualTags ? ' ' : '') + tag" class="cursor-pointer text-[10px] bg-gray-100/80 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-2 py-0.5 rounded-full border border-gray-200 transition-colors" x-text="tag"></span>
                        </template>
                    </div>
                </div>
                <button @click="upload" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 transition-all font-medium text-sm w-full md:w-auto h-[40px]" :disabled="isUploading">
                    <span x-text="isUploading ? '处理中...' : '极速上传'"></span>
                </button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 md:gap-4" id="gallery-grid">
                <template x-for="(img, index) in images" :key="img.id">
                    <div class="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl border border-white/50 overflow-hidden group transition-all duration-300 flex flex-col"
                         :class="{'ring-4 ring-indigo-500 scale-[0.98] z-10': selectedIds.includes(img.id)}">
                        
                        <div class="aspect-square bg-black/5 relative overflow-hidden flex-1" 
                             @click="isSelectMode ? selectImage(img.id) : openLightbox(index)" 
                             class="cursor-pointer">
                            <div x-show="isSelectMode" class="absolute inset-0 bg-black/20 z-10 transition-opacity" :class="selectedIds.includes(img.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"></div>
                            <div x-show="isSelectMode" class="absolute top-2 right-2 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                                 :class="selectedIds.includes(img.id) ? 'bg-indigo-500 border-indigo-500' : 'border-white bg-black/30'">
                                <svg x-show="selectedIds.includes(img.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
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

                        <div x-show="isLoggedIn" class="p-2.5 md:p-3 bg-white/60 border-t border-white/40">
                            <div class="flex flex-wrap gap-1 mb-2 min-h-[20px]">
                                <template x-for="tag in img.tags">
                                    <span @click.stop="searchQuery = tag; searchDate = ''; executeSearch()" class="cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100/50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded tracking-wide shadow-sm transition-colors" x-text="tag"></span>
                                </template>
                            </div>
                            <div class="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-200/60 pt-2">
                                <span class="font-medium" x-text="new Date(img.created_at).toLocaleDateString()"></span>
                                <div x-show="!isSelectMode" class="flex gap-2">
                                    <button @click.stop="openEditTags(img)" class="text-indigo-400 hover:text-indigo-600 transition-colors">编辑</button>
                                    <button @click.stop="deleteImage(img.id, index)" class="text-red-400 hover:text-red-600 transition-colors">删除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
            
            <div x-ref="loadMoreTarget" class="h-10 mt-8 flex items-center justify-center">
                <template x-if="isLoadingMore">
                    <div class="flex items-center gap-2 text-indigo-600 bg-white/80 px-4 py-2 rounded-full shadow-sm">
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span class="text-sm font-medium">加载更多...</span>
                    </div>
                </template>
                <template x-if="!hasMore && images.length > 0">
                    <span class="text-gray-400 text-sm bg-white/50 px-4 py-2 rounded-full">没有更多图片了 🍃</span>
                </template>
            </div>

            <div x-show="images.length === 0 && !isLoadingMore" x-cloak class="text-center py-20 bg-white/50 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm mt-4">
                <div class="text-5xl md:text-6xl mb-4 opacity-50">🍃</div>
                <p class="text-gray-500 text-lg font-medium">这里空空如也</p>
                <button x-show="searchQuery !== '' || searchDate !== ''" @click="searchQuery = ''; searchDate = ''; executeSearch()" class="mt-4 text-indigo-500 hover:text-indigo-600 text-sm underline underline-offset-4">查看全部照片</button>
            </div>

        </div>
    </main>

    <div x-show="!isSelectMode && !isSidebarOpen" x-transition.opacity class="fixed bottom-6 right-5 md:bottom-10 md:right-10 z-[90] flex justify-end">
        <button x-show="!isSearchActive" @click="isSearchActive = true; $nextTick(() => $refs.searchInput.focus())" 
                class="w-12 h-12 md:w-14 md:h-14 bg-white/40 backdrop-blur-lg border border-white/40 shadow-xl rounded-full flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>

        <div x-show="isSearchActive" x-cloak @click.away="isSearchActive = false" 
             class="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-full flex items-center w-[85vw] max-w-sm transition-all overflow-hidden h-12 md:h-14 origin-right">
            <div class="pl-4 text-indigo-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input x-ref="searchInput" type="text" x-model="searchQuery" @input.debounce.500ms="executeSearch" placeholder="搜索标签或名称..." 
                   class="w-full bg-transparent border-none outline-none py-2 px-3 text-sm md:text-base text-gray-800 placeholder-gray-500 font-medium">
            <button x-show="searchQuery" @click="searchQuery = ''; executeSearch()" class="pr-2 text-gray-400 hover:text-red-500 transition-colors">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <button @click="isSearchActive = false" class="pr-5 pl-3 h-full text-gray-600 font-bold text-sm border-l border-white/40 hover:bg-white/30 transition-colors">取消</button>
        </div>
    </div>

    <div x-show="isLightboxOpen" x-cloak class="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl transition-opacity flex flex-col items-center justify-center"
         @keydown.escape.window="closeLightbox"
         @keydown.left.window="prevImg"
         @keydown.right.window="nextImg">
        
        <button @click="closeLightbox" class="absolute top-4 right-4 md:top-5 md:right-5 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 md:p-2 rounded-full transition-all z-50">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <button x-show="images.length > 1" @click.stop="prevImg" class="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all z-50">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <button x-show="images.length > 1" @click.stop="nextImg" class="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all z-50">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <template x-if="activeImgIndex !== null && images[activeImgIndex]">
            <div class="w-full h-full grid place-items-center overflow-auto p-2" 
                 @click.self="closeLightbox"
                 @touchstart="touchStartX = $event.touches[0].clientX; touchStartY = $event.touches[0].clientY"
                 @touchend="handleSwipe($event.changedTouches[0].clientX, $event.changedTouches[0].clientY)">
                
                <template x-if="images[activeImgIndex].filename.match(/\\.(mp4|mov|webm)$/i)">
                    <video :src="'/api/file/' + images[activeImgIndex].id" controls autoplay playsinline class="max-w-full max-h-[85vh] rounded-lg shadow-2xl outline-none"></video>
                </template>
                
                <template x-if="!images[activeImgIndex].filename.match(/\\.(mp4|mov|webm)$/i)">
                    <img :src="'/api/file/' + images[activeImgIndex].id"
                         @click.stop="if(window.innerWidth >= 768) isZoomed = !isZoomed"
                         :class="isZoomed ? 'cursor-zoom-out max-w-none max-h-none' : 'max-w-full max-h-[85vh] object-contain rounded-lg'"
                         class="transition-all duration-200 shadow-2xl m-auto">
                </template>
            </div>
        </template>

        <div x-show="activeImgIndex !== null && !isZoomed" class="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-xl items-center z-50 transition-opacity">
            <a :href="images[activeImgIndex] ? '/api/file/' + images[activeImgIndex].id : '#'" target="_blank" class="text-white hover:text-indigo-300 text-xs md:text-sm font-medium flex items-center gap-1.5 transition-colors">
                <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                查看原图
            </a>
        </div>
    </div>

    <div x-show="isEditTagsOpen" x-cloak class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
        <div @click.away="isEditTagsOpen = false" class="bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-sm transform transition-all">
            <h2 class="text-lg font-bold mb-4 text-gray-800">编辑分类/标签</h2>
            <p class="text-xs text-gray-500 mb-4">用空格分隔多个标签</p>
            <input type="text" x-model="editTagsText" @keyup.enter="saveEditedTags" class="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-sm mb-6">
            <div class="flex gap-3">
                <button @click="isEditTagsOpen = false" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition font-medium text-sm">取消</button>
                <button @click="saveEditedTags" :disabled="isSavingTags" class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-xl hover:shadow-lg transition font-medium text-sm disabled:opacity-50">
                    <span x-text="isSavingTags ? '保存中...' : '确定保存'"></span>
                </button>
            </div>
        </div>
    </div>

    <div x-show="showLoginModal" x-cloak class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
        <div @click.away="showLoginModal = false" class="bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-sm text-center transform transition-all">
            <div class="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center"><span class="text-3xl">🔐</span></div>
            <h2 class="text-xl font-bold mb-6 text-gray-800">管理员登录</h2>
            <input type="password" x-model="password" @keyup.enter="login" class="border-0 ring-1 ring-gray-300 p-3 rounded-xl w-full mb-6 outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-center text-lg tracking-widest shadow-inner" placeholder="输入密码解锁权限">
            <div class="flex gap-3">
                <button @click="showLoginModal = false" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-300 transition font-medium">取消</button>
                <button @click="login" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:shadow-lg transition font-medium">验证</button>
            </div>
        </div>
    </div>

    <div x-show="showSettings" x-cloak class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
        <div @click.away="showSettings = false" class="bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 w-full max-w-md transform transition-all">
            <h2 class="text-xl font-bold mb-6 text-gray-800 text-center">系统设置</h2>
            <div class="mb-5">
                <label class="block text-sm font-bold text-gray-700 mb-2">🏷️ 图库名称</label>
                <div class="flex gap-2">
                    <input type="text" x-model="tempName" class="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-sm">
                    <button @click="saveName" class="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-100 transition font-medium border border-indigo-200">应用</button>
                </div>
            </div>
            <hr class="border-gray-200 mb-5">
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-3">🎨 背景壁纸设置</label>
                <div class="flex gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
                    <button @click="bgMode = 'url'" :class="bgMode === 'url' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500'" class="flex-1 py-1.5 rounded-md text-sm font-medium transition">网络链接</button>
                    <button @click="bgMode = 'upload'" :class="bgMode === 'upload' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500'" class="flex-1 py-1.5 rounded-md text-sm font-medium transition">本地上传</button>
                </div>
                <div x-show="bgMode === 'url'" class="flex flex-col gap-3">
                    <input type="text" x-model="tempBgUrl" placeholder="输入图片 URL..." class="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white/50 text-sm">
                    <button @click="saveBgUrl" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-xl text-sm shadow hover:shadow-lg transition font-medium">保存链接壁纸</button>
                </div>
                <div x-show="bgMode === 'upload'" class="flex flex-col gap-3">
                    <input type="file" x-ref="bgFileInput" accept="image/*" class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer border border-gray-200 rounded-xl p-1 bg-white/50">
                    <button @click="uploadBg" :disabled="isUploadingBg" class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-xl text-sm shadow hover:shadow-lg transition font-medium disabled:opacity-50">
                        <span x-text="isUploadingBg ? '上传中...' : '上传并设为壁纸'"></span>
                    </button>
                </div>
                <button @click="resetBg" class="w-full mt-4 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-200 hover:text-gray-700 transition font-medium">恢复默认壁纸</button>
            </div>
            <button @click="showSettings = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
    </div>

    <div x-show="isSelectMode" x-cloak class="fixed bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-gray-700 px-4 py-3 md:px-6 md:py-4 rounded-full shadow-2xl z-[100] flex items-center justify-between gap-4 md:gap-6 w-[85%] md:w-auto max-w-md">
        <span class="text-gray-200 font-medium text-sm md:text-base whitespace-nowrap pl-2">已选 <strong class="text-indigo-400 text-lg md:text-xl" x-text="selectedIds.length"></strong> 张</span>
        <div class="h-5 w-px bg-gray-700"></div>
        <button @click="bulkDelete" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap" :disabled="selectedIds.length === 0 || isDeletingBatch">
            <span x-text="isDeletingBatch ? '清理中...' : '批量删除'"></span>
        </button>
    </div>

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
                isLightboxOpen: false, activeImgIndex: null, isZoomed: false, 
                
                touchStartX: 0, touchStartY: 0, searchDate: '', isSidebarOpen: false,

                isEditTagsOpen: false, editImgId: null, editTagsText: '', isSavingTags: false,
                
                isSearchActive: false,

                async init() { 
                    this.executeSearch(); 
                    this.tempBgUrl = this.bgUrl;
                    this.tempName = this.galleryName;
                    document.title = this.galleryName;
                    this.$watch('galleryName', value => { document.title = value; });
                    this.fetchHistoryTags(); 

                    const observer = new IntersectionObserver((entries) => {
                        if(entries[0].isIntersecting && this.hasMore && !this.isLoadingMore && this.images.length > 0) {
                            this.loadMore();
                        }
                    }, { rootMargin: '200px' });
                    observer.observe(this.$refs.loadMoreTarget);
                },

                openLightbox(index) {
                    this.activeImgIndex = index;
                    this.isZoomed = false;
                    this.isLightboxOpen = true;
                },
                closeLightbox() {
                    this.isLightboxOpen = false;
                    setTimeout(() => { this.activeImgIndex = null; this.isZoomed = false; }, 300);
                },
                prevImg() {
                    if (!this.isLightboxOpen || this.images.length <= 1) return;
                    this.isZoomed = false;
                    this.activeImgIndex = (this.activeImgIndex - 1 + this.images.length) % this.images.length;
                },
                nextImg() {
                    if (!this.isLightboxOpen || this.images.length <= 1) return;
                    this.isZoomed = false;
                    this.activeImgIndex = (this.activeImgIndex + 1) % this.images.length;
                },

                handleSwipe(touchEndX, touchEndY) {
                    // 🌟 修复：只要图片是放大状态（电脑端）或者原生系统放大了，统统禁止触发滑动切换！
                    if (this.isZoomed || (window.visualViewport && window.visualViewport.scale > 1.05)) return;

                    const diffX = this.touchStartX - touchEndX;
                    const diffY = this.touchStartY - touchEndY;
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        if (diffX > 40) this.nextImg();
                        else if (diffX < -40) this.prevImg();
                    } else {
                        if (diffY < -60) this.closeLightbox();
                    }
                },

                openEditTags(img) {
                    this.editImgId = img.id;
                    this.editTagsText = img.tags.join(' ');
                    this.isEditTagsOpen = true;
                },
                async saveEditedTags() {
                    if (!this.editImgId) return;
                    this.isSavingTags = true;
                    try {
                        const res = await fetch(\`/api/file/\${this.editImgId}/tags\`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tags: this.editTagsText })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const targetImg = this.images.find(img => img.id === this.editImgId);
                            if (targetImg) targetImg.tags = data.tags;
                            this.fetchHistoryTags();
                            this.isEditTagsOpen = false;
                        } else alert('修改失败');
                    } catch(e) { alert('网络错误'); }
                    this.isSavingTags = false;
                },

                async executeSearch() {
                    this.page = 1;
                    this.hasMore = true;
                    const res = await fetch(\`/api/search?q=\${this.searchQuery}&date=\${this.searchDate}&page=\${this.page}\`);
                    if(res.ok) {
                        const data = await res.json();
                        this.images = data;
                        if(data.length < 50) this.hasMore = false;
                    }
                },
                async loadMore() {
                    this.isLoadingMore = true;
                    this.page++;
                    const res = await fetch(\`/api/search?q=\${this.searchQuery}&date=\${this.searchDate}&page=\${this.page}\`);
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
                    this.fetchHistoryTags();
                },
                
                async deleteImage(id, index) { 
                    if(confirm('确定永久删除该文件吗?')) { 
                        await fetch('/api/file/'+id, {method:'DELETE'}); 
                        this.images.splice(index, 1);
                        this.fetchHistoryTags();
                    } 
                },

                saveName() { if(this.tempName.trim()) { this.galleryName = this.tempName; localStorage.setItem('my_gallery_name', this.galleryName); this.showSettings = false;} },
                saveBgUrl() { if(this.tempBgUrl.trim()) { this.bgUrl = this.tempBgUrl; localStorage.setItem('my_gallery_bg', this.bgUrl); this.showSettings = false; } },
                async uploadBg() {
                    const fileInput = this.$refs.bgFileInput;
                    if(!fileInput.files.length) return alert('请先选择背景图片');
                    this.isUploadingBg = true;
                    const fd = new FormData();
                    fd.append('file', fileInput.files[0]);
                    try {
                        const res = await fetch('/api/settings/bg', {method: 'POST', body: fd});
                        if (res.ok) {
                            const data = await res.json();
                            this.bgUrl = data.url + '?t=' + Date.now();
                            localStorage.setItem('my_gallery_bg', this.bgUrl);
                            this.showSettings = false;
                            fileInput.value = '';
                        } else alert('背景上传失败');
                    } catch(e) { alert('网络错误'); }
                    this.isUploadingBg = false;
                },
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
                        if (thumbBlob) {
                            fd.append('thumb', thumbBlob, 'thumb.webp');
                        }

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
