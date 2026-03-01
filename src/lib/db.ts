import { PrismaClient } from '@/generated/prisma/index.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let dbInstance: PrismaClient | any;

if (!process.env.DATABASE_URL) {
  // ช่วง Next.js build บน Coolify จะไม่มี DATABASE_URL
  // จึงต้อง mock PrismaClient เพื่อไม่ให้ static prerendering พัง (PrismaClientKnownRequestError)
  dbInstance = new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => async () => [] // คืนค่า array ว่างๆ สำหรับท่า query อย่าง .findMany()
    })
  });
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  dbInstance = globalForPrisma.prisma ?? new PrismaClient({ adapter });
}

export const db = dbInstance;

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = db;
}
