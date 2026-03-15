var crypto = require('crypto');
var https = require('https');
var config = require('./products');

var PRODUCTS = config.PRODUCTS;
var SITE_URL = config.SITE_URL;

// Build FILES map from PRODUCTS (single source of truth)
var FILES = {};
Object.keys(PRODUCTS).forEach(function(key) {
  var p = PRODUCTS[key];
  if (p.file) {
    var ext = p.file.split('.').pop().toLowerCase();
    var mime = 'application/octet-stream';
    if (ext === 'pdf') mime = 'application/pdf';
    if (ext === 'xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    FILES[key] = {
      name: p.file.split('/').pop(),
      path: p.file,
      mime: p.mime || mime
    };
  }
});

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  var params = event.queryStringParameters || {};
  var productKey = params.p;
  var expiresAt = parseInt(params.e);
  var signature = params.s;

  if (!productKey || !expiresAt || !signature) {
    return { statusCode: 400, body: 'Missing parameters' };
  }

  if (!FILES[productKey]) {
    return { statusCode: 404, body: 'Product not found' };
  }

  // Verify HMAC signature
  var secret = process.env.DOWNLOAD_SECRET || 'default-dev-secret';
  var payload = productKey + ':' + expiresAt;
  var expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return { statusCode: 403, body: 'Invalid download link' };
    }
  } catch (e) {
    return { statusCode: 403, body: 'Invalid download link' };
  }

  // Check expiration
  if (Math.floor(Date.now() / 1000) > expiresAt) {
    return {
      statusCode: 410,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body style="font-family:sans-serif;text-align:center;padding:60px;">'
        + '<h2>Download link expired</h2>'
        + '<p>This download link has expired. Contact <a href="mailto:yanni@raisereadybook.com">yanni@raisereadybook.com</a> for a new link.</p>'
        + '</body></html>'
    };
  }

  var fileUrl = SITE_URL + FILES[productKey].path;
  var fileName = FILES[productKey].name;

  try {
    var fileData = await fetchFile(fileUrl);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': FILES[productKey].mime,
        'Content-Disposition': 'attachment; filename="' + fileName + '"',
        'Cache-Control': 'no-store'
      },
      body: fileData.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Download error for', productKey, ':', err.message);
    return { statusCode: 500, body: 'Download failed. Contact yanni@raisereadybook.com' };
  }
};

function fetchFile(url, depth) {
  depth = depth || 0;
  return new Promise(function(resolve, reject) {
    var req = https.get(url, { timeout: 15000 }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (depth >= 2) return reject(new Error('Too many redirects'));
        // Only follow redirects to our own domain
        var location = res.headers.location;
        if (!config.isOurUrl(location)) {
          return reject(new Error('Redirect to external domain blocked'));
        }
        return fetchFile(location, depth + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      var chunks = [];
      var totalSize = 0;
      res.on('data', function(c) {
        totalSize += c.length;
        if (totalSize > 50 * 1024 * 1024) { // 50MB limit
          req.destroy();
          reject(new Error('File too large'));
          return;
        }
        chunks.push(c);
      });
      res.on('end', function() { resolve(Buffer.concat(chunks)); });
    });
    req.on('error', reject);
    req.on('timeout', function() { req.destroy(new Error('File download timeout')); });
  });
}
