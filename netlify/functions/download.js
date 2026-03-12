var crypto = require('crypto');
var https = require('https');

var SITE_URL = 'https://www.raisereadybook.com';

var FILES = {
  'book':                 { name: 'Raise_Ready_Book.pdf',          path: '/products/8330624caf17f4c6/Raise_Ready_Book.pdf',          mime: 'application/pdf' },
  'tpl-complete':         { name: 'Complete_Financial_Model.xlsx',  path: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  'tpl-complete-support': { name: 'Complete_Financial_Model.xlsx',  path: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
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
        'Content-Type': FILES[productKey].mime || 'application/octet-stream',
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
