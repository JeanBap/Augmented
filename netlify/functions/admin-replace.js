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

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
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

async function fetchBlob(sha) {
  const res = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs/${sha}`);
  if (res.status !== 200) return null;
  return Buffer.from(res.data.content, 'base64').toString('utf-8');
}

async function batchProcess(items, fn, concurrency) {
  concurrency = concurrency || 15;
  const results = [];
  for (var i = 0; i < items.length; i += concurrency) {
    var batch = items.slice(i, i + concurrency);
    var batchResults = await Promise.all(batch.map(fn));
    results.push.apply(results, batchResults);
  }
  return results;
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

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { action, search, replace } = body;
  if (!search || typeof search !== 'string' || search.length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Search string must be at least 2 characters' }) };
  }
  if (search.length > 500) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Search string too long' }) };
  }

  // Get repo tree
  const treeRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`);
  if (treeRes.status !== 200) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch repo tree' }) };
  }

  const editableFiles = treeRes.data.tree.filter(function(f) {
    return f.type === 'blob' &&
      !f.path.startsWith('admin/') &&
      (f.path.endsWith('.html') || f.path.endsWith('.js') || f.path.endsWith('.css'));
  });

  // SEARCH: return matching files and occurrence counts
  if (action === 'search') {
    var matches = [];
    await batchProcess(editableFiles, async function(file) {
      var content = await fetchBlob(file.sha);
      if (content && content.includes(search)) {
        var count = content.split(search).length - 1;
        matches.push({ path: file.path, count: count });
      }
    });
    matches.sort(function(a, b) { return a.path.localeCompare(b.path); });
    return { statusCode: 200, headers, body: JSON.stringify({ matches: matches, total: matches.reduce(function(s, m) { return s + m.count; }, 0) }) };
  }

  // REPLACE: apply find/replace across all files in a single commit
  if (action === 'replace') {
    if (typeof replace !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing replace string' }) };
    }
    if (search === replace) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Search and replace strings are identical' }) };
    }

    // Find matching files and apply replacement
    var changes = [];
    await batchProcess(editableFiles, async function(file) {
      var content = await fetchBlob(file.sha);
      if (content && content.includes(search)) {
        var newContent = content.split(search).join(replace);
        changes.push({ path: file.path, content: newContent });
      }
    });

    if (changes.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, changed: [], commitSha: null }) };
    }

    // Create new blobs for changed files
    var newTreeEntries = await batchProcess(changes, async function(change) {
      var blobRes = await githubRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, {
        content: Buffer.from(change.content).toString('base64'),
        encoding: 'base64'
      });
      if (blobRes.status !== 201) return null;
      return { path: change.path, sha: blobRes.data.sha, mode: '100644', type: 'blob' };
    });

    newTreeEntries = newTreeEntries.filter(function(e) { return e !== null; });
    if (newTreeEntries.length === 0) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create file blobs' }) };
    }

    // Get current branch HEAD
    var refRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${BRANCH}`);
    if (refRes.status !== 200) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to get branch ref' }) };
    }
    var currentCommitSha = refRes.data.object.sha;

    // Get current tree SHA
    var commitRes = await githubRequest('GET', `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${currentCommitSha}`);
    var currentTreeSha = commitRes.data.tree.sha;

    // Create new tree with changed blobs
    var newTreeRes = await githubRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, {
      base_tree: currentTreeSha,
      tree: newTreeEntries
    });
    if (newTreeRes.status !== 201) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create tree' }) };
    }

    // Truncate long strings for commit message
    var searchPreview = search.length > 40 ? search.substring(0, 40) + '...' : search;
    var replacePreview = replace.length > 40 ? replace.substring(0, 40) + '...' : replace;

    // Create commit
    var newCommitRes = await githubRequest('POST', `/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, {
      message: 'Find & Replace: "' + searchPreview + '" -> "' + replacePreview + '" (' + changes.length + ' files)',
      tree: newTreeRes.data.sha,
      parents: [currentCommitSha]
    });
    if (newCommitRes.status !== 201) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create commit' }) };
    }

    // Update branch ref
    var updateRes = await githubRequest('PATCH', `/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`, {
      sha: newCommitRes.data.sha
    });
    if (updateRes.status !== 200) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update branch' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        changed: changes.map(function(c) { return c.path; }),
        commitSha: newCommitRes.data.sha
      })
    };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use "search" or "replace".' }) };
};
