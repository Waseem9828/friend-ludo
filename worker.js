export default {
  async fetch(request, env) {
    try {
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

      // 1. Service Worker fallback
      if (url.pathname === '/service-worker.js' || url.pathname === '/sw.js') {
        return new Response('// Empty service worker\nself.addEventListener("fetch", () => {});', {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // 2. Real-time WebSockets & Socket.IO Proxy (Battles & Matchmaking)
      if (url.pathname.startsWith('/socket.io')) {
        const targetUrl = new URL(url.pathname + url.search, 'https://socketv2.friendludo.com');
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Origin', 'https://friendludo.com');
        newHeaders.set('Referer', 'https://friendludo.com/');
        newHeaders.set('Host', 'socketv2.friendludo.com');

        const proxyReq = new Request(targetUrl.toString(), {
          method: request.method,
          headers: newHeaders,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
          redirect: 'follow'
        });

        return fetch(proxyReq);
      }

      // 3. Proxy REST API requests to live backend
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

      // 4. Static Assets with explicit SPA & Remote Asset Fallback
      let assetRes;
      try {
        assetRes = await env.ASSETS.fetch(request);
      } catch (e) {
        assetRes = null;
      }

      // If asset not found
      if (!assetRes || assetRes.status === 404) {
        // Fallback for missing assets from original live origin
        if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/static/')) {
          const remoteUrl = new URL(url.pathname, 'https://friendludo.com');
          try {
            const remoteRes = await fetch(remoteUrl.toString());
            if (remoteRes.status === 200) {
              return remoteRes;
            }
          } catch (re) {}
        }

        // SPA routing: If not a static file with an extension, serve index.html
        if (!url.pathname.includes('.')) {
          const indexUrl = new URL('/index.html', request.url);
          return await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
        }
      }

      return assetRes || new Response('Not Found', { status: 404 });
    } catch (globalErr) {
      try {
        const fallbackUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
      } catch (finalErr) {
        return new Response('Internal Application Error: ' + globalErr.message, { status: 500 });
      }
    }
  }
};
