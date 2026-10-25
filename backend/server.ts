import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const port = Number(process.env.PORT ?? 4100);
const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

function sendJson(response: ServerResponse, status: number, body: Record<string, string>) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(body));
}

function handle(request: IncomingMessage, response: ServerResponse) {
  if (request.headers.origin && request.headers.origin !== allowedOrigin) {
    sendJson(response, 403, { error: 'Origin not allowed' });
    return;
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' });
    response.end();
    return;
  }
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { status: 'ok', service: 'forma-commerce-api', phase: 'foundation-only' });
    return;
  }
  sendJson(response, 404, { error: 'Route not found' });
}

createServer(handle).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Forma TypeScript API foundation listening on 127.0.0.1:${port}\n`);
});
