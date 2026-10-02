import { Buffer } from 'node:buffer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyToBackend(request: Request, context: RouteContext): Promise<Response> {
  const base = process.env.OTAKUHUB_API_UPSTREAM_URL?.trim().replace(/\/+$/, '');
  const username = process.env.NGROK_BASIC_AUTH_USER;
  const password = process.env.NGROK_BASIC_AUTH_PASSWORD;
  if (!base || !username || !password) {
    return Response.json({ error: 'Backend proxy is not configured.' }, { status: 503 });
  }

  let upstream: URL;
  try {
    upstream = new URL(base);
  } catch {
    return Response.json({ error: 'Backend proxy URL is invalid.' }, { status: 500 });
  }
  const isLocalDev = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(upstream.hostname);
  if (upstream.protocol !== 'https:' && !isLocalDev) {
    return Response.json({ error: 'Backend proxy must use HTTPS.' }, { status: 500 });
  }

  const { path } = await context.params;
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const target = new URL(`${base}/${encodedPath}${new URL(request.url).search}`);
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  if (contentType) headers.set('Content-Type', contentType);
  if (accept) headers.set('Accept', accept);

  // The browser's OtakuHub JWT is sent separately because ngrok uses
  // Authorization for its edge Basic Auth challenge.
  const appAuthorization = request.headers.get('authorization');
  if (appAuthorization?.startsWith('Bearer ')) {
    headers.set('X-Otaku-Authorization', appAuthorization);
  }
  headers.set('Authorization', `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`);

  try {
    const method = request.method.toUpperCase();
    const response = await fetch(target, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'cache-control', 'location', 'www-authenticate']) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(response.status === 204 || response.status === 304 ? null : response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: 'Could not reach the backend through ngrok.' }, { status: 502 });
  }
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
export const OPTIONS = proxyToBackend;
export const HEAD = proxyToBackend;
