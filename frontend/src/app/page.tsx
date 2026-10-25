import Link from 'next/link';
import { getCatalog } from '@/catalog-api';
import { HomeEnquiry, ProductGrid } from '@/components/storefront';
import type { Product } from '@/catalog';

export default async function HomePage() {
  let products: Product[] = [];
  try { products = await getCatalog(); } catch { /* The UI below explains catalog service errors. */ }
  return <main id="main-content">
    <section className="hero"><p className="eyebrow">FORMA · FURNITURE FOR THE EVERYDAY</p><h1>Good forms<br/>for <em>every day.</em></h1><p className="hero-copy">Thoughtful furniture for the ordinary moments that make a life. Made slowly, with materials that only get better with time.</p><div className="hero-actions"><Link className="button" href="/collections">Explore the collection</Link><Link className="text-link" href="/craft">A little about how we make ↗</Link></div><p className="hero-meta">A SAMPLE CATALOGUE · PRODUCT FACTS REQUIRE MERCHANT REVIEW</p></section>
    <section className="section"><div className="section-rule"><span>A FEW GOOD THINGS</span><span>SELECTED FOR YOU · 01 — 04</span></div>{products.length ? <ProductGrid items={products.slice(0, 4)} catalog={products}/> : <p className="empty-state" role="status">The catalogue is temporarily unavailable. Please try again shortly.</p>}<p style={{ marginTop: 34 }}><Link className="button secondary" href="/collections">{products.length ? `See all ${products.length} demo pieces` : 'Browse the collection'}</Link></p></section>
    <section className="section"><div className="section-rule"><span>IN GOOD COMPANY</span><span>ROOMS WITH A LITTLE MORE ROOM</span></div><h2 className="section-heading">Make space for<br/><em>the everyday.</em></h2><Link className="text-link" href="/spaces">Step inside a few spaces ↗</Link></section>
    <HomeEnquiry/>
  </main>;
}
