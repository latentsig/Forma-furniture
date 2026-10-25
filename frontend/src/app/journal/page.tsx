import Link from 'next/link';

export const metadata = { title: 'Journal' };

export default function JournalPage() {
  return <main id="main-content"><section className="hero"><p className="eyebrow">THE FORMA JOURNAL</p><h1>Notes on<br/><em>living well.</em></h1><p className="hero-copy">Stories about rooms, pieces and the ordinary moments in between.</p></section><section className="section"><div className="section-rule"><span>LATEST NOTE · 01</span><span>EDITORIAL PREVIEW</span></div><article className="plain-copy"><p className="eyebrow">A ROOM, OVER TIME</p><h2 className="section-heading">The good things we keep.</h2><p>Some objects become part of the rhythm of a day. This editorial entry is a placeholder until the Forma team approves publication copy and attribution.</p><Link className="text-link" href="/collections">Find a piece for your room ↗</Link></article></section></main>;
}
