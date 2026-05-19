'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const net   = require('net');
const path  = require('path');
const { spawn } = require('child_process');

const HTTPS_PORT   = parseInt(process.env.PORT, 10) || 4000;
const INTERNAL_PORT = 4001;
const HOSTNAME     = process.env.HOSTNAME || '0.0.0.0';
const CERTS_DIR    = process.env.CERTS_DIR || '/app/certs';

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

// Start the standalone Next.js server on the internal HTTP port
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

waitForPort(INTERNAL_PORT)
  .then(() => {
    const ssl = {
      key:  fs.readFileSync(path.join(CERTS_DIR, 'key.pem')),
      cert: fs.readFileSync(path.join(CERTS_DIR, 'cert.pem')),
    };
    https
      .createServer(ssl, proxyRequest)
      .listen(HTTPS_PORT, HOSTNAME, () =>
        console.log(`[https-wrapper] Ready → https://${HOSTNAME}:${HTTPS_PORT}`)
      );
  })
  .catch((err) => {
    console.error('[https-wrapper] Startup failed:', err.message);
    process.exit(1);
  });
