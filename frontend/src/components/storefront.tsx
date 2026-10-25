'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { type Category, type Product } from '@/catalog';
import { parseCartStorage } from '@/cart';

type CartLine = { productId: string; quantity: number; name: string; pricePaise: number; image: string; category: Category; material: string; isPublished: boolean; contentStatus: 'sample' | 'merchant_approved'; available: number };
type CartContextValue = { lines: CartLine[]; count: number; error: string; add: (productId: string) => Promise<void>; setQuantity: (productId: string, quantity: number) => Promise<void>; clear: () => Promise<void>; open: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const categories: Array<'All pieces' | Category> = ['All pieces', 'Seating', 'Tables', 'Bedroom', 'Storage'];
const navLinks = [{ href: '/', label: 'Home' }, { href: '/collections', label: 'Collection' }, { href: '/spaces', label: 'Spaces' }, { href: '/craft', label: 'Craft' }, { href: '/journal', label: 'Journal' }, { href: '/visit', label: 'Visit' }, { href: '/account', label: 'Account' }];

export function CartProvider({ children, products }: { children: ReactNode; products: Product[] }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const response = await fetch('/api/commerce/cart', { cache: 'no-store' });
    const payload = await response.json() as { cart?: { lines?: CartLine[] }; error?: string };
    if (!response.ok || !payload.cart || !Array.isArray(payload.cart.lines)) throw new Error(payload.error ?? 'Your bag could not be loaded.');
    setLines(payload.cart.lines);
    return payload.cart.lines;
  }, []);
  useEffect(() => {
    void (async () => {
      try {
        const current = await refresh();
        if (current.length === 0) {
          const legacy = parseCartStorage(localStorage.getItem('forma-demo-cart-v2'), localStorage.getItem('forma-demo-bag'), new Set(products.map((product) => product.id)));
          for (const line of legacy) {
            const response = await fetch('/api/commerce/cart/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(line) });
            if (!response.ok) break;
          }
          if (legacy.length) { localStorage.removeItem('forma-demo-cart-v2'); localStorage.removeItem('forma-demo-bag'); await refresh(); }
        }
        setError('');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your bag could not be loaded.'); }
    })();
  }, [products, refresh]);
  const add = useCallback(async (productId: string) => {
    if (!products.some((product) => product.id === productId)) return;
    const response = await fetch('/api/commerce/cart/lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    const payload = await response.json() as { cart?: { lines?: CartLine[] }; error?: string };
    if (!response.ok || !payload.cart) { setError(payload.error ?? 'This piece could not be added.'); return; }
    setLines(payload.cart.lines ?? []); setError(''); setIsOpen(true);
  }, [products, lines]);
  const setQuantity = useCallback(async (productId: string, quantity: number) => {
    const response = await fetch('/api/commerce/cart/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: Math.max(0, Math.min(99, quantity)) }) });
    const payload = await response.json() as { cart?: { lines?: CartLine[] }; error?: string };
    if (!response.ok || !payload.cart) { setError(payload.error ?? 'Your bag could not be updated.'); return; }
    setLines(payload.cart.lines ?? []); setError('');
  }, []);
  const clear = useCallback(async () => {
    const response = await fetch('/api/commerce/cart', { method: 'DELETE' });
    const payload = await response.json() as { cart?: { lines?: CartLine[] }; error?: string };
    if (!response.ok || !payload.cart) { setError(payload.error ?? 'Your bag could not be cleared.'); return; }
    setLines(payload.cart.lines ?? []); setError('');
  }, []);
  const value = useMemo(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), error, add, setQuantity, clear, open: () => setIsOpen(true) }), [lines, error, add, setQuantity, clear]);
  return <CartContext.Provider value={value}>{children}{isOpen && <CartDrawer close={() => setIsOpen(false)} />}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

function formatRupees(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
function asset(path: string) { return `/media/${path.replace(/^\//, '')}`; }

export function SiteHeader() {
  const path = usePathname();
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [path]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <button className="menu-button" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((openState) => !openState)}>{menuOpen ? '×' : '☰'}</button>
      <Link className="wordmark" href="/" aria-label="Forma home">forma.</Link>
      <nav className="header-nav" aria-label="Main navigation">{navLinks.slice(1).map((link) => <Link key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <button className="bag-button" type="button" onClick={open} aria-label={`Open bag, ${count} items`}>BAG&nbsp; ({count})</button>
      {menuOpen && <nav className="mobile-menu" aria-label="Mobile navigation">{navLinks.slice(1).map((link) => <Link key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>{link.label}</Link>)}</nav>}
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="site-footer"><span>FORMA · FURNITURE FOR THE EVERYDAY</span><nav aria-label="Footer">{navLinks.slice(1).map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><span>Sample catalogue · products require merchant approval before sale</span></footer>;
}

function CartDrawer({ close }: { close: () => void }) {
  const { lines, setQuantity, clear, error: cartError } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quote, setQuote] = useState<{ id: string; subtotalPaise: number; deliveryFeePaise: number; totalPaise: number; expiresAt: string } | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [busy, setBusy] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [fulfillmentConsent, setFulfillmentConsent] = useState(false);
  const idempotencyKey = useRef('');
  const [address, setAddress] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postcode: '' });
  const subtotal = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  const requestQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setCheckoutError('');
    try {
      const response = await fetch('/api/commerce/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postcode: address.postcode }) });
      const data = await response.json() as { quote?: typeof quote; error?: string };
      if (!response.ok || !data.quote) throw new Error(data.error ?? 'Delivery quote could not be created.');
      setQuote(data.quote); idempotencyKey.current = crypto.randomUUID();
    } catch (cause) { setCheckoutError(cause instanceof Error ? cause.message : 'Delivery quote could not be created.'); }
    finally { setBusy(false); }
  };
  const placeOrder = async () => {
    if (!quote) return;
    setBusy(true); setCheckoutError('');
    try {
      const response = await fetch('/api/commerce/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current }, body: JSON.stringify({ quoteId: quote.id, address, fulfillmentConsent }) });
      const data = await response.json() as { order?: { orderNumber?: string }; error?: string };
      if (!response.ok || !data.order?.orderNumber) throw new Error(data.error ?? 'Order could not be placed.');
      setOrderNumber(data.order.orderNumber); setQuote(null); await clear();
    } catch (cause) { setCheckoutError(cause instanceof Error ? cause.message : 'Order could not be placed.'); }
    finally { setBusy(false); }
  };
  const setAddressField = (field: keyof typeof address, value: string) => { setQuote(null); idempotencyKey.current = ''; setAddress((current) => ({ ...current, [field]: value })); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (checkoutOpen) setCheckoutOpen(false); else close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, checkoutOpen]);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="dialog-heading"><h2 id="cart-title">Your bag</h2><button className="icon-button" type="button" onClick={close} aria-label="Close bag">×</button></div>
      <p className="notice">Final price, stock and delivery are checked by the store before an order is accepted.</p>
      {cartError && <p className="notice" role="alert">{cartError}</p>}
      {lines.length === 0 ? <p className="cart-empty">Your bag is taking a quiet moment.<br/>Find something lovely to bring home.</p> : <>
        {lines.map((line) => <article className="cart-line" key={line.productId}><img src={asset(line.image)} alt=""/><div><h3>{line.name}</h3><span>{formatRupees(line.pricePaise / 100)} each</span><div className="quantity-controls"><button type="button" aria-label={`Remove one ${line.name}`} onClick={() => void setQuantity(line.productId, line.quantity - 1)}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Add one ${line.name}`} onClick={() => void setQuantity(line.productId, line.quantity + 1)}>+</button></div></div><div><span>{formatRupees(line.pricePaise * line.quantity / 100)}</span><br/><button className="remove-button" type="button" onClick={() => void setQuantity(line.productId, 0)}>Remove</button></div></article>)}
        <div className="cart-total"><span>Current subtotal</span><strong>{formatRupees(subtotal / 100)}</strong></div>
        <button className="button" type="button" onClick={() => { setCheckoutOpen(true); setQuote(null); setCheckoutError(''); }}>Continue to checkout</button>&nbsp; <button className="button secondary" type="button" onClick={() => void clear()}>Clear bag</button>
      </>}
      {checkoutOpen && <div className="dialog-backdrop" role="presentation"><section className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="dialog-heading"><h2 id="checkout-title">Delivery &amp; payment</h2><button className="icon-button" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button></div>
        {orderNumber ? <><p className="notice" role="status">Your cash-on-delivery order {orderNumber} has been recorded. The collection amount remains due on delivery.</p><button className="button" type="button" onClick={() => { setCheckoutOpen(false); setOrderNumber(''); }}>Done</button></> : <>
          <p className="notice">Cash on delivery is offered only where merchant delivery and stock rules are configured. No online payment is being taken.</p>
          <form className="form-grid" onSubmit={quote ? (event) => { event.preventDefault(); void placeOrder(); } : requestQuote}>
            <label>Full name<input required maxLength={160} autoComplete="name" value={address.fullName} onChange={(event) => setAddressField('fullName', event.target.value)}/></label>
            <label>Phone<input required maxLength={32} autoComplete="tel" value={address.phone} onChange={(event) => setAddressField('phone', event.target.value)}/></label>
            <label>Address line 1<input required maxLength={200} autoComplete="address-line1" value={address.addressLine1} onChange={(event) => setAddressField('addressLine1', event.target.value)}/></label>
            <label>Address line 2 <span>(optional)</span><input maxLength={200} autoComplete="address-line2" value={address.addressLine2} onChange={(event) => setAddressField('addressLine2', event.target.value)}/></label>
            <label>City<input required maxLength={100} autoComplete="address-level2" value={address.city} onChange={(event) => setAddressField('city', event.target.value)}/></label>
            <label>State<input required maxLength={100} autoComplete="address-level1" value={address.state} onChange={(event) => setAddressField('state', event.target.value)}/></label>
            <label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={address.postcode} onChange={(event) => setAddressField('postcode', event.target.value)}/></label>
            <label><input type="checkbox" required={Boolean(quote)} checked={fulfillmentConsent} onChange={(event) => setFulfillmentConsent(event.target.checked)}/> I agree that these details may be used to fulfil this delivery.</label>
            {quote && <div className="cart-total"><span>Items {formatRupees(quote.subtotalPaise / 100)} · Delivery {formatRupees(quote.deliveryFeePaise / 100)}</span><strong>Due {formatRupees(quote.totalPaise / 100)}</strong></div>}
            {checkoutError && <p className="notice" role="alert">{checkoutError}{checkoutError.includes('Sign in') && <> <Link href="/account">Sign in to your account</Link>.</>}</p>}
            <button className="button" type="submit" disabled={busy}>{busy ? 'Please wait…' : quote ? 'Place COD order' : 'Check delivery & total'}</button>
          </form>
        </>}
      </section></div>}
    </section>
  </div>;
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add } = useCart();
  return <article className="product-card"><Link className="product-image" href={`/product?id=${encodeURIComponent(product.id)}`}><img src={asset(product.image)} alt={`${product.name}, ${product.category.toLowerCase()} furniture`} loading="lazy"/><span className="product-index">FORMA / {String(index + 1).padStart(3, '0')}</span></Link><p className="product-category">{product.category}</p><h2 className="product-name"><Link href={`/product?id=${encodeURIComponent(product.id)}`}>{product.name}</Link></h2><div className="product-info"><span>{product.material}</span><span className="product-price">{formatRupees(product.price)}</span></div><button className="add-button" type="button" onClick={() => add(product.id)}>Add to bag +</button></article>;
}

export function ProductGrid({ items, catalog = items }: { items: Product[]; catalog?: Product[] }) {
  return <div className="product-grid">{items.map((product, index) => { const catalogIndex = catalog.findIndex((item) => item.id === product.id); return <ProductCard key={product.id} product={product} index={catalogIndex >= 0 ? catalogIndex : index} />; })}</div>;
}

export function CollectionsBrowser({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<(typeof categories)[number]>('All pieces');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const result = products.filter((product) => (category === 'All pieces' || product.category === category) && (!term || `${product.name} ${product.category} ${product.material}`.toLocaleLowerCase().includes(term)));
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [category, query, sort, products]);
  return <>
    <nav className="category-list" aria-label="Filter by category">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<span className="category-count">&nbsp; {item === 'All pieces' ? products.length : products.filter((product) => product.category === item).length}</span></button>)}</nav>
    <div className="collection-tools"><label><span className="filter-label">Search the collection</span><input className="search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, material or category"/></label><label><span className="filter-label">Sort by</span><select className="sort-select" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label></div>
    <p className="result-count" aria-live="polite">Showing {visible.length} {visible.length === 1 ? 'piece' : 'pieces'} · sample catalogue</p>
    {visible.length ? <ProductGrid items={visible} catalog={products}/> : <p className="empty-state">{products.length ? 'Nothing found. Try another search.' : 'The catalogue is temporarily unavailable. Please try again shortly.'}</p>}
  </>;
}

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const url = asset(product.gallery[active]);
  const move = (delta: number) => setActive((index) => (index + delta + product.gallery.length) % product.gallery.length);
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); if (event.key === 'Escape') setZoomOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomOpen, product.gallery.length]);
  return <div><button className="gallery-main" type="button" onClick={() => setZoomOpen(true)} aria-label={`Enlarge image ${active + 1} of ${product.gallery.length}`}><img src={url} alt={`${product.name}, view ${active + 1}`} fetchPriority={active === 0 ? 'high' : 'auto'}/></button><div className="gallery-thumbs" aria-label="Product image views">{product.gallery.map((image, index) => <button key={image} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}><img src={asset(image)} alt="" loading="lazy"/></button>)}</div>{zoomOpen && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setZoomOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-label={`${product.name} image gallery`}><button className="icon-button modal-close" type="button" aria-label="Close image viewer" onClick={() => setZoomOpen(false)}>×</button><figure><img src={url} alt={`${product.name}, view ${active + 1}`}/><figcaption className="zoom-controls"><button className="button secondary" type="button" onClick={() => move(-1)}>Previous view</button><span>{active + 1} / {product.gallery.length}</span><button className="button secondary" type="button" onClick={() => move(1)}>Next view</button></figcaption></figure></section></div>}</div>;
}

export function EnquiryForm() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSent(true); };
  return <><p className="notice">Preview form only. Messages are not sent or stored.</p>{sent ? <p role="status">Demo response only: no message was delivered.</p> : <form className="form-grid" onSubmit={submit}><label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label><label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254}/></label><label>What would you like to know?<textarea name="message" required maxLength={2000}/></label><button className="button" type="submit">Preview enquiry</button></form>}</>;
}

export function HomeEnquiry() {
  return <section className="section" id="enquire"><div className="section-rule"><span>LET’S MAKE SOMETHING MEANINGFUL</span><span>A PREVIEW FORM</span></div><h2 className="section-heading">Have a space<br/>in <em>mind?</em></h2><p className="plain-copy">Tell us a little about it. Messages are not sent from this preview.</p><EnquiryForm/></section>;
}

export function CollectionHero() {
  return <section className="hero collection-hero"><p className="eyebrow">THE FORMA COLLECTION · 2026</p><h1 className="page-title">Good forms<br/>for <em>every day.</em></h1><p className="hero-copy">Thoughtful furniture for the ordinary moments that make a life. Made slowly, with materials that only get better with time.</p><p className="hero-meta">100 PIECES · SAMPLE CATALOGUE</p></section>;
}

export function EditorialCard({ eyebrow, title, copy, image }: { eyebrow: string; title: string; copy: string; image?: string }) {
  return <article className="editorial-card" style={image ? { backgroundImage: `linear-gradient(0deg,rgba(20,19,17,.72),transparent 68%),url("${asset(image)}")`, backgroundSize: 'cover', color: 'white' } : undefined}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{copy}</p></article>;
}
