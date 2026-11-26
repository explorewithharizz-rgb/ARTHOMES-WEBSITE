const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoint to reliably forward enquiries to Google Forms
  if (req.method === 'POST' && req.url.startsWith('/api/submit-enquiry')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try {
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          data = JSON.parse(body);
        } else {
          const qs = new URLSearchParams(body);
          for (const [k, v] of qs.entries()) data[k] = v;
        }
      } catch (e) {
        console.error('Error parsing body:', e);
      }

      console.log('Received enquiry submission for Google Form:', data);

      // Map to Google Form entry fields
      const gFormData = new URLSearchParams();
      gFormData.append('entry.1193570013', data.name || data['entry.1193570013'] || '');
      gFormData.append('entry.1829165572', data.phone || data['entry.1829165572'] || '');
      gFormData.append('entry.443943121', data.locality || data['entry.443943121'] || '');
      gFormData.append('entry.66382825', data.requirement || data['entry.66382825'] || '');
      gFormData.append('entry.553795070', data.notes || data['entry.553795070'] || '');

      const postData = gFormData.toString();
      const options = {
        hostname: 'docs.google.com',
        port: 443,
        path: '/forms/d/e/1FAIpQLSeEYG_u49s1vSR8fBBM4HFOM2_pKONyObBevfuqTXJ0hDgtkA/formResponse',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      const gReq = https.request(options, gRes => {
        console.log(`Google Form response status: ${gRes.statusCode}`);
        let gResBody = '';
        gRes.on('data', chunk => { gResBody += chunk; });
        gRes.on('end', () => {
          const success = gRes.statusCode === 200 || gRes.statusCode === 302 || gResBody.includes('Your response has been recorded');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, recorded: success }));
        });
      });

      gReq.on('error', err => {
        console.error('Google Form submission error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      });

      gReq.write(postData);
      gReq.end();
    });
    return;
  }

  let safePath = path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  // If directory, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!req.url.split('?')[0].endsWith('/')) {
      res.writeHead(301, { Location: req.url.split('?')[0] + '/' });
      res.end();
      return;
    }
    filePath = path.join(filePath, 'index.html');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Try appending .html
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`\n======================================================`);
  console.log(` ART HOME Interiors Redesign running locally at:`);
  console.log(` ${url}`);
  console.log(`======================================================\n`);
});
