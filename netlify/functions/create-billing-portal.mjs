import https from 'https';

var ALLOWED_ORIGINS = [
  'https://www.raisereadybook.com',
  'https://raisereadybook.com',
  'https://finance.raisereadybook.com'
];

function stripeRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var postData = '';
    if (body) {
      var parts = [];
      function encode(prefix, obj) {
        if (typeof obj === 'object' && !Array.isArray(obj)) {
          Object.keys(obj).forEach(function(k) { encode(prefix + '[' + k + ']', obj[k]); });
        } else if (Array.isArray(obj)) {
          obj.forEach(function(v, i) { encode(prefix + '[' + i + ']', v); });
        } else {
          parts.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(obj));
        }
      }
      Object.keys(body).forEach(function(k) { encode(k, body[k]); });
      postData = parts.join('&');
    }
    var options = {
      hostname: 'api.stripe.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    var req = https.request(options, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, function() { req.destroy(new Error('Stripe request timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

export const handler = async function(event) {
  var origin = event.headers['origin'] || '';
  var allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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

  var customerId = body.customerId || null;
  var email = body.email ? String(body.email).trim().toLowerCase() : null;

  if (!customerId && !email) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'customerId or email required' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 503, headers: headers, body: JSON.stringify({ error: 'Billing portal not available' }) };
  }

  try {
    // Look up customer by email if no customerId provided
    if (!customerId) {
      var search = await stripeRequest('GET', '/v1/customers?email=' + encodeURIComponent(email) + '&limit=1', null);
      if (search.status !== 200 || !search.data.data || search.data.data.length === 0) {
        return { statusCode: 404, headers: headers, body: JSON.stringify({ error: 'No Stripe customer found for this email' }) };
      }
      customerId = search.data.data[0].id;
    }

    var returnUrl = body.return_url || 'https://finance.raisereadybook.com/dashboard';

    var session = await stripeRequest('POST', '/v1/billing_portal/sessions', {
      customer: customerId,
      return_url: returnUrl
    });

    if (session.status === 200 && session.data.url) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ url: session.data.url }) };
    }

    console.error('Stripe billing portal error:', JSON.stringify(session.data));
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to create billing portal session' }) };
  } catch (err) {
    console.error('Billing portal error:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Billing portal service unavailable' }) };
  }
};
