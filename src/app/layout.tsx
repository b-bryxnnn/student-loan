import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ระบบรับเอกสาร กยศ. เบื้องต้น (ลักษณะ 1) - โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
  description: 'ระบบรับและตรวจสอบเอกสารกู้ยืมเงินกองทุนเพื่อการศึกษา (กยศ.) เบื้องต้น สำหรับนักเรียนโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
