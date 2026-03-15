var https = require('https');
var config = require('./products');

var PRODUCTS = config.PRODUCTS;
var SITE_URL = config.SITE_URL;
var ALLOWED_ORIGIN = SITE_URL;

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

  // Validate email if provided
  var customerEmail = body.email ? String(body.email).trim().toLowerCase() : null;
  if (customerEmail && !config.isValidEmail(customerEmail)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  var validItems = items.filter(function(item) {
    return PRODUCTS[item.id] && (PRODUCTS[item.id].file || PRODUCTS[item.id].service || PRODUCTS[item.id].digital);
  });
  if (validItems.length === 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'No purchasable products' }) };
  }

  var productIds = validItems.map(function(item) { return item.id; }).join(',');

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

  var lineItems = {};
  validItems.forEach(function(item, i) {
    var product = PRODUCTS[item.id];
    lineItems['line_items[' + i + '][price_data][currency]'] = 'usd';
    lineItems['line_items[' + i + '][price_data][product_data][name]'] = product.name;
    lineItems['line_items[' + i + '][price_data][product_data][description]'] = product.description;
    lineItems['line_items[' + i + '][price_data][unit_amount]'] = product.price;
    lineItems['line_items[' + i + '][quantity]'] = 1;
  });

  // Validate success/cancel URLs are on our domain (URL-parse to prevent substring attacks)
  var successUrl = body.success_url || (SITE_URL + '/success/?session_id={CHECKOUT_SESSION_ID}');
  var cancelUrl = body.cancel_url || (SITE_URL + '/book/#templates');
  if (!config.isOurUrl(successUrl.replace('{CHECKOUT_SESSION_ID}', 'placeholder'))) {
    successUrl = SITE_URL + '/success/?session_id={CHECKOUT_SESSION_ID}';
  }
  if (!config.isOurUrl(cancelUrl)) {
    cancelUrl = SITE_URL + '/book/#templates';
  }

  var sessionParams = Object.assign({
    'mode': 'payment',
    'success_url': successUrl,
    'cancel_url': cancelUrl,
    'metadata[products]': productIds,
    'payment_intent_data[metadata][products]': productIds
  }, lineItems);
  if (customerEmail) {
    sessionParams['customer_email'] = customerEmail;
  }

  try {
    var result = await stripeRequest('POST', '/v1/checkout/sessions', sessionParams);
    if (result.status === 200 && result.data.url) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ url: result.data.url }) };
    }
    console.error('Stripe error:', JSON.stringify(result.data));
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to create checkout session' }) };
  } catch (err) {
    console.error('Checkout error:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Checkout service unavailable' }) };
  }
};
