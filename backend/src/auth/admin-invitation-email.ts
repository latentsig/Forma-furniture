import type { AdminRole } from '../db/schema.ts';

export async function sendAdminInvitation(email: string, role: AdminRole, token: string) {
  const origin = process.env.CUSTOMER_APP_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const link = new URL('/admin/accept-invite', origin);
  link.searchParams.set('token', token);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  const localPreview = process.env.NODE_ENV !== 'production' && process.env.ADMIN_LOCAL_SETUP_ENABLED === 'true';
  if (apiKey && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Forma Furniture staff invitation',
        text: `You have been invited to Forma Furniture as ${role.replaceAll('_', ' ')}. Complete your secure account setup using this one-time link (expires in 24 hours): ${link.toString()}`,
      }),
    });
    if (!response.ok) throw new Error('The email provider rejected the invitation.');
    return { delivered: true as const, previewUrl: undefined as string | undefined };
  }
  if (localPreview) return { delivered: false as const, previewUrl: link.toString() };
  throw new Error('Staff invitation email delivery is not configured.');
}
