'use client';

import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';

type Invitation = { email: string; role: string; expiresAt: string };

async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`/api/admin/invitations/${path}`, {
    method, cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Invitation setup failed.');
  return data as Record<string, unknown>;
}

export function AdminInvitation({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      setError('This invitation link is missing or invalid. Ask the owner for a new invitation.');
      setChecking(false);
      return;
    }
    void request(encodeURIComponent(token)).then((result) => {
      if (alive) setInvitation(result as unknown as Invitation);
    }).catch((reason) => {
      if (alive) setError(reason instanceof Error ? reason.message : 'This invitation is invalid or expired.');
    }).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [token]);

  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await request(`${encodeURIComponent(token)}/prepare`, 'POST', { password });
      const qr = await QRCode.toDataURL(String(result.otpauthUri), { errorCorrectionLevel: 'M', margin: 2, width: 256 });
      setSetupToken(String(result.setupToken)); setSecret(String(result.totpSecret)); setQrCode(qr);
      setPassword(''); setConfirmPassword('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Invitation setup failed.'); }
    finally { setBusy(false); }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      await request('complete', 'POST', { setupToken, totp: code });
      setSetupToken(''); setSecret(''); setQrCode(''); setCode(''); window.location.assign('/admin');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Invitation setup failed.';
      if (/expired|closed after repeated/i.test(message)) {
        setSetupToken(''); setSecret(''); setQrCode(''); setCode('');
        setError(`${message} Start again from this invitation link.`);
      } else setError(message);
    } finally { setBusy(false); }
  }

  return <main id="main-content" className="section">
    <p className="eyebrow">FORMA · STAFF INVITATION</p>
    <h1 className="section-heading">Set up your staff account</h1>
    <p className="plain-copy">Your account is secured with your own password and authenticator. The invitation link expires after 24 hours.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {checking && <p role="status">Checking invitation…</p>}
    {!checking && invitation && !setupToken && <>
      <p className="notice">Invitation for {invitation.email} · {invitation.role.replaceAll('_', ' ')} · expires {new Date(invitation.expiresAt).toLocaleString()}</p>
      <form className="form-grid" onSubmit={prepare}>
        <label>Create a strong password<input type="password" autoComplete="new-password" required minLength={15} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)}/><small>15 or more characters, including lowercase, uppercase and a number.</small></label>
        <label>Confirm password<input type="password" autoComplete="new-password" required minLength={15} maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}/></label>
        <button className="button" type="submit" disabled={busy}>Continue to authenticator setup</button>
      </form>
    </>}
    {!checking && invitation && setupToken && <section aria-labelledby="staff-authenticator-heading">
      <h2 id="staff-authenticator-heading" className="section-heading">Connect your authenticator</h2>
      <p className="plain-copy">On another device, open an authenticator app, tap +, then choose “Scan a QR code.” Scan this QR from your screen. It is generated locally and is not sent to a QR service. Keep it private.</p>
      {qrCode && <img src={qrCode} alt="Private Forma Furniture staff authenticator QR code" width={256} height={256} style={{ display: 'block', width: 256, height: 256, maxWidth: '100%', padding: 12, background: '#fff', borderRadius: 8, imageRendering: 'pixelated' }} />}
      <p className="plain-copy">If you are using the same phone, choose “Enter a setup key” and type this key. Choose time-based if asked.</p>
      <p className="notice" style={{ overflowWrap: 'anywhere', fontFamily: 'monospace', fontSize: 16 }}>{secret}</p>
      <p className="plain-copy">Your app should show a changing six-digit code. Enter the current code here; it changes every 30 seconds. If it shows eight digits, remove that entry and scan this QR again, or add the setup key as a time-based, six-digit account. Do not enter the long setup key as the code.</p>
      <form className="form-grid" onSubmit={complete}>
        <label>Current six-digit authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value)}/></label>
        <button className="button" type="submit" disabled={busy}>Verify and activate account</button>
      </form>
    </section>}
    {!checking && !invitation && <p className="plain-copy"><a className="text-link" href="/admin">Return to administrator sign in</a></p>}
  </main>;
}
