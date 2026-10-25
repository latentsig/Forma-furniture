import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, getCatalogProduct } from '@/catalog-api';
import { ProductGallery, ProductGrid } from '@/components/storefront';
import { AddToBagButton } from '@/components/product-actions';
import type { Product } from '@/catalog';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  let product: Product | null = null;
  let products: Product[] = [];
  try { [product, products] = await Promise.all([id ? getCatalogProduct(id) : Promise.resolve(null), getCatalog()]); }
  catch { return <main id="main-content" className="section"><h1>Product data is temporarily unavailable.</h1><p role="status">Please try again shortly.</p><Link href="/collections">Back to the collection</Link></main>; }
  if (!product) notFound();
  return <main id="main-content"><div className="detail-layout"><ProductGallery product={product}/><div className="detail-copy"><p className="eyebrow">FORMA ORIGINALS · SAMPLE CATALOGUE</p><p className="product-category">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price)}</p><p className="detail-summary">{product.description}</p><dl className="facts"><div><dt>Material &amp; finish</dt><dd>{product.material}</dd></div><div><dt>Dimensions</dt><dd>{product.size}</dd></div><div><dt>Sample lead time</dt><dd>{product.lead}</dd></div></dl><AddToBagButton productId={product.id}/><p className="detail-note">Preview only. This sample price, dimensions and availability are not confirmed. No order or payment can be placed.</p><Link className="text-link" href="/visit#enquiry">Ask us about this piece ↗</Link><br/><br/><Link className="text-link" href="/collections">← Back to all pieces</Link></div></div><section className="section"><div className="section-rule"><span>MADE TO LIVE TOGETHER</span><span>DISCOVER MORE</span></div><h2 className="section-heading">Consider these, too.</h2><ProductGrid items={products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)} catalog={products}/></section></main>;
}
