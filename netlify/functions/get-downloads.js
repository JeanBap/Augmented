var crypto = require('crypto');
var https = require('https');

var SITE_URL = 'https://www.raisereadybook.com';

var PRODUCTS = {
  'book':                 { name: 'Raise Ready Book' },
  'tpl-complete':         { name: 'Complete Financial Model Template' },
  'tpl-complete-support': { name: 'Complete Financial Model + 1hr Video Support' }
};

function stripeGet(path) {
  return new Promise(function(resolve, reject) {
    var req = https.request({
      hostname: 'api.stripe.com', path: path, method: 'GET',
      headers: { 'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY }
    }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch (e) { resolve({ status: res.statusCode, data: null }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function makeDownloadUrl(productKey, expiresAt) {
  var secret = process.env.DOWNLOAD_SECRET || 'default-dev-secret';
  var payload = productKey + ':' + expiresAt;
  var sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return SITE_URL + '/.netlify/functions/download?p=' + productKey + '&e=' + expiresAt + '&s=' + sig;
}

exports.handler = async function(event) {
  var headers = {
    'Access-Control-Allow-Origin': 'https://www.raisereadybook.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  var origin = (event.headers['origin'] || '');
  if (origin === 'https://www.raisereadybook.com' || origin === 'https://raisereadybook.com') {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: headers, body: '{"error":"GET only"}' };

  var sessionId = (event.queryStringParameters || {}).session_id;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return { statusCode: 400, headers: headers, body: '{"error":"Invalid session"}' };
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: headers, body: '{"error":"Not configured"}' };
  }

  try {
    var result = await stripeGet('/v1/checkout/sessions/' + sessionId);
    if (result.status !== 200 || !result.data) {
      return { statusCode: 404, headers: headers, body: '{"error":"Session not found"}' };
    }

    var session = result.data;
    if (session.payment_status !== 'paid') {
      return { statusCode: 402, headers: headers, body: '{"error":"Payment not completed"}' };
    }

    var productString = session.metadata && session.metadata.products;
    if (!productString) {
      return { statusCode: 404, headers: headers, body: '{"error":"No products found"}' };
    }

    var productKeys = productString.split(',').filter(function(k) { return PRODUCTS[k]; });
    var expiresAt = Math.floor(Date.now() / 1000) + (72 * 3600);
    var downloads = productKeys.map(function(key) {
      return { id: key, name: PRODUCTS[key].name, url: makeDownloadUrl(key, expiresAt) };
    });

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ downloads: downloads })
    };
  } catch (err) {
    console.log('get-downloads error:', err.message);
    return { statusCode: 500, headers: headers, body: '{"error":"Server error"}' };
  }
};
