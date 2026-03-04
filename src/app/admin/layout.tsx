import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/admin/login');
    }

    if (session.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
