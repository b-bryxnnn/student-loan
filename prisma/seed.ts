import 'dotenv/config';
import { PrismaClient, Role, BorrowerType } from '../src/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminIdCard = 'rsl';
    const adminPassword = 'admin12345678';

    // เข้ารหัสรหัสผ่านแอดมิน
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // สร้างแอดมินหรืออัปเดตถ้ามีอยู่แล้ว
    const admin = await prisma.user.upsert({
        where: { idCard: adminIdCard },
        update: {},
        create: {
            prefix: 'คุณ',
            firstName: 'Admin',
            lastName: 'System',
            idCard: adminIdCard,
            studentId: 'ADMIN',
            email: 'admin@rsl.ac.th', // ใส่อีเมลหลอกๆ เพื่อให้ระบบผ่านการตรวจสอบ Required
            password: hashedPassword,
            role: Role.ADMIN,
            borrowerType: BorrowerType.NEW,
            emailVerified: true, // ยืนยันอีเมลแล้วอัตโนมัติ
        },
    });

    console.log('✅ ฐานข้อมูลถูกตั้งค่าเรียบร้อยแล้ว!');
    console.log(`👤 แอดมิน: ${admin.firstName} ${admin.lastName}`);
    console.log(`🔑 Username (รหัส ปชช): ${admin.idCard}`);
    console.log('รหัสผ่าน: admin12345678');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

