import { EditorialCard } from '@/components/storefront';

export const metadata = { title: 'Spaces' };

export default function SpacesPage() {
  return <main id="main-content"><section className="hero"><p className="eyebrow">A FEW FORMA SPACES</p><h1>Rooms made<br/>for <em>living.</em></h1><p className="hero-copy">Ideas for bringing good forms into the places where life happens.</p></section><section className="section"><div className="section-rule"><span>ROOM NOTES</span><span>01 — 05</span></div><div className="editorial-grid"><EditorialCard eyebrow="01 · THE LIVING ROOM" title="The Slow House" copy="Living · Bengaluru · 2026" image="image%20assets/forma-lounge-original.png"/><EditorialCard eyebrow="02 · THE BEDROOM" title="A Softer Morning" copy="Bedroom · Goa · 2025" image="image%20assets/forma-bedroom-original.png"/><EditorialCard eyebrow="03 · THE DINING ROOM" title="Table for Six" copy="Dining · Mumbai · 2025" image="image%20assets/forma-dining-original.png"/><EditorialCard eyebrow="04 · THE KITCHEN" title="Room to Gather" copy="Kitchen · Pune · 2024" image="image%20assets/forma-kitchen-original.png"/><EditorialCard eyebrow="05 · THE EVERYDAY TABLE" title="A quiet dining nook" copy="Dining · Bengaluru · 2024" image="image%20assets/dining5.webp"/></div></section></main>;
}
