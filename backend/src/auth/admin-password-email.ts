export async function sendAdminPasswordReset(email: string, token: string) {
  const origin = process.env.CUSTOMER_APP_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const link = new URL('/admin', origin);
  link.searchParams.set('reset', token);
  const localPreview = process.env.NODE_ENV !== 'production' && process.env.ADMIN_LOCAL_SETUP_ENABLED === 'true';
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (apiKey && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Reset your Forma Furniture administrator password',
        text: `Use this one-time link to set a new administrator password. It expires in 30 minutes. Your authenticator remains required: ${link.toString()}`,
      }),
    });
    if (!response.ok) throw new Error('The email provider rejected the reset message.');
    return { delivered: true as const, previewUrl: undefined as string | undefined };
  }
  if (localPreview) return { delivered: false as const, previewUrl: link.toString() };
  throw new Error('Administrator email delivery is not configured.');
}

export async function sendAdminAccessRecovery(email: string, token: string) {
  const origin = process.env.CUSTOMER_APP_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const link = new URL('/admin', origin);
  link.searchParams.set('recover', token);
  const localPreview = process.env.NODE_ENV !== 'production' && process.env.ADMIN_LOCAL_SETUP_ENABLED === 'true';
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (apiKey && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Recover your Forma Furniture administrator access',
        text: `Use this one-time link within 30 minutes to choose a new administrator password and enroll a replacement authenticator. Access is restored only after a valid six-digit code from the new authenticator is entered: ${link.toString()}`,
      }),
    });
    if (!response.ok) throw new Error('The email provider rejected the recovery message.');
    return { delivered: true as const, previewUrl: undefined as string | undefined };
  }
  if (localPreview) return { delivered: false as const, previewUrl: link.toString() };
  throw new Error('Administrator email delivery is not configured.');
}
