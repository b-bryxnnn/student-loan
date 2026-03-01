import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar'; // assuming you have this

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar userRole={session.role} />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
