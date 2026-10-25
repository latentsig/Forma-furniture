import { readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif', '.gif': 'image/gif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp'
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    if (path.length < 2 || path[0] !== 'image assets' || path.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\') || segment.includes('/'))) {
      return new Response('Not found', { status: 404 });
    }
    const root = await realpath(process.env.FORMA_ASSET_ROOT ?? resolve(process.cwd(), 'public', 'image assets'));
    const candidate = resolve(root, ...path.slice(1));
    const rel = relative(root, candidate);
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) return new Response('Not found', { status: 404 });
    const realFile = await realpath(candidate);
    const realRelative = relative(root, realFile);
    if (!realRelative || realRelative.startsWith('..') || isAbsolute(realRelative)) return new Response('Not found', { status: 404 });
    const type = contentTypes[extname(realFile).toLowerCase()];
    if (!type) return new Response('Unsupported media type', { status: 415 });
    const bytes = await readFile(realFile);
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
