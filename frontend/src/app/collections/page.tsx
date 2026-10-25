import { CollectionHero, CollectionsBrowser } from '@/components/storefront';

export const metadata = { title: 'The collection', description: 'Browse the Forma demo furniture catalogue.' };

export default function CollectionsPage() {
  return <main id="main-content"><CollectionHero/><section className="section"><div className="section-rule"><span>THE COLLECTION</span><span>100 PIECES · SAMPLE CATALOGUE</span></div><CollectionsBrowser/></section><section className="section"><h2 className="section-heading">Something made<br/>around <em>you?</em></h2><a className="button secondary" href="/visit#enquiry">Start a custom project</a></section></main>;
}
