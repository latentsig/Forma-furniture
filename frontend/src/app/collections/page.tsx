import { CollectionHero, CollectionsBrowser } from '@/components/storefront';
import { getCatalog } from '@/catalog-api';
import type { Product } from '@/catalog';

export const metadata = { title: 'The collection', description: 'Browse the Forma demo furniture catalogue.' };

export default async function CollectionsPage() {
  let products: Product[] = [];
  try { products = await getCatalog(); } catch { /* CollectionsBrowser provides the visible error state. */ }
  return <main id="main-content"><CollectionHero/><section className="section"><div className="section-rule"><span>THE COLLECTION</span><span>{products.length} PIECES · SAMPLE CATALOGUE</span></div><CollectionsBrowser products={products}/></section><section className="section"><h2 className="section-heading">Something made<br/>around <em>you?</em></h2><a className="button secondary" href="/visit#enquiry">Start a custom project</a></section></main>;
}
