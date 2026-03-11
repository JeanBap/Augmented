var https = require('https');

var REPO_OWNER = 'JeanBap';
var REPO_NAME = 'Augmented';
var DATA_PATH = 'data/waitlist.json';
var ALLOWED_ORIGIN = 'https://www.raisereadybook.com';

function ghRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var data = body ? JSON.stringify(body) : '';
    var opts = {
      hostname: 'api.github.com',
      path: '/repos/' + REPO_OWNER + '/' + REPO_NAME + path,
      method: method,
      headers: {
        'Authorization': 'token ' + process.env.GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Augmented-Waitlist',
        'Content-Type': 'application/json'
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    var req = https.request(opts, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async function(event) {
  var origin = event.headers['origin'] || '';
  var allowedOrigin = (origin === ALLOWED_ORIGIN || origin === 'https://raisereadybook.com') ? origin : ALLOWED_ORIGIN;
  var headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var email = (body.email || '').trim().toLowerCase();
  var source = (body.source || 'services').trim();

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  try {
    // Fetch existing waitlist file from GitHub
    var existing = [];
    var fileSha = null;
    var fileRes = await ghRequest('GET', '/contents/' + DATA_PATH + '?ref=main');
    if (fileRes.status === 200 && fileRes.data.content) {
      var decoded = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
      existing = JSON.parse(decoded);
      fileSha = fileRes.data.sha;
    }

    // Check for duplicate
    var isDuplicate = existing.some(function(entry) { return entry.email === email; });
    if (isDuplicate) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, message: 'Already on the list' }) };
    }

    // Add new entry
    existing.push({
      email: email,
      source: source,
      date: new Date().toISOString()
    });

    // Write back to GitHub
    var writeBody = {
      message: 'Waitlist: ' + email,
      content: Buffer.from(JSON.stringify(existing, null, 2)).toString('base64'),
      branch: 'main'
    };
    if (fileSha) writeBody.sha = fileSha;

    var writeRes = await ghRequest('PUT', '/contents/' + DATA_PATH, writeBody);
    if (writeRes.status === 200 || writeRes.status === 201) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, message: 'Added to waitlist' }) };
    } else {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to save' }) };
    }
  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
