import type { Metadata } from 'next';
import { AdminSetup } from '@/components/admin-setup';

export const metadata: Metadata = { title: 'Initial owner setup', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminSetupPage() { return <AdminSetup/>; }
