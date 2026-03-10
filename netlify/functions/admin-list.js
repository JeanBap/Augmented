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

function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'Augmented-Admin',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
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
    req.end();
  });
}

exports.handler = async (event) => {
  const origin = event.headers['origin'] || '';
  const allowedOrigin = (origin === ALLOWED_ORIGIN || origin === 'https://raisereadybook.com') ? origin : ALLOWED_ORIGIN;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Recursively list .html files
  const res = await githubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`);
  if (res.status !== 200) return { statusCode: res.status, headers, body: JSON.stringify(res.data) };

  const files = res.data.tree
    .filter(f => f.type === 'blob' && f.path.endsWith('.html') && !f.path.startsWith('admin/'))
    .map(f => f.path)
    .sort();

  return { statusCode: 200, headers, body: JSON.stringify({ files }) };
};
