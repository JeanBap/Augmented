const https = require('https');
const crypto = require('crypto');

const REPO_OWNER = 'JeanBap';
const REPO_NAME = 'Augmented';
const BRANCH = 'main';

const ALLOWED_ORIGIN = 'https://www.raisereadybook.com';

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isValidPath(p) {
  if (!p || typeof p !== 'string') return false;
  if (p.includes('..') || p.includes('\0') || p.startsWith('/')) return false;
  if (!p.endsWith('.html') && !p.endsWith('.css') && !p.endsWith('.js')) return false;
  return /^[a-zA-Z0-9/_.-]+$/.test(p);
}

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Augmented-Admin',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  const origin = event.headers['origin'] || '';
  const allowedOrigin = (origin === ALLOWED_ORIGIN || origin === 'https://raisereadybook.com') ? origin : ALLOWED_ORIGIN;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  const password = event.headers['x-admin-password'];
  if (!password || !process.env.ADMIN_PASSWORD || !timingSafeEqual(password, process.env.ADMIN_PASSWORD)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!process.env.GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  const params = event.queryStringParameters || {};

  // GET: read a file from the repo
  if (event.httpMethod === 'GET') {
    const filePath = params.path;
    if (!filePath) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing path param' }) };
    if (!isValidPath(filePath)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid file path' }) };

    const res = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`);
    if (res.status !== 200) return { statusCode: res.status, headers, body: JSON.stringify(res.data) };

    const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
    return { statusCode: 200, headers, body: JSON.stringify({ content, sha: res.data.sha, path: filePath }) };
  }

  // POST: write a file to the repo
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body);
    const { path: filePath, content, sha, message } = body;
    if (!filePath || !content) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing path or content' }) };
    if (!isValidPath(filePath)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid file path' }) };

    const payload = {
      message: message || `Admin edit: ${filePath}`,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH
    };
    if (sha) payload.sha = sha;

    const res = await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, payload);
    if (res.status !== 200 && res.status !== 201) {
      return { statusCode: res.status, headers, body: JSON.stringify(res.data) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, sha: res.data.content.sha }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
