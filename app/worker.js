export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-system-key',
        }
      });
    }

    // 1. Service Worker fallback to prevent registration errors
    if (url.pathname === '/service-worker.js' || url.pathname === '/sw.js') {
      return new Response('// Empty service worker\nself.addEventListener("fetch", () => {});', {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 2. Proxy API requests to backend
    if (url.pathname.startsWith('/api') || url.pathname === '/maintain' || url.pathname === '/version') {
      const targetUrl = new URL(url.pathname + url.search, 'https://apiv2.friendludo.com');
      const newHeaders = new Headers(request.headers);
      newHeaders.set('Origin', 'https://friendludo.com');
      newHeaders.set('Referer', 'https://friendludo.com/');
      newHeaders.set('Host', 'apiv2.friendludo.com');

      const proxyReq = new Request(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow'
      });

      try {
        const response = await fetch(proxyReq);
        const resHeaders = new Headers(response.headers);
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-system-key');

        return new Response(response.body, {
          status: response.status,
          headers: resHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Backend Gateway Error', details: err.message }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 3. Serve Static Assets with Single Page Application fallback
    return env.ASSETS.fetch(request);
  }
};
