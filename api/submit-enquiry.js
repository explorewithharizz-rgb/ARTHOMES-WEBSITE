const https = require('https');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data = req.body || {};
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      const qs = new URLSearchParams(data);
      data = Object.fromEntries(qs.entries());
    }
  }

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

  return new Promise((resolve) => {
    const gReq = https.request(options, (gRes) => {
      let gResBody = '';
      gRes.on('data', (chunk) => { gResBody += chunk; });
      gRes.on('end', () => {
        const success = gRes.statusCode === 200 || gRes.statusCode === 302 || gResBody.includes('Your response has been recorded');
        res.status(200).json({ ok: true, recorded: success });
        resolve();
      });
    });

    gReq.on('error', (err) => {
      console.error('Google Form submission error:', err);
      res.status(500).json({ ok: false, error: err.message });
      resolve();
    });

    gReq.write(postData);
    gReq.end();
  });
};
