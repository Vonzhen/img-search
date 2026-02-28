// src/types.ts
// 这里存放全局共享的类型定义，让 TypeScript 不再到处报错

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  TEAM_PASSWORD: string;
};
