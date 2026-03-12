var https = require('https');

// One-time setup function: creates the Stripe webhook endpoint.
// Visit /.netlify/functions/setup-webhook?key=YOUR_ADMIN_PASSWORD to run.
// Delete this file after successful setup.

function stripeRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var postData = '';
    if (body) {
      var parts = [];
      Object.keys(body).forEach(function(k) {
        var val = body[k];
        if (Array.isArray(val)) {
          val.forEach(function(v, i) {
            parts.push(encodeURIComponent(k + '[' + i + ']') + '=' + encodeURIComponent(v));
          });
        } else {
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(val));
        }
      });
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
    if (postData) req.write(postData);
    req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'GET only' };
  }

  var params = event.queryStringParameters || {};
  if (!params.key || params.key !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 403, body: 'Unauthorized. Pass ?key=YOUR_ADMIN_PASSWORD' };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: 'STRIPE_SECRET_KEY not set' };
  }

  try {
    // First, list existing webhooks to avoid duplicates
    var existing = await stripeRequest('GET', '/v1/webhook_endpoints?limit=100', null);
    if (existing.status === 200 && existing.data.data) {
      var found = existing.data.data.find(function(wh) {
        return wh.url === 'https://www.raisereadybook.com/.netlify/functions/stripe-webhook';
      });
      if (found) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Webhook already exists',
            id: found.id,
            secret: found.secret || '(secret only shown on creation)',
            status: found.status
          }, null, 2)
        };
      }
    }

    // Create the webhook endpoint
    var result = await stripeRequest('POST', '/v1/webhook_endpoints', {
      url: 'https://www.raisereadybook.com/.netlify/functions/stripe-webhook',
      'enabled_events': ['checkout.session.completed'],
      description: 'Raise Ready template delivery'
    });

    if (result.status === 200 && result.data.id) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Webhook created successfully!',
          id: result.data.id,
          secret: result.data.secret,
          next_step: 'Add the secret above as STRIPE_WEBHOOK_SECRET in Netlify env vars, then delete this setup function.'
        }, null, 2)
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Stripe returned an error', details: result.data }, null, 2)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
