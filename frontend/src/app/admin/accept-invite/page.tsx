import type { Metadata } from 'next';
import { AdminInvitation } from '@/components/admin-invitation';

export const metadata: Metadata = { title: 'Staff account setup', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  return <AdminInvitation token={token}/>;
}
