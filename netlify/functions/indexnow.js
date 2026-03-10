var https = require('https');
var crypto = require('crypto');

var INDEXNOW_KEY = '1e8ed6783e7b450aa0f27601b4787261';
var SITE_HOST = 'www.raisereadybook.com';
var ALLOWED_ORIGIN = 'https://www.raisereadybook.com';

function postJSON(hostname, path, body) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify(body);
    var req = https.request({
      hostname: hostname,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }
    }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }); });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async function(event) {
  var origin = event.headers['origin'] || '';
  var allowedOrigin = (origin === ALLOWED_ORIGIN || origin === 'https://raisereadybook.com') ? origin : ALLOWED_ORIGIN;
  var headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  // Auth check
  var authHeader = event.headers['authorization'] || '';
  var password = process.env.ADMIN_PASSWORD;
  if (!password) return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Admin not configured' }) };
  var token = authHeader.replace(/^Bearer\s+/i, '');
  var expected = Buffer.from(password);
  var received = Buffer.from(token);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Accept either a single URL or array of URLs (paths like /blog/my-post.html)
  var urls = body.urls || [];
  if (typeof urls === 'string') urls = [urls];
  if (!Array.isArray(urls) || urls.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Provide urls array' }) };
  }

  // Normalize: if paths, prepend host
  var fullUrls = urls.map(function(u) {
    if (u.startsWith('http')) return u;
    return 'https://' + SITE_HOST + (u.startsWith('/') ? u : '/' + u);
  });

  // Cap at 10000 per IndexNow spec
  if (fullUrls.length > 10000) fullUrls = fullUrls.slice(0, 10000);

  var payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: 'https://' + SITE_HOST + '/' + INDEXNOW_KEY + '.txt',
    urlList: fullUrls
  };

  // Submit to multiple IndexNow endpoints
  var engines = [
    { hostname: 'api.indexnow.org', path: '/IndexNow' },
    { hostname: 'www.bing.com', path: '/IndexNow' },
    { hostname: 'yandex.com', path: '/indexnow' }
  ];

  var results = [];
  for (var i = 0; i < engines.length; i++) {
    try {
      var res = await postJSON(engines[i].hostname, engines[i].path, payload);
      results.push({ engine: engines[i].hostname, status: res.status, ok: res.status >= 200 && res.status < 300 });
    } catch (err) {
      results.push({ engine: engines[i].hostname, status: 0, ok: false, error: err.message });
    }
  }

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ submitted: fullUrls.length, results: results })
  };
};
