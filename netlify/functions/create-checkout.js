const https = require('https');
const crypto = require('crypto');

const ALLOWED_ORIGIN = 'https://www.raisereadybook.com';

// Product catalog with Stripe Price IDs (to be filled in when Stripe keys are added)
const PRODUCTS = {
  'book':        { name: 'Raise Ready Book',             price: 1499,  stripePriceId: null },
  'exercises':   { name: 'Raise Ready Exercise Files',   price: 499,   stripePriceId: null },
  'bundle':      { name: 'Raise Ready Bundle',            price: 49900, stripePriceId: null },
  'tpl-preseed': { name: 'Pre-Seed Financial Model',     price: 4900,  stripePriceId: null },
  'tpl-seed':    { name: 'Seed Financial Model',         price: 9900,  stripePriceId: null },
  'tpl-seriesa': { name: 'Series A Financial Model',     price: 14900, stripePriceId: null },
  'tpl-seriesb': { name: 'Series B Financial Model',     price: 19900, stripePriceId: null }
};

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
    if (postData) req.write(postData);
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

  var items = body.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'No items provided' }) };
  }

  // Validate all items exist in our catalog
  var validItems = items.filter(function(item) { return PRODUCTS[item.id]; });
  if (validItems.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'No valid products' }) };
  }

  // Build product IDs string for success page
  var productIds = validItems.map(function(item) { return item.id; }).join(',');

  // If Stripe is not configured, redirect directly to success page (placeholder mode)
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        url: '/success/?products=' + encodeURIComponent(productIds) + '&mode=preview',
        mode: 'preview'
      })
    };
  }

  // Create Stripe Checkout Session
  var lineItems = {};
  validItems.forEach(function(item, i) {
    var product = PRODUCTS[item.id];
    var qty = Math.min(Math.max(parseInt(item.quantity) || 1, 1), 10);
    if (product.stripePriceId) {
      lineItems['line_items[' + i + '][price]'] = product.stripePriceId;
      lineItems['line_items[' + i + '][quantity]'] = qty;
    } else {
      lineItems['line_items[' + i + '][price_data][currency]'] = 'usd';
      lineItems['line_items[' + i + '][price_data][product_data][name]'] = product.name;
      lineItems['line_items[' + i + '][price_data][unit_amount]'] = product.price;
      lineItems['line_items[' + i + '][quantity]'] = qty;
    }
  });

  var sessionParams = Object.assign({
    'mode': 'payment',
    'success_url': 'https://www.raisereadybook.com/success/?session_id={CHECKOUT_SESSION_ID}&products=' + encodeURIComponent(productIds),
    'cancel_url': 'https://www.raisereadybook.com/book/',
    'metadata[products]': productIds
  }, lineItems);

  try {
    var result = await stripeRequest('POST', '/v1/checkout/sessions', sessionParams);
    if (result.status === 200 && result.data.url) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ url: result.data.url }) };
    }
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to create checkout session' }) };
  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Checkout service unavailable' }) };
  }
};
