import { PrismaClient } from '@/generated/prisma/index.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let dbInstance: PrismaClient | any;

// ตรวจสอบว่ากำลัง build อยู่หรือเปล่า (ไม่ใช่ runtime)
// ⚠️ ห้ามใช้ CI=true เพราะ Nixpacks/Coolify bake CI=true เข้า Docker image → ยังค้างอยู่ตอน runtime
const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

if (isBuilding) {
  // ช่วง build: สร้าง mock proxy ที่คืนค่าที่ถูกต้อง
  // findUnique/findFirst → null, findMany → [], count → 0, create/update/delete → {}
  console.log('[DB] 🔨 Build mode detected — using mock proxy');
  const singleMethods = new Set(['findUnique', 'findFirst']);
  const countMethods = new Set(['count']);

  const deepMockProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'then' || prop === '$connect' || prop === '$disconnect') return undefined;
      // Model proxy (e.g. db.user)
      return new Proxy({}, {
        get: (_innerTarget, method) => {
          if (method === 'then') return undefined;
          // Return appropriate mock based on method name
          if (singleMethods.has(method as string)) return async () => null;
          if (countMethods.has(method as string)) return async () => 0;
          return async () => [];
        }
      });
    }
  });
  dbInstance = deepMockProxy;
} else if (!process.env.DATABASE_URL) {
  // Runtime แต่ไม่มี DATABASE_URL → แจ้ง error ชัดเจน
  console.error('[DB] ❌ DATABASE_URL is not set! Database operations will fail.');
  const errorProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === 'then' || prop === '$connect' || prop === '$disconnect') return undefined;
      return new Proxy({}, {
        get: () => {
          return async () => { throw new Error('DATABASE_URL is not configured. กรุณาตั้งค่า DATABASE_URL ใน environment variables.'); };
        }
      });
    }
  });
  dbInstance = errorProxy;
} else {
  // Runtime ปกติ — เชื่อมต่อ Database จริง
  console.log('[DB] ✅ Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  dbInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });
}

export const db = dbInstance;

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = db;
}
