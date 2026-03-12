var https = require('https');

var ALLOWED_ORIGIN = 'https://www.raisereadybook.com';
var SITE_URL = 'https://www.raisereadybook.com';

var PRODUCTS = {
  'book': {
    name: 'Raise Ready Book',
    description: '16 chapters of battle-tested fundraising knowledge. Financial modeling, unit economics, fundraising strategy, and exit planning.',
    price: 2999,
    file: '/products/8330624caf17f4c6/Raise_Ready_Book.pdf'
  },
  'tpl-complete': {
    name: 'Complete Financial Model Template',
    description: '11-sheet model: Assumptions, Revenue, Headcount, P&L, Cash Flow, Balance Sheet, KPI Dashboard, Cap Table, Fundraise Scenarios, Data Room. 66-month projections.',
    price: 9900,
    file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx'
  },
  'tpl-complete-support': {
    name: 'Complete Financial Model + 1hr Video Support',
    description: '11-sheet complete model with 66-month projections, plus a 1-hour video walkthrough session to customize it for your business.',
    price: 29900,
    file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx'
  }
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

  // Only allow products that have files ready
  var validItems = items.filter(function(item) {
    return PRODUCTS[item.id] && PRODUCTS[item.id].file;
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
    var qty = 1;
    lineItems['line_items[' + i + '][price_data][currency]'] = 'usd';
    lineItems['line_items[' + i + '][price_data][product_data][name]'] = product.name;
    lineItems['line_items[' + i + '][price_data][product_data][description]'] = product.description;
    lineItems['line_items[' + i + '][price_data][unit_amount]'] = product.price;
    lineItems['line_items[' + i + '][quantity]'] = qty;
  });

  var customerEmail = body.email;
  var sessionParams = Object.assign({
    'mode': 'payment',
    'success_url': SITE_URL + '/success/?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': SITE_URL + '/book/#templates',
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
    console.log('Stripe error:', JSON.stringify(result.data));
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to create checkout session' }) };
  } catch (err) {
    console.log('Checkout error:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Checkout service unavailable' }) };
  }
};

// Export PRODUCTS for use by other functions
exports.PRODUCTS = PRODUCTS;
