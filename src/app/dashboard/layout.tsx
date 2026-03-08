import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    if (session.role === 'ADMIN') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
