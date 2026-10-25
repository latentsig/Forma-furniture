'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';

type Role = 'OWNER' | 'CATALOG_MANAGER' | 'ORDER_MANAGER' | 'SUPPORT' | 'ANALYST';
type SessionUser = { id: string; email: string; role: Role };
type AdminProduct = { id: string; slug: string; name: string; category: 'Seating' | 'Tables' | 'Bedroom' | 'Storage'; pricePaise: number; material: string; description: string; image: string; size: string; lead: string; gallery: string[]; contentStatus: 'sample' | 'merchant_approved'; isPublished: boolean; onHand: number; reserved: number };
type Staff = { id: string; email: string; role: Role; isActive: boolean };
type Invitation = { id: string; email: string; role: Role; expiresAt: string; createdAt: string };
type AuditEntry = { id: string; action: string; targetId: string | null; createdAt: string };
type AdminOrder = { id: string; orderNumber: string; status: 'placed' | 'cancelled'; paymentStatus: 'amount_due' | 'collected' | 'void'; totalPaise: number; createdAt: string; customer: { fullName: string; email: string }; lines: Array<{ id: string; nameSnapshot: string; quantity: number; lineTotalPaise: number }> };
type CsvPreview = { valid: boolean; itemCount: number; rows: Array<{ row: number; id: string; name: string; errors: string[] }> };

async function api(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : 'Admin request failed.');
  return data as Record<string, unknown>;
}

const roles: Role[] = ['OWNER', 'CATALOG_MANAGER', 'ORDER_MANAGER', 'SUPPORT', 'ANALYST'];

export function AdminConsole() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryLink, setRecoveryLink] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [accessRecovery, setAccessRecovery] = useState(false);
  const [recoveryTotp, setRecoveryTotp] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [recoveryQr, setRecoveryQr] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditRetention, setAuditRetention] = useState('');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationUrl, setInvitationUrl] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setNewStaffRole] = useState<Role>('CATALOG_MANAGER');
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Seating' as AdminProduct['category'], price: '', material: '', description: '', image: '', size: '', lead: '', gallery: '' });
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);

  const refresh = useCallback(async (current: SessionUser) => {
    const catalog = await api('products');
    setProducts(Array.isArray(catalog.items) ? catalog.items as AdminProduct[] : []);
    if (['OWNER', 'ORDER_MANAGER', 'SUPPORT'].includes(current.role)) {
      const orderData = await api('orders');
      setOrders(Array.isArray(orderData.items) ? orderData.items as AdminOrder[] : []);
    }
    if (current.role === 'OWNER' || current.role === 'ANALYST') {
      const events = await api('audit');
      setAudit(Array.isArray(events.items) ? events.items as AuditEntry[] : []);
      setAuditRetention(typeof events.retentionNotice === 'string' ? events.retentionNotice : '');
    }
    if (current.role === 'OWNER') {
      const accounts = await api('staff');
      setStaff(Array.isArray(accounts.items) ? accounts.items as Staff[] : []);
      const pending = await api('invitations');
      setInvitations(Array.isArray(pending.items) ? pending.items as Invitation[] : []);
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const resetToken = query.get('reset');
    const accessToken = query.get('recover');
    if (resetToken || accessToken) {
      const token = resetToken ?? accessToken!;
      setRecoveryToken(token);
      setAccessRecovery(Boolean(accessToken));
      setRecovering(true);
      setRecoveryEmail('');
      window.history.replaceState(null, '', window.location.pathname);
      if (accessToken) {
        void api('access-recovery/prepare', 'POST', { token }).then(async (result) => {
          if (typeof result.secret !== 'string' || typeof result.otpauthUri !== 'string') throw new Error('Authenticator enrollment could not be prepared.');
          setRecoverySecret(result.secret);
          setRecoveryQr(await QRCode.toDataURL(result.otpauthUri, { width: 240, margin: 2 }));
        }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Authenticator recovery could not be prepared.'));
      }
    }
    let alive = true;
    void api('bootstrap/status').then((result) => { if (alive) setSetupAvailable(result.setupAvailable === true); }).catch(() => undefined);
    void api('session').then(async (result) => {
      if (!alive || !result.user) return;
      const signedIn = result.user as SessionUser;
      setUser(signedIn);
      await refresh(signedIn);
    }).catch(() => undefined).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [refresh]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      const result = await api('session', 'POST', { email, password, totp });
      const signedIn = result.user as SessionUser;
      setUser(signedIn); setPassword(''); setTotp('');
      await refresh(signedIn);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in.'); }
  }

  async function signOut() {
    await api('session', 'DELETE').catch(() => undefined);
    setUser(null); setProducts([]); setAudit([]); setNotice('You are signed out.');
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setRecoveryLink('');
    try {
      const result = await api(accessRecovery ? 'access-recovery/request' : 'password-reset/request', 'POST', { email: recoveryEmail });
      setNotice(String(result.message ?? 'If an active administrator account exists for that address, recovery instructions have been sent.'));
      if (typeof result.previewUrl === 'string') setRecoveryLink(result.previewUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to request a reset link.'); }
  }

  async function completePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const result = await api('password-reset/complete', 'POST', { token: recoveryToken, password: recoveryPassword });
      setNotice(String(result.message ?? 'Password updated. Your authenticator is still required at sign-in.'));
      setRecoveryToken(''); setRecoveryPassword(''); setRecovering(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to reset the password.'); }
  }

  async function completeAccessRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const result = await api('access-recovery/complete', 'POST', { token: recoveryToken, password: recoveryPassword, totp: recoveryTotp });
      setNotice(String(result.message ?? 'Access recovered. Sign in using your new password and authenticator code.'));
      setRecoveryToken(''); setRecoveryPassword(''); setRecoveryTotp(''); setRecoveryQr(''); setRecoverySecret(''); setRecovering(false); setAccessRecovery(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to recover administrator access.'); }
  }

  async function publishAfterApproval(product: AdminProduct) {
    if (!window.confirm(`Confirm that a merchant has reviewed and approved all facts and image rights for “${product.name}”?`)) return;
    setError(''); setNotice('');
    try {
      await api(`products/${encodeURIComponent(product.id)}/approve`, 'POST', { merchantApprovalConfirmed: true });
      await api(`products/${encodeURIComponent(product.id)}`, 'PATCH', { isPublished: true });
      await refresh(user!); setNotice(`${product.name} is approved and published.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to publish product.'); }
  }

  async function unpublish(product: AdminProduct) {
    setError(''); setNotice('');
    try { await api(`products/${encodeURIComponent(product.id)}`, 'DELETE'); await refresh(user!); setNotice(`${product.name} is unpublished.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to unpublish product.'); }
  }

  async function saveProduct(product: AdminProduct, form: HTMLFormElement) {
    const data = new FormData(form);
    setError(''); setNotice('');
    try {
      await api(`products/${encodeURIComponent(product.id)}`, 'PATCH', {
        slug: data.get('slug'), name: data.get('name'), category: data.get('category'),
        pricePaise: Math.round(Number(data.get('price')) * 100), material: data.get('material'),
        description: data.get('description'), image: data.get('image'), size: data.get('size'),
        lead: data.get('lead'), gallery: String(data.get('gallery')).split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      });
      await refresh(user!); setNotice(`${product.name} saved as an unpublished review draft.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save product.'); }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    const slugBase = newProduct.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const gallery = newProduct.gallery.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    try {
      await api('products', 'POST', { id: slug, slug, category: newProduct.category, name: newProduct.name, pricePaise: Math.round(Number(newProduct.price) * 100), material: newProduct.material, description: newProduct.description, image: newProduct.image, size: newProduct.size, lead: newProduct.lead, gallery, isPublished: false });
      setNewProduct({ name: '', category: 'Seating', price: '', material: '', description: '', image: '', size: '', lead: '', gallery: '' });
      await refresh(user!); setNotice('Sample catalog item created as an unpublished draft.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create product.'); }
  }

  async function previewCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setCsvPreview(null);
    try { setCsvPreview(await api('products/import/preview', 'POST', { csv: csvText }) as unknown as CsvPreview); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'CSV validation failed.'); }
  }

  async function commitCsv() {
    if (!csvPreview?.valid || !window.confirm(`Import ${csvPreview.itemCount} products as unpublished sample drafts?`)) return;
    setError(''); setNotice('');
    try {
      const result = await api('products/import/commit', 'POST', { csv: csvText, confirmImport: true });
      await refresh(user!); setCsvText(''); setCsvPreview(null); setNotice(`${String(result.imported)} sample product drafts imported.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'CSV import failed.'); }
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    setInvitationUrl('');
    if (staffRole === 'OWNER' && !window.confirm('Invite this account with full OWNER permissions?')) return;
    try {
      const invitedEmail = staffEmail;
      const result = await api('invitations', 'POST', { email: invitedEmail, role: staffRole, ownerCreationConfirmed: staffRole === 'OWNER' });
      setStaffEmail(''); await refresh(user!);
      if (typeof result.previewUrl === 'string') {
        setInvitationUrl(result.previewUrl);
        setNotice(`Local invitation created for ${invitedEmail}. Share the one-time enrollment link securely; it expires in 24 hours.`);
      } else setNotice(`Invitation email sent to ${invitedEmail}. They must set their own password and authenticator within 24 hours.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send staff invitation.'); }
  }

  async function cancelInvitation(invitation: Invitation) {
    setError(''); setNotice('');
    try { await api(`invitations/${invitation.id}`, 'DELETE'); await refresh(user!); setNotice(`Invitation for ${invitation.email} cancelled.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to cancel invitation.'); }
  }

  async function setStaffActive(account: Staff, isActive: boolean) {
    setError(''); setNotice('');
    try { await api(`staff/${account.id}`, 'PATCH', { isActive }); await refresh(user!); setNotice(`${account.email} ${isActive ? 'activated' : 'disabled'}.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update staff account.'); }
  }

  async function changeStaffRole(account: Staff, role: Role) {
    if (role === 'OWNER' && !window.confirm(`Grant ${account.email} full OWNER permissions?`)) return;
    setError(''); setNotice('');
    try { await api(`staff/${account.id}`, 'PATCH', { role, ownerPromotionConfirmed: role === 'OWNER' }); await refresh(user!); setNotice(`${account.email} role updated to ${role}.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update staff role.'); }
  }

  async function cancelOrder(order: AdminOrder) {
    if (!window.confirm(`Cancel unpaid COD order ${order.orderNumber}? This releases its stock reservation.`)) return;
    setError(''); setNotice('');
    try { await api(`orders/${encodeURIComponent(order.id)}`, 'PATCH', { action: 'cancel' }); await refresh(user!); setNotice(`${order.orderNumber} was cancelled and stock released.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to cancel the COD order.'); }
  }

  async function updateInventory(product: AdminProduct, form: HTMLFormElement) {
    const value = Number(new FormData(form).get('onHand'));
    setError(''); setNotice('');
    try { await api(`inventory/${encodeURIComponent(product.id)}`, 'PATCH', { onHand: value }); await refresh(user!); setNotice(`Stock for ${product.name} updated. Existing reservations remain protected.`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update inventory.'); }
  }

  if (checking) return <main id="main-content" className="section"><p role="status">Checking administrator session…</p></main>;
  if (!user) return <main id="main-content" className="section">
    <p className="eyebrow">FORMA · STAFF ONLY</p><h1 className="section-heading">Administrator sign in</h1>
    <p className="plain-copy">Staff accounts are provisioned by an owner. Sign in with your email, password and current authenticator code.</p>
    {notice && <p role="status" className="notice">{notice}</p>}{error && <p role="alert" className="notice">{error}</p>}
    {recoveryToken && accessRecovery ? <form className="form-grid" onSubmit={completeAccessRecovery}>
      <h2 className="section-heading">Recover administrator access</h2>
      <p className="plain-copy">This one-use email link expires after 30 minutes. Scan this private QR code in your authenticator. Access returns only after you verify a current six-digit code.</p>
      {recoveryQr && <img src={recoveryQr} alt="Private Forma Furniture replacement authenticator QR code" width="240" height="240"/>}
      {recoverySecret && <p className="notice">Manual setup key: <strong>{recoverySecret}</strong></p>}
      <label>New password<input type="password" autoComplete="new-password" minLength={15} maxLength={256} required value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)}/></label>
      <p className="plain-copy">Use at least 15 characters, including lowercase, uppercase and a number.</p>
      <label>Current six-digit authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={recoveryTotp} onChange={(event) => setRecoveryTotp(event.target.value)}/></label>
      <button className="button" type="submit">Verify and recover access</button>
    </form> : recoveryToken ? <form className="form-grid" onSubmit={completePasswordReset}>
      <h2 className="section-heading">Set a new administrator password</h2>
      <p className="plain-copy">This one-use link expires after 30 minutes. Your authenticator remains required.</p>
      <label>New password<input type="password" autoComplete="new-password" minLength={15} maxLength={256} required value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)}/></label>
      <p className="plain-copy">Use at least 15 characters, including lowercase, uppercase and a number.</p>
      <button className="button" type="submit">Update password</button>
    </form> : recovering ? <>
      <form className="form-grid" onSubmit={requestPasswordReset}>
        <h2 className="section-heading">Reset your password</h2>
        <p className="plain-copy">We will send a one-use {accessRecovery ? 'access recovery link to replace a lost authenticator' : 'password reset link'}.{accessRecovery ? ' You must enroll and verify a new authenticator before access is restored.' : ' Your authenticator remains required.'}</p>
        <label>Administrator email<input type="email" autoComplete="username" required maxLength={254} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)}/></label>
        <button className="button" type="submit">Send reset link</button>
        <button className="button secondary" type="button" onClick={() => { setRecovering(false); setAccessRecovery(false); setNotice(''); setError(''); }}>Back to sign in</button>
      </form>
      {recoveryLink && <p className="notice">Local development reset link: <a className="text-link" href={recoveryLink}>Open password reset</a></p>}
    </> : <>
      <form className="form-grid" onSubmit={signIn}>
        <label>Email address<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)}/></label>
        <label>Password<input type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)}/></label>
        <label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={totp} onChange={(event) => setTotp(event.target.value)}/></label>
        <button className="button" type="submit">Sign in securely</button>
        <button className="button secondary" type="button" onClick={() => { setRecovering(true); setRecoveryEmail(email); setNotice(''); setError(''); }}>Forgot password?</button>
        <button className="button secondary" type="button" onClick={() => { setAccessRecovery(true); setRecovering(true); setRecoveryEmail(email); setNotice(''); setError(''); }}>Lost your authenticator?</button>
      </form>
      {setupAvailable && <p className="plain-copy" style={{ marginTop: 24 }}>First visit? <a className="text-link" href="/admin/setup">Set up the initial owner account</a>. This one-time setup is only available on the local development server while the admin database is empty.</p>}
    </>}
  </main>;

  const canEdit = user.role === 'OWNER' || user.role === 'CATALOG_MANAGER';
  return <main id="main-content" className="section">
    <div className="section-rule"><span>FORMA · ADMIN</span><span>{user.email} · {user.role.replaceAll('_', ' ')}</span></div>
    <h1 className="section-heading">Catalog operations</h1>
    <div className="hero-actions"><p className="notice">Staff-only tools. Sample product facts are not merchant approved. Publishing requires owner confirmation of verified facts and image rights.</p><button className="button secondary" type="button" onClick={signOut}>Sign out</button></div>
    {error && <p role="alert" className="notice">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}
    {['OWNER', 'ORDER_MANAGER', 'SUPPORT'].includes(user.role) && <><h2 className="section-heading">Orders · {orders.length}</h2>{orders.length === 0 && <p className="plain-copy">No customer orders have been placed.</p>}{orders.map((order) => <article className="notice" key={order.id} style={{ display: 'grid', gap: 8 }}><strong>{order.orderNumber} · {order.status.toUpperCase()}</strong><span>{order.customer.fullName} · {order.customer.email}</span><span>{order.lines.map((line) => `${line.nameSnapshot} × ${line.quantity}`).join(' · ')}</span><span>Cash on delivery · {order.paymentStatus.replaceAll('_', ' ')} · ₹{(order.totalPaise / 100).toLocaleString('en-IN')}</span><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString()}</time>{order.status === 'placed' && order.paymentStatus === 'amount_due' && ['OWNER', 'ORDER_MANAGER'].includes(user.role) && <button className="button secondary" type="button" onClick={() => void cancelOrder(order)}>Cancel order &amp; release stock</button>}</article>)}</>}
    <h2 className="section-heading">Products · {products.length}</h2>
    <div className="form-grid">{products.map((product) => <article key={product.id} className="notice" style={{ display: 'grid', gap: 12 }}>
      <div><strong>{product.name}</strong><br/><small>{product.id} · {product.category} · {product.contentStatus} · {product.isPublished ? 'published' : 'draft'} · {Math.max(0, product.onHand - product.reserved)} available / {product.reserved} reserved</small></div>
      {canEdit && <form className="hero-actions" onSubmit={(event) => { event.preventDefault(); void updateInventory(product, event.currentTarget); }}><label>On-hand stock<input name="onHand" type="number" min={product.reserved} max="1000000" step="1" defaultValue={product.onHand} required/></label><button className="button secondary" type="submit">Save stock</button></form>}
      {canEdit && <details><summary>Edit product facts</summary><form onSubmit={(event) => { event.preventDefault(); void saveProduct(product, event.currentTarget); }} style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        <label>Slug<input name="slug" defaultValue={product.slug} maxLength={160} required/></label>
        <label>Name<input name="name" defaultValue={product.name} maxLength={180} required/></label>
        <label>Category<select name="category" defaultValue={product.category}>{['Seating', 'Tables', 'Bedroom', 'Storage'].map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Price in rupees<input name="price" type="number" min="0.01" step="0.01" defaultValue={(product.pricePaise / 100).toFixed(2)} required/></label>
        <label>Material<input name="material" defaultValue={product.material} maxLength={240} required/></label>
        <label>Description<textarea name="description" defaultValue={product.description} maxLength={8000} required/></label>
        <label>Primary image path<input name="image" defaultValue={product.image} maxLength={500} required/></label>
        <label>Dimensions<input name="size" defaultValue={product.size} maxLength={240} required/></label>
        <label>Lead time<input name="lead" defaultValue={product.lead} maxLength={180} required/></label>
        <label>Gallery image paths · one per line<textarea name="gallery" defaultValue={product.gallery.join('\n')} required/></label>
        <button className="button secondary" type="submit">Save as review draft</button>
      </form></details>}
      {user.role === 'OWNER' && <div className="hero-actions">{product.contentStatus === 'sample' && <button className="button" type="button" onClick={() => void publishAfterApproval(product)}>Review facts &amp; approve</button>}{product.isPublished && <button className="button secondary" type="button" onClick={() => void unpublish(product)}>Unpublish</button>}{product.contentStatus === 'merchant_approved' && !product.isPublished && <button className="button" type="button" onClick={() => void publishAfterApproval(product)}>Publish approved item</button>}</div>}
    </article>)}</div>
    {canEdit && <><h2 className="section-heading">Add product draft</h2><p className="notice">New records remain unpublished and marked sample until an owner confirms merchant review.</p><form className="form-grid" onSubmit={createProduct}>
      <label>Name<input required maxLength={180} value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })}/></label>
      <label>Category<select value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value as AdminProduct['category'] })}>{['Seating', 'Tables', 'Bedroom', 'Storage'].map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Price in rupees<input type="number" min="0.01" step="0.01" required value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })}/></label>
      <label>Material<input required maxLength={240} value={newProduct.material} onChange={(event) => setNewProduct({ ...newProduct, material: event.target.value })}/></label>
      <label>Description<textarea required maxLength={8000} value={newProduct.description} onChange={(event) => setNewProduct({ ...newProduct, description: event.target.value })}/></label>
      <label>Primary image path<input required maxLength={500} value={newProduct.image} onChange={(event) => setNewProduct({ ...newProduct, image: event.target.value })}/></label>
      <label>Dimensions<input required maxLength={240} value={newProduct.size} onChange={(event) => setNewProduct({ ...newProduct, size: event.target.value })}/></label>
      <label>Lead time<input required maxLength={180} value={newProduct.lead} onChange={(event) => setNewProduct({ ...newProduct, lead: event.target.value })}/></label>
      <label>Gallery image paths · one per line<textarea required value={newProduct.gallery} onChange={(event) => setNewProduct({ ...newProduct, gallery: event.target.value })}/></label>
      <button className="button" type="submit">Save unpublished draft</button>
    </form><h2 className="section-heading">Bulk CSV import</h2><p className="notice">Required columns: id,slug,name,category,pricePaise,material,description,image,size,lead,gallery. Separate gallery image paths with |. Limit: 50 records per file. Preview performs no writes.</p><form className="form-grid" onSubmit={previewCsv}><label>CSV text<textarea required maxLength={65536} value={csvText} onChange={(event) => { setCsvText(event.target.value); setCsvPreview(null); }}/></label><button className="button secondary" type="submit">Validate import preview</button></form>{csvPreview && <><p role="status" className="notice">{csvPreview.valid ? `${csvPreview.itemCount} rows validated; no changes saved.` : 'Fix the errors below. Nothing has been saved.'}</p>{csvPreview.rows.map((row) => <p className="notice" key={row.row}>Row {row.row} · {row.id} · {row.name}: {row.errors.length ? row.errors.join(' ') : 'Valid'}</p>)}{csvPreview.valid && <button className="button" type="button" onClick={() => void commitCsv()}>Import as unpublished drafts</button>}</>}</>}
    {user.role === 'OWNER' && <><h2 className="section-heading">Invite a staff member</h2><p className="notice">Only the owner can invite staff and choose their role. Each person receives a one-time link to set their own password and authenticator; never share credentials in chat.</p><form className="form-grid" onSubmit={createInvitation}>
      <label>Staff email<input type="email" autoComplete="off" required maxLength={254} value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)}/></label>
      <label>Role<select value={staffRole} onChange={(event) => setNewStaffRole(event.target.value as Role)}>{roles.map((role) => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></label>
      <button className="button" type="submit">Send staff invitation</button>
    </form>{invitationUrl && <p className="notice">Local setup link: <a className="text-link" href={invitationUrl}>{invitationUrl}</a></p>}<h2 className="section-heading">Pending invitations</h2>{invitations.length === 0 && <p className="plain-copy">No pending invitations.</p>}{invitations.map((invitation) => <div className="notice" key={invitation.id}>{invitation.email} · {invitation.role.replaceAll('_', ' ')} · expires {new Date(invitation.expiresAt).toLocaleString()} <button className="button secondary" type="button" onClick={() => void cancelInvitation(invitation)}>Cancel invitation</button></div>)}<h2 className="section-heading">Staff accounts</h2>{staff.map((account) => <div className="notice" key={account.id}>{account.email} · {account.isActive ? 'active' : 'disabled'} {account.id !== user.id && <><label>Role<select value={account.role} onChange={(event) => void changeStaffRole(account, event.target.value as Role)}>{roles.map((role) => <option key={role}>{role.replaceAll('_', ' ')}</option>)}</select></label><button className="button secondary" type="button" onClick={() => void setStaffActive(account, !account.isActive)}>{account.isActive ? 'Disable' : 'Activate'}</button></>}</div>)}</>}
    {(user.role === 'OWNER' || user.role === 'ANALYST') && <><h2 className="section-heading">Administrator audit · latest {audit.length}</h2><p className="notice">{auditRetention}</p>{audit.map((entry) => <p className="notice" key={entry.id}>{new Date(entry.createdAt).toLocaleString()} · {entry.action} · {entry.targetId ?? '—'}</p>)}</>}
  </main>;
}
