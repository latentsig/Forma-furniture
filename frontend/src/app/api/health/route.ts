export function GET() {
  return Response.json({ status: 'ok', service: 'forma-web' }, { headers: { 'Cache-Control': 'no-store' } });
}
