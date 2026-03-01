import { PrismaClient } from '@/generated/prisma/index.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let dbInstance: PrismaClient | any;

if (process.env.CI === 'true' || !process.env.DATABASE_URL) {
  // ช่วง Next.js build บน Coolify จะไม่มี DATABASE_URL หรืออยู่ในโหมด CI
  // สร้าง Proxy ที่สมบูรณ์แบบเพื่อดัก Method ทั้งหมดของ Prisma
  const deepMockProxy = new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'then') return undefined; // ป้องกัน Promise chain พัง
      return new Proxy(() => [], {
        get: (innerTarget, innerProp) => {
          if (innerProp === 'then') return undefined;
          return () => [];
        },
        apply: () => [] // คืนค่า array ว่างเสมอเมื่อมีการเรียก function (เช่น .findMany())
      });
    }
  });
  dbInstance = deepMockProxy;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  dbInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });
}

export const db = dbInstance;

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = db;
}
