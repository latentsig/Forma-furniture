type Action = 'verify' | 'reset';

export async function sendCustomerActionEmail(email: string, action: Action, token: string) {
  const origin = process.env.CUSTOMER_APP_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
  const link = new URL('/account', origin);
  link.searchParams.set(action, token);
  const localPreview = process.env.NODE_ENV !== 'production' && process.env.AUTH_LOCAL_DEV_LINKS === 'true';
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (apiKey && from) {
    const verify = action === 'verify';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: verify ? 'Verify your Forma Furniture account' : 'Reset your Forma Furniture password',
        text: `${verify ? 'Verify your email address' : 'Reset your password'} using this single-use link (expires shortly): ${link.toString()}`,
      }),
    });
    if (!response.ok) throw new Error('The email provider rejected the message.');
    return { delivered: true, previewUrl: undefined as string | undefined };
  }
  if (localPreview) return { delivered: false, previewUrl: link.toString() };
  throw new Error('Customer email delivery is not configured.');
}
