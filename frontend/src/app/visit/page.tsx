import { EnquiryForm } from '@/components/storefront';

export const metadata = { title: 'Visit' };

export default function VisitPage() {
  return <main id="main-content"><section className="hero"><p className="eyebrow">COME BY, SAY HELLO</p><h1>Make time<br/>for a <em>visit.</em></h1><p className="hero-copy">Find a piece in person or send a note to the studio.</p></section><section className="section"><div className="section-rule"><span>THE STUDIO</span><span>DETAILS REQUIRE CONFIRMATION</span></div><div className="plain-copy"><p>The showroom address, opening hours and contact details need merchant confirmation before publication. This preview does not offer directions or promise a response.</p><h2>Send a preview enquiry</h2><EnquiryForm/></div></section></main>;
}
