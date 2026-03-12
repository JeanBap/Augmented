var crypto = require('crypto');
var https = require('https');

var SITE_URL = 'https://www.raisereadybook.com';

var FILES = {
  'tpl-preseed': { name: 'PreSeed_Foundation.xlsx', path: '/products/23bc1ead2a64a5e1/01_PreSeed_Foundation.xlsx' },
  'tpl-seed':    { name: 'Seed_Growth.xlsx',        path: '/products/86a0831810349c4a/02_Seed_Growth.xlsx' },
  'tpl-seriesa': { name: 'SeriesA_Popular.xlsx',     path: '/products/c814b24c455c3847/03_SeriesA_Popular.xlsx' },
  'tpl-seriesb': { name: 'Complete_Everything.xlsx',  path: '/products/1d0531a7a2ccf19f/05_Complete_Everything.xlsx' }
};

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

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
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

  // Fetch the file from the CDN and serve it
  var fileUrl = SITE_URL + FILES[productKey].path;
  var fileName = FILES[productKey].name;

  try {
    var fileData = await fetchFile(fileUrl);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="' + fileName + '"',
        'Cache-Control': 'no-store'
      },
      body: fileData.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.log('Download error:', err.message);
    return { statusCode: 500, body: 'Download failed. Contact yanni@raisereadybook.com' };
  }
};

function fetchFile(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() { resolve(Buffer.concat(chunks)); });
    }).on('error', reject);
  });
}
