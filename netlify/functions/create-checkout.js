var https = require('https');

var ALLOWED_ORIGIN = 'https://www.raisereadybook.com';
var SITE_URL = 'https://www.raisereadybook.com';

var PRODUCTS = {
  'start-book': {
    name: 'Start Ready Book',
    description: 'The personal finance playbook for your first decade of adult life. Budgeting, debt, credit, taxes, investing, insurance, real estate, and the bridge to founder life. 25 chapters across 6 parts.',
    price: 999,
    file: '/products/a7e2f19d3b064c81/Start_Ready_Book.pdf'
  },
  'book': {
    name: 'Raise Ready Book',
    description: 'The operator-led guide to building a financial model that closes rounds. Fundraising dynamics, driver-based modeling, unit economics, and post-round operations.',
    price: 2999,
    file: '/products/8330624caf17f4c6/Raise_Ready_Book.pdf'
  },
  'exit-book': {
    name: 'Exit Ready Book',
    description: 'The systematic playbook for maximizing your exit. 24-month countdown covering exit value foundations, multiple amplification, operational independence, deal process, and tax structuring.',
    price: 1999,
    file: '/products/f83d3651800e29cf/Exit_Ready_Book.pdf'
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
  },
  'audit-990': {
    name: 'Fundraising Readiness Audit',
    description: '2-3 hour deep-dive reviewing your financial model, pitch deck, data room, and fundraise plan. Scored report with specific fixes.',
    price: 99000,
    service: true
  },
  'advisory-2000': {
    name: 'Fractional Fundraise Advisory (1 month)',
    description: 'Ongoing advisory through an active fundraise. Investor targeting, pitch prep, term sheet review, model iteration, weekly calls.',
    price: 200000,
    service: true
  },
  'model-build-5000': {
    name: 'Model Build',
    description: 'Complete financial model: revenue drivers, COGS, headcount, P&L, cash flow, runway, unit economics, scenario analysis. Includes 8 hours of support.',
    price: 500000,
    service: true
  },
  'investor-pkg-8000': {
    name: 'Investor Materials Package',
    description: 'Pitch deck review + financial model + data room setup + investor list. Everything before your first investor meeting.',
    price: 800000,
    service: true
  },
  'fm-pro-export': {
    name: 'Financial Model Pro Export',
    description: 'Unlock Excel and PDF export for the 5-Year Financial Model Pro. One-time purchase, lifetime access.',
    price: 2900,
    digital: true
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

  // Allow products with files, services, or digital unlocks
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
    var qty = 1;
    lineItems['line_items[' + i + '][price_data][currency]'] = 'usd';
    lineItems['line_items[' + i + '][price_data][product_data][name]'] = product.name;
    lineItems['line_items[' + i + '][price_data][product_data][description]'] = product.description;
    lineItems['line_items[' + i + '][price_data][unit_amount]'] = product.price;
    lineItems['line_items[' + i + '][quantity]'] = qty;
  });

  var customerEmail = body.email;
  // Digital products can specify custom success/cancel URLs
  var successUrl = body.success_url || (SITE_URL + '/success/?session_id={CHECKOUT_SESSION_ID}');
  var cancelUrl = body.cancel_url || (SITE_URL + '/book/#templates');
  // Ensure success/cancel URLs are on our domain
  if (successUrl.indexOf(SITE_URL) !== 0) successUrl = SITE_URL + '/success/?session_id={CHECKOUT_SESSION_ID}';
  if (cancelUrl.indexOf(SITE_URL) !== 0) cancelUrl = SITE_URL + '/book/#templates';
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
    console.log('Stripe error:', JSON.stringify(result.data));
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to create checkout session' }) };
  } catch (err) {
    console.log('Checkout error:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Checkout service unavailable' }) };
  }
};

// Export PRODUCTS for use by other functions
exports.PRODUCTS = PRODUCTS;
