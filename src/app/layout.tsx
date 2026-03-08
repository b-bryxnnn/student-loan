import type { Metadata } from 'next';
import { Inter, Prompt } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import { getSession } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const prompt = Prompt({ subsets: ['thai', 'latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-prompt' });

export const metadata: Metadata = {
  title: 'ระบบรับเอกสาร กยศ. เบื้องต้น (ลักษณะ 1) - โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
  description: 'ระบบรับและตรวจสอบเอกสารกู้ยืมเงินกองทุนเพื่อการศึกษา (กยศ.) เบื้องต้น สำหรับนักเรียนโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="th">
      <body className={`${inter.variable} ${prompt.variable} antialiased min-h-screen flex flex-col`}>
        <Navbar userRole={session?.role} />
        <main className="flex-1">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
