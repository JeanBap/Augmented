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

function isValidUploadPath(p) {
  if (!p || typeof p !== 'string') return false;
  if (p.includes('..') || p.includes('\0') || p.startsWith('/')) return false;
  // Allow common web file types
  const allowed = ['.html','.css','.js','.json','.pdf','.png','.jpg','.jpeg','.gif','.svg','.ico','.webp','.woff','.woff2','.txt','.xml','.csv','.md','.docx','.xlsx','.zip'];
  const ext = p.substring(p.lastIndexOf('.')).toLowerCase();
  if (!allowed.includes(ext)) return false;
  return /^[a-zA-Z0-9/_. -]+$/.test(p);
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const password = event.headers['x-admin-password'];
  if (!password || !process.env.ADMIN_PASSWORD || !timingSafeEqual(password, process.env.ADMIN_PASSWORD)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!process.env.GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { path: filePath, content, filename } = body;
    // content should be base64 encoded

    if (!filePath || !content) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing path or content' }) };
    }

    // Construct full path
    const fullPath = filePath.endsWith('/') ? filePath + filename : filePath;
    if (!isValidUploadPath(fullPath)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid file path or type: ' + fullPath }) };
    }

    // Check if file already exists (to get sha for overwrite)
    let sha = null;
    const checkRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fullPath}?ref=${BRANCH}`);
    if (checkRes.status === 200 && checkRes.data.sha) {
      sha = checkRes.data.sha;
    }

    // Upload file via GitHub Contents API
    const payload = {
      message: `Upload: ${fullPath}`,
      content: content, // already base64
      branch: BRANCH
    };
    if (sha) payload.sha = sha;

    const res = await githubRequest('PUT', `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fullPath}`, payload);

    if (res.status !== 200 && res.status !== 201) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: 'GitHub API error', details: res.data }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        path: fullPath,
        sha: res.data.content ? res.data.content.sha : null,
        url: `https://raisereadybook.com/${fullPath}`
      })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
