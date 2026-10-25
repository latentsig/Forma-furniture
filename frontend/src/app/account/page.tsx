import type { Metadata } from 'next';
import { AccountConsole } from '@/components/account-console';

export const metadata: Metadata = { title: 'Your account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value ?? '';
  return <AccountConsole verifyToken={one(query.verify)} resetToken={one(query.reset)} oauthError={one(query.error)} welcome={one(query.welcome)}/>;
}
