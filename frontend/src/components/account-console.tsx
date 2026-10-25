'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Customer = { id: string; email: string; fullName: string; phone: string | null; emailVerified: boolean };
type CustomerOrder = { id: string; orderNumber: string; status: string; paymentMethod: string; paymentStatus: string; totalPaise: number; createdAt: string; lines: Array<{ id: string; nameSnapshot: string; quantity: number; lineTotalPaise: number }> };
type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

async function api(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`/api/customer/${path}`, { method, cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result && typeof result === 'object' && 'error' in result ? String(result.error) : 'Account request failed.');
  return result as Record<string, unknown>;
}

export function AccountConsole({ verifyToken, resetToken, oauthError, welcome }: { verifyToken: string; resetToken: string; oauthError: string; welcome: string }) {
  const [mode, setMode] = useState<Mode>(resetToken ? 'reset' : 'signin');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersError, setOrdersError] = useState('');
  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [resetCode, setResetCode] = useState(resetToken);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(welcome ? `You are signed in with ${welcome === 'facebook' ? 'Facebook' : 'Google'}.` : '');

  useEffect(() => {
    let alive = true;
    void api('session').then((result) => { if (alive) { const account = result.customer as Customer; setCustomer(account); setProfileName(account.fullName); setProfilePhone(account.phone ?? ''); } }).catch(() => undefined).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!customer) { setOrders([]); setOrdersError(''); return () => { alive = false; }; }
    void fetch('/api/commerce/orders', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as { items?: CustomerOrder[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Order history could not be loaded.');
      if (alive) setOrders(Array.isArray(result.items) ? result.items : []);
    }).catch((reason: unknown) => { if (alive) setOrdersError(reason instanceof Error ? reason.message : 'Order history could not be loaded.'); });
    return () => { alive = false; };
  }, [customer]);

  useEffect(() => {
    if (oauthError === 'google-not-configured') setError('Google sign-in is not connected yet. The merchant must add Google OAuth credentials to the server.');
    else if (oauthError === 'facebook-not-configured') setError('Facebook sign-in is not connected yet. The merchant must configure a Meta app ID, secret, Graph API version and exact callback URL on the server.');
    else if (oauthError === 'facebook-email-conflict') setError('An account already uses this email. Sign in to that account first; accounts are not linked automatically.');
    else if (oauthError === 'facebook-sign-in-failed') setError('Facebook sign-in could not be completed. Check that the Meta app is configured for this callback and has the email permission enabled.');
    else if (oauthError) setError('Google sign-in could not be completed. Please try again.');
  }, [oauthError]);

  useEffect(() => {
    if (!verifyToken) return;
    void api('verify-email', 'POST', { token: verifyToken }).then((result) => {
      const account = result.customer as Customer; setCustomer(account); setProfileName(account.fullName); setProfilePhone(account.phone ?? ''); setNotice('Your email is verified. Your account is ready.');
      window.history.replaceState({}, '', '/account');
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Email verification failed.'));
  }, [verifyToken]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setPreviewUrl('');
    try {
      if (mode === 'signin') {
        const result = await api('login', 'POST', { email, password }); setCustomer(result.customer as Customer); setPassword(''); setNotice('You are signed in.');
      } else if (mode === 'signup') {
        const result = await api('register', 'POST', { fullName, email, phone, password });
        setNotice(String(result.message ?? 'Check your email to verify your account.')); setPreviewUrl(typeof result.previewUrl === 'string' ? result.previewUrl : ''); setPassword('');
      } else if (mode === 'forgot') {
        const result = await api('forgot-password', 'POST', { email });
        setNotice(String(result.message ?? 'Check your email for reset instructions.')); setPreviewUrl(typeof result.previewUrl === 'string' ? result.previewUrl : '');
      } else {
        if (password !== repeatPassword) throw new Error('Those passwords do not match.');
        const result = await api('reset-password', 'POST', { token: resetCode, password });
        setMode('signin'); setResetCode(''); setPassword(''); setRepeatPassword(''); setNotice(String(result.message ?? 'Password updated. Sign in with your new password.'));
        window.history.replaceState({}, '', '/account');
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); }
  }

  async function signOut() {
    await api('session', 'DELETE').catch(() => undefined);
    setCustomer(null); setNotice('You are signed out.'); setMode('signin');
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    try { const result = await api('profile', 'PATCH', { fullName: profileName, phone: profilePhone || null }); const account = result.customer as Customer; setCustomer(account); setProfileName(account.fullName); setProfilePhone(account.phone ?? ''); setNotice('Profile saved.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Profile update failed.'); }
  }

  async function resendVerification() {
    setError(''); setNotice(''); setPreviewUrl('');
    try { const result = await api('request-email-verification', 'POST'); setNotice(String(result.message ?? 'Check your email for a verification link.')); setPreviewUrl(typeof result.previewUrl === 'string' ? result.previewUrl : ''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Verification email could not be sent.'); }
  }

  if (checking) return <main id="main-content" className="section"><p role="status">Checking your account…</p></main>;
  if (customer) return <main id="main-content" className="section"><p className="eyebrow">FORMA · YOUR ACCOUNT</p><h1 className="section-heading">Welcome, {customer.fullName.split(' ')[0]}.</h1><p className="plain-copy">Signed in as {customer.email} · email {customer.emailVerified ? 'verified' : 'not verified'}.</p>{!customer.emailVerified && <button className="button secondary" type="button" onClick={() => void resendVerification()} style={{ marginTop: 8 }}>Send verification email</button>}{notice && <p role="status" className="notice">{notice}{previewUrl && <> <a className="text-link" href={previewUrl}>Open local verification link</a></>}</p>}{error && <p role="alert" className="notice">{error}</p>}<h2 className="section-heading">Your orders</h2>{ordersError && <p role="alert" className="notice">{ordersError}</p>}{orders.length === 0 && !ordersError && <p className="plain-copy">No orders yet. Confirmed orders will appear here.</p>}{orders.map((order) => <article className="notice" key={order.id} style={{ display: 'grid', gap: 8 }}><strong>{order.orderNumber} · {order.status.toUpperCase()}</strong><span>{order.lines.map((line) => `${line.nameSnapshot} × ${line.quantity}`).join(' · ')}</span><span>{order.paymentMethod.toUpperCase()} · {order.paymentStatus.replaceAll('_', ' ')} · ₹{(order.totalPaise / 100).toLocaleString('en-IN')}</span><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time></article>)}<h2 className="section-heading">Your details</h2><form className="form-grid" onSubmit={saveProfile}><label>Full name<input required minLength={2} maxLength={160} autoComplete="name" value={profileName} onChange={(event) => setProfileName(event.target.value)}/></label><label>Phone number · optional<input type="tel" autoComplete="tel" maxLength={32} value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)}/></label><button className="button" type="submit">Save details</button></form><button className="button secondary" type="button" onClick={() => void signOut()} style={{ marginTop: 18 }}>Sign out</button></main>;

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Sign in';
  return <main id="main-content" className="section">
    <p className="eyebrow">FORMA · CUSTOMER ACCOUNT</p><h1 className="section-heading">{title}</h1>
    <p className="plain-copy">Keep your account for your details and future orders. Sign-in does not create or charge for an order.</p>
    {notice && <p role="status" className="notice">{notice}{previewUrl && <> <a className="text-link" href={previewUrl}>Open local verification link</a></>}</p>}
    {error && <p role="alert" className="notice">{error}</p>}
    {mode !== 'reset' && <div className="hero-actions" role="group" aria-label="Account options"><button className={`button ${mode === 'signin' ? '' : 'secondary'}`} type="button" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button><button className={`button ${mode === 'signup' ? '' : 'secondary'}`} type="button" aria-pressed={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); }}>Create account</button></div>}
    {mode !== 'reset' && <p style={{ marginTop: 24 }}><a className="button secondary" href="/api/customer/google/start">Continue with Google</a></p>}
    {mode !== 'reset' && <p style={{ marginTop: 10 }}><a className="button secondary" href="/api/customer/facebook/start">Continue with Facebook</a></p>}
    {mode !== 'forgot' && <p className="eyebrow" style={{ margin: '26px 0 10px' }}>OR USE EMAIL AND PASSWORD</p>}
    <form className="form-grid" onSubmit={submit}>
      {mode === 'signup' && <label>Full name<input required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)}/></label>}
      {mode !== 'reset' && <label>Email address<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}/></label>}
      {mode === 'signup' && <label>Phone number · optional<input type="tel" maxLength={32} autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)}/></label>}
      {mode === 'reset' && <label>New password<input required type="password" minLength={12} maxLength={256} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)}/></label>}
      {(mode === 'signin' || mode === 'signup') && <label>Password<input required type="password" minLength={mode === 'signup' ? 12 : 1} maxLength={256} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)}/>{mode === 'signup' && <small>Use 12 or more characters with uppercase, lowercase and a number.</small>}</label>}
      {mode === 'reset' && <label>New password again<input required type="password" minLength={12} maxLength={256} autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)}/></label>}
      <button className="button" type="submit">{mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in'}</button>
    </form>
    {mode === 'signin' && <p className="plain-copy" style={{ marginTop: 20 }}><button className="text-link" style={{ border: 0, background: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }} type="button" onClick={() => { setMode('forgot'); setError(''); }}>Forgot password?</button></p>}
    {mode === 'forgot' && <p className="plain-copy" style={{ marginTop: 20 }}><button className="text-link" style={{ border: 0, background: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }} type="button" onClick={() => setMode('signin')}>Return to sign in</button></p>}
    {mode === 'signup' && <p className="plain-copy" style={{ marginTop: 20 }}>By creating an account, you agree that Forma may use these details to provide account features. Address and order information will be requested only when needed.</p>}
  </main>;
}
