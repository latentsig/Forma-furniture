'use client';

import { useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';

async function request(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, { method, cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Owner setup failed.');
  return data as Record<string, unknown>;
}

export function AdminSetup() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void request('bootstrap/status').then((result) => { setAvailable(result.setupAvailable === true); if (typeof result.suggestedEmail === 'string') setEmail(result.suggestedEmail); }).catch(() => setAvailable(false)); }, []);

  async function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await request('bootstrap/begin', 'POST', { email, password });
      const uri = String(result.otpauthUri);
      const qrImage = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 2, width: 256 });
      setSetupToken(String(result.setupToken)); setSecret(String(result.totpSecret)); setQrCode(qrImage); setPassword('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Owner setup failed.'); }
    finally { setBusy(false); }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      await request('bootstrap/complete', 'POST', { setupToken, totp: code });
      setSetupToken(''); setSecret(''); setQrCode(''); setCode(''); window.location.assign('/admin');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Owner setup failed.';
      if (/expired/i.test(message)) {
        setSetupToken(''); setSecret(''); setQrCode(''); setCode('');
        setError('This setup expired. Start again to create a fresh QR code and authenticator key.');
      } else setError(message);
    }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="section"><p className="eyebrow">FORMA · ONE-TIME SETUP</p><h1 className="section-heading">Create the first owner</h1>
    <p className="plain-copy">This is not public staff registration. Setup only works on this local development server while PostgreSQL has no admin users. The first owner can create staff accounts later.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {available === null && <p role="status">Checking setup eligibility…</p>}
    {available === false && <div className="notice"><p>Initial setup is closed. An owner account already exists, or this server is not in local development mode.</p><a href="/admin">Return to admin sign in</a></div>}
    {available && !setupToken && <form className="form-grid" onSubmit={begin}>
      <label>Owner email<input required type="email" maxLength={254} autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)}/></label>
      <label>Create a strong password<input required type="password" minLength={15} maxLength={256} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)}/><small>15 or more characters, including lowercase, uppercase and a number. Enter it here; do not send it in chat.</small></label>
      <button className="button" type="submit" disabled={busy}>Start secure setup</button>
    </form>}
    {available && setupToken && <section aria-labelledby="authenticator-heading">
      <h2 id="authenticator-heading" className="section-heading">Set up your authenticator</h2>
      <p className="plain-copy">On your phone, open Google Authenticator or Microsoft Authenticator, tap the plus button, then choose “Scan a QR code.” Scan this code from your computer screen. It is generated on this device and is not sent to a QR service. Keep it private.</p>
      {qrCode && <img src={qrCode} alt="Private Forma Furniture authenticator setup QR code" width={256} height={256} style={{ display: 'block', width: 256, height: 256, maxWidth: '100%', padding: 12, background: '#fff', borderRadius: 8, imageRendering: 'pixelated' }} />}
      <p className="plain-copy">If you are setting this up on the same phone, choose “Enter a setup key” instead and enter the key below. Select time-based if asked.</p>
      <p className="notice" style={{ overflowWrap: 'anywhere', fontFamily: 'monospace', fontSize: 16 }}>{secret}</p>
      <p className="plain-copy">After scanning, the app should show a changing six-digit code for Forma Furniture. It refreshes every 30 seconds. If you see eight digits, remove that authenticator entry and scan this QR again; do not enter the long setup key as your code.</p>
      <form className="form-grid" onSubmit={complete}>
        <label>Current six-digit authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={(event) => setCode(event.target.value)}/></label>
        <button className="button" type="submit" disabled={busy}>Verify and create owner</button>
      </form>
    </section>}
  </main>;
}
