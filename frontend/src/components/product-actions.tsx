'use client';

import { useCart } from '@/components/storefront';

export function AddToBagButton({ productId }: { productId: string }) {
  const { add } = useCart();
  return <div className="hero-actions"><button className="button" type="button" onClick={() => add(productId)}>Add to demo bag +</button><button className="button secondary" type="button" onClick={() => add(productId)}>Buy now · preview</button></div>;
}
