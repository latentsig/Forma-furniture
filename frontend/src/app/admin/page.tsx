import type { Metadata } from 'next';
import { AdminConsole } from '@/components/admin-console';

export const metadata: Metadata = { title: 'Staff administration', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminPage() { return <AdminConsole/>; }
