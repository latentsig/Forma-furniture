import Link from 'next/link';

export default function NotFoundPage() {
  return <main id="main-content" className="hero"><p className="eyebrow">A LITTLE OFF THE PATH</p><h1>We couldn’t<br/>find that <em>piece.</em></h1><p className="hero-copy">That product link does not match our sample catalogue.</p><div className="hero-actions"><Link className="button" href="/collections">Browse the collection</Link><Link className="text-link" href="/">Return home</Link></div></main>;
}
