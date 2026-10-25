'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { type Category, type Product } from '@/catalog';
import { parseCartStorage } from '@/cart';

type CartLine = { productId: string; quantity: number };
type CartContextValue = { lines: CartLine[]; count: number; add: (productId: string) => void; setQuantity: (productId: string, quantity: number) => void; clear: () => void; open: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const categories: Array<'All pieces' | Category> = ['All pieces', 'Seating', 'Tables', 'Bedroom', 'Storage'];
const navLinks = [{ href: '/', label: 'Home' }, { href: '/collections', label: 'Collection' }, { href: '/spaces', label: 'Spaces' }, { href: '/craft', label: 'Craft' }, { href: '/journal', label: 'Journal' }, { href: '/visit', label: 'Visit' }];

export function CartProvider({ children, products }: { children: ReactNode; products: Product[] }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setLines(parseCartStorage(localStorage.getItem('forma-demo-cart-v2'), localStorage.getItem('forma-demo-bag'), new Set(products.map((product) => product.id))));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('forma-demo-cart-v2', JSON.stringify(lines)); }, [lines, ready]);
  const add = useCallback((productId: string) => {
    if (!products.some((product) => product.id === productId)) return;
    setLines((current) => {
      const found = current.find((line) => line.productId === productId);
      if (!found) return [...current, { productId, quantity: 1 }];
      return current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line);
    });
    setIsOpen(true);
  }, [products]);
  const setQuantity = useCallback((productId: string, quantity: number) => setLines((current) => quantity < 1 ? current.filter((line) => line.productId !== productId) : current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(99, quantity) } : line)), []);
  const value = useMemo(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), add, setQuantity, clear: () => setLines([]), open: () => setIsOpen(true) }), [lines, add, setQuantity]);
  return <CartContext.Provider value={value}>{children}{isOpen && <CartDrawer products={products} close={() => setIsOpen(false)} />}</CartContext.Provider>;
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
      <button className="bag-button" type="button" onClick={open} aria-label={`Open demo bag, ${count} items`}>BAG&nbsp; ({count})</button>
      {menuOpen && <nav className="mobile-menu" aria-label="Mobile navigation">{navLinks.slice(1).map((link) => <Link key={link.href} href={link.href} aria-current={path === link.href ? 'page' : undefined}>{link.label}</Link>)}</nav>}
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="site-footer"><span>FORMA · FURNITURE FOR THE EVERYDAY</span><nav aria-label="Footer">{navLinks.slice(1).map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><span>Catalogue demo · no orders are recorded</span></footer>;
}

function CartDrawer({ products, close }: { products: Product[]; close: () => void }) {
  const { lines, setQuantity, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const entries = lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const total = entries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (checkoutOpen) setCheckoutOpen(false); else close(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, checkoutOpen]);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="dialog-heading"><h2 id="cart-title">Your bag <small>· demo</small></h2><button className="icon-button" type="button" onClick={close} aria-label="Close bag">×</button></div>
      <p className="notice">This is a storefront preview. Prices and availability are sample data; checkout does not place or record an order.</p>
      {entries.length === 0 ? <p className="cart-empty">Your bag is taking a quiet moment.<br/>Find something lovely to bring home.</p> : <>
        {entries.map(({ product, quantity }) => <article className="cart-line" key={product.id}><img src={asset(product.image)} alt=""/><div><h3>{product.name}</h3><span>{formatRupees(product.price)} each</span><div className="quantity-controls"><button type="button" aria-label={`Remove one ${product.name}`} onClick={() => setQuantity(product.id, quantity - 1)}>−</button><span>{quantity}</span><button type="button" aria-label={`Add one ${product.name}`} onClick={() => setQuantity(product.id, quantity + 1)}>+</button></div></div><div><span>{formatRupees(product.price * quantity)}</span><br/><button className="remove-button" type="button" onClick={() => setQuantity(product.id, 0)}>Remove</button></div></article>)}
        <div className="cart-total"><span>Sample subtotal</span><strong>{formatRupees(total)}</strong></div>
        <p className="notice">No payment, delivery quote or stock reservation is performed.</p>
        <button className="button" type="button" onClick={() => setCheckoutOpen(true)}>View demo checkout</button>&nbsp; <button className="button secondary" type="button" onClick={clear}>Clear bag</button>
      </>}
      {checkoutOpen && <div className="dialog-backdrop" role="presentation"><section className="cart-panel" role="alertdialog" aria-modal="true" aria-labelledby="checkout-title"><div className="dialog-heading"><h2 id="checkout-title">Demo only</h2><button className="icon-button" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close demo checkout">×</button></div><p className="plain-copy">This preview cannot accept an order or payment. No purchase has been created.</p><button className="button" type="button" onClick={() => setCheckoutOpen(false)}>Return to bag</button></section></div>}
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
