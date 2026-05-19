'use strict';

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const net    = require('net');
const tls    = require('tls');
const path   = require('path');
const { spawn } = require('child_process');

const HTTPS_PORT    = parseInt(process.env.PORT, 10) || 4000;
const INTERNAL_PORT = 4001;
const HOSTNAME      = process.env.HOSTNAME || '0.0.0.0';
const CERTS_DIR     = process.env.CERTS_DIR || '/app/certs';

// Parse backend host/port so WebSocket can be proxied server-side
// (avoids browser having to trust the backend's self-signed cert)
const _backendUrl   = process.env.NEXT_PUBLIC_API_URL ?? 'https://192.168.100.60:8443';
const _bm           = _backendUrl.match(/^(https?):\/\/([^/:]+)(?::(\d+))?/);
const BACKEND_HOST  = _bm?.[2] ?? '192.168.100.60';
const BACKEND_PORT  = parseInt(_bm?.[3] ?? '8443', 10);
const BACKEND_TLS   = (_bm?.[1] ?? 'https') === 'https';

function waitForPort(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      const sock = net.connect(port, '127.0.0.1');
      sock.on('connect', () => { sock.destroy(); resolve(); });
      sock.on('error', () => {
        if (Date.now() >= deadline) return reject(new Error(`Timeout waiting for port ${port}`));
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

const nextProc = spawn('node', [path.join(__dirname, 'server.js')], {
  env: { ...process.env, PORT: String(INTERNAL_PORT), HOSTNAME: '127.0.0.1' },
  stdio: 'inherit',
});

nextProc.on('exit', (code) => {
  console.error(`[https-wrapper] Next.js process exited (code ${code})`);
  process.exit(code ?? 1);
});

process.on('SIGTERM', () => nextProc.kill('SIGTERM'));
process.on('SIGINT',  () => nextProc.kill('SIGINT'));

function proxyRequest(req, res) {
  const opts = {
    hostname: '127.0.0.1',
    port: INTERNAL_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'x-forwarded-proto': 'https',
      'x-forwarded-for': req.socket.remoteAddress || '',
    },
  };

  const proxy = http.request(opts, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('[https-wrapper] Proxy error:', err.message);
    if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway'); }
  });

  req.pipe(proxy, { end: true });
}

/**
 * Transparent WebSocket tunnel: client socket ↔ target socket.
 * For backend targets: opens a TLS connection (rejectUnauthorized: false for self-signed).
 * For internal Next.js: plain TCP to localhost:4001.
 */
function proxyWs(req, clientSocket, head, targetHost, targetPort, targetTls) {
  const targetSocket = targetTls
    ? tls.connect({ host: targetHost, port: targetPort, rejectUnauthorized: false })
    : net.connect(targetPort, targetHost);

  targetSocket.on('connect', () => {
    // Forward the HTTP Upgrade handshake to the target
    const headers = Object.entries({ ...req.headers, host: `${targetHost}:${targetPort}` })
      .map(([k, v]) => `${k}: ${v}`)
      .join('\r\n');
    targetSocket.write(`GET ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if (head?.length) targetSocket.write(head);

    targetSocket.pipe(clientSocket);
    clientSocket.pipe(targetSocket);
  });

  const destroy = (label) => (err) => {
    if (err) console.error(`[https-wrapper] WS ${label}:`, err.message);
    clientSocket.destroy();
    targetSocket.destroy();
  };
  targetSocket.on('error', destroy('backend error'));
  clientSocket.on('error', destroy('client error'));
  targetSocket.on('end', () => clientSocket.destroy());
  clientSocket.on('end', () => targetSocket.destroy());
}

waitForPort(INTERNAL_PORT)
  .then(() => {
    const ssl = {
      key:  fs.readFileSync(path.join(CERTS_DIR, 'key.pem')),
      cert: fs.readFileSync(path.join(CERTS_DIR, 'cert.pem')),
    };

    const server = https.createServer(ssl, proxyRequest);

    // Route WebSocket upgrades:
    // /notifications/** → backend (server-side TLS, browser never touches backend cert)
    // everything else    → internal Next.js
    server.on('upgrade', (req, socket, head) => {
      const url = req.url ?? '/';
      if (url.startsWith('/notifications/')) {
        console.log(`[https-wrapper] WS upgrade → backend: ${url}`);
        proxyWs(req, socket, head, BACKEND_HOST, BACKEND_PORT, BACKEND_TLS);
      } else {
        proxyWs(req, socket, head, '127.0.0.1', INTERNAL_PORT, false);
      }
    });

    server.listen(HTTPS_PORT, HOSTNAME, () =>
      console.log(`[https-wrapper] Ready → https://${HOSTNAME}:${HTTPS_PORT}`)
    );
  })
  .catch((err) => {
    console.error('[https-wrapper] Startup failed:', err.message);
    process.exit(1);
  });
