import Link from 'next/link';

export const metadata = { title: 'Craft' };

export default function CraftPage() {
  return <main id="main-content"><section className="hero"><p className="eyebrow">THOUGHT IN THE MAKING</p><h1>Good work<br/>takes <em>time.</em></h1><p className="hero-copy">A note on materials, making and the ideas behind the Forma catalogue. Business and sourcing claims are placeholders until verified by the merchant.</p></section><section className="section"><div className="section-rule"><span>THE WAY WE THINK</span><span>NOTES ON MAKING</span></div><div className="plain-copy"><p>Furniture lives with us through the everyday. The details we choose, how a piece is assembled, and the way materials change with use all shape that relationship.</p><p>This page is a design placeholder, not a verified account of our sourcing, production history or workshop practices. Those details need merchant approval before publication.</p><Link className="text-link" href="/collections">Explore the sample collection ↗</Link></div></section></main>;
}
