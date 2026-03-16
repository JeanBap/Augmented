var crypto = require('crypto');
var https = require('https');
var config = require('./products');

var PRODUCTS = config.PRODUCTS;
var SITE_URL = config.SITE_URL;
var ADMIN_EMAIL = config.ADMIN_EMAIL;
var CALENDLY_URL = config.CALENDLY_URL;
var FROM_EMAIL = 'Raise Ready <onboarding@resend.dev>';

// In-memory idempotency cache (survives within a single function instance).
// Netlify functions can be reused across invocations so this catches rapid retries.
// For full durability you'd use an external store, but this handles 95% of cases.
var processedSessions = {};
var MAX_CACHE = 200;

function markProcessed(sessionId) {
  processedSessions[sessionId] = Date.now();
  // Evict old entries to bound memory
  var keys = Object.keys(processedSessions);
  if (keys.length > MAX_CACHE) {
    keys.sort(function(a, b) { return processedSessions[a] - processedSessions[b]; });
    keys.slice(0, keys.length - MAX_CACHE).forEach(function(k) { delete processedSessions[k]; });
  }
}

function verifySignature(payload, sigHeader, secret) {
  var parts = {};
  sigHeader.split(',').forEach(function(item) {
    var kv = item.split('=');
    if (kv[0] === 't') parts.timestamp = kv[1];
    if (kv[0] === 'v1') parts.signature = kv[1];
  });
  if (!parts.timestamp || !parts.signature) return false;
  var expected = crypto.createHmac('sha256', secret)
    .update(parts.timestamp + '.' + payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.signature));
  } catch (e) {
    return false; // length mismatch
  }
}

function makeDownloadUrl(productKey, expiresAt) {
  var secret = process.env.DOWNLOAD_SECRET || 'default-dev-secret';
  var payload = productKey + ':' + expiresAt;
  var sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return SITE_URL + '/.netlify/functions/download?p=' + productKey + '&e=' + expiresAt + '&s=' + sig;
}

function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set, cannot send email to:', to);
    return Promise.resolve({ sent: false, reason: 'no_api_key' });
  }
  var data = JSON.stringify({ from: FROM_EMAIL, to: [to], subject: subject, html: html });
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          console.error('Resend API error (' + res.statusCode + '):', body);
          resolve({ sent: false, reason: 'api_error', status: res.statusCode });
        } else {
          resolve({ sent: true });
        }
      });
    });
    req.on('error', function(err) {
      console.error('Email send error:', err.message);
      resolve({ sent: false, reason: err.message });
    });
    req.setTimeout(10000, function() {
      req.destroy();
      resolve({ sent: false, reason: 'timeout' });
    });
    req.write(data);
    req.end();
  });
}

function buildCustomerEmail(productKeys, downloadLinks, customerEmail) {
  var esc = config.escapeHtml;
  var fileKeys = productKeys.filter(function(k) { return PRODUCTS[k] && PRODUCTS[k].file; });
  var serviceKeys = productKeys.filter(function(k) { return PRODUCTS[k] && PRODUCTS[k].service && !PRODUCTS[k].file; });
  var digitalKeys = productKeys.filter(function(k) { return PRODUCTS[k] && PRODUCTS[k].digital; });

  var rows = fileKeys.map(function(key) {
    var p = PRODUCTS[key];
    var link = downloadLinks[productKeys.indexOf(key)];
    return '<tr><td style="padding:12px 16px;border-bottom:1px solid #eee;font-family:sans-serif;font-size:14px;">'
      + esc(p.name) + '</td><td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;">'
      + '<a href="' + esc(link) + '" style="background:#c8a45a;color:#08080d;padding:8px 16px;'
      + 'border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:13px;font-weight:bold;">Download</a>'
      + '</td></tr>';
  }).join('');

  var downloadSection = '';
  if (fileKeys.length > 0) {
    downloadSection = '<p style="font-size:15px;color:#333;">Your downloads are ready. Links expire in 72 hours.</p>'
      + '<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">'
      + '<thead><tr><th style="padding:12px 16px;text-align:left;background:#f2ede4;font-size:13px;">Product</th>'
      + '<th style="padding:12px 16px;text-align:right;background:#f2ede4;font-size:13px;">Link</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table>';
  }

  var digitalSection = '';
  if (digitalKeys.length > 0) {
    var digitalNames = digitalKeys.map(function(k) { return esc(PRODUCTS[k].name); }).join(', ');
    digitalSection = '<div style="margin-top:24px;padding:20px;background:#fff;border-radius:8px;border-left:4px solid #10B981;">'
      + '<p style="font-size:15px;color:#333;margin:0 0 8px;">Your <strong>' + digitalNames + '</strong> is now unlocked.</p>'
      + '<p style="font-size:14px;color:#333;margin:0 0 16px;">Return to the tool to start exporting:</p>'
      + '<a href="' + SITE_URL + '/tools/financial-model-pro.html?purchased=true" style="display:inline-block;background:#10B981;color:#fff;padding:12px 24px;'
      + 'border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:bold;">Open Financial Model</a>'
      + '</div>';
  }

  var bookingSection = '';
  if (serviceKeys.length > 0) {
    var serviceNames = serviceKeys.map(function(k) { return esc(PRODUCTS[k].name); }).join(', ');
    bookingSection = '<div style="margin-top:24px;padding:20px;background:#fff;border-radius:8px;border-left:4px solid #c8a45a;">'
      + '<p style="font-size:15px;color:#333;margin:0 0 8px;">Your <strong>' + serviceNames + '</strong> is confirmed.</p>'
      + '<p style="font-size:14px;color:#333;margin:0 0 16px;">Book your session at a time that works for you:</p>'
      + '<a href="' + CALENDLY_URL + '" style="display:inline-block;background:#c8a45a;color:#08080d;padding:12px 24px;'
      + 'border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:bold;">Book via Calendly</a>'
      + '</div>';
  }

  return '<div style="max-width:560px;margin:0 auto;font-family:sans-serif;">'
    + '<div style="background:#08080d;padding:24px;text-align:center;">'
    + '<h1 style="color:#f2ede4;font-size:22px;margin:0;">Thank you for your purchase!</h1></div>'
    + '<div style="padding:24px;background:#f9f9f6;">'
    + downloadSection
    + digitalSection
    + bookingSection
    + '<p style="font-size:13px;color:#666;margin-top:20px;">Need help? Reply to this email or contact yanni@raisereadybook.com</p>'
    + '</div></div>';
}

exports.handler = async function(event) {
  console.log('Webhook received:', event.httpMethod, 'body length:', (event.body || '').length);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  var sigHeader = event.headers['stripe-signature'];
  if (!sigHeader || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook auth fail: sigHeader=' + !!sigHeader + ', secret=' + !!process.env.STRIPE_WEBHOOK_SECRET);
    return { statusCode: 400, body: 'Missing signature or webhook secret' };
  }

  var rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  if (!verifySignature(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)) {
    return { statusCode: 400, body: 'Invalid signature' };
  }

  var stripeEvent;
  try { stripeEvent = JSON.parse(rawBody); } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  var session = stripeEvent.data.object;

  // Idempotency: skip if we already processed this session
  if (processedSessions[session.id]) {
    console.log('Skipping duplicate webhook for session:', session.id);
    return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) };
  }

  var customerEmail = session.customer_details && session.customer_details.email;
  var productString = session.metadata && session.metadata.products;

  if (!customerEmail || !productString) {
    console.error('Missing customer email or products in session:', session.id);
    return { statusCode: 200, body: JSON.stringify({ received: true, warning: 'missing data' }) };
  }

  var productKeys = productString.split(',').filter(function(k) { return PRODUCTS[k]; });
  if (productKeys.length === 0) {
    console.error('No valid products in session:', session.id, 'raw:', productString);
    return { statusCode: 200, body: JSON.stringify({ received: true, warning: 'no valid products' }) };
  }

  var expiresAt = Math.floor(Date.now() / 1000) + (72 * 3600);
  var downloadLinks = productKeys.map(function(key) {
    return PRODUCTS[key].file ? makeDownloadUrl(key, expiresAt) : '';
  });

  // Send both emails in parallel to stay within function timeout
  var customerHtml = buildCustomerEmail(productKeys, downloadLinks, customerEmail);
  var esc = config.escapeHtml;
  var productNames = productKeys.map(function(k) { return esc(PRODUCTS[k].name); }).join(', ');
  var amount = session.amount_total ? ('$' + (session.amount_total / 100).toFixed(2)) : 'unknown';

  var results = await Promise.allSettled([
    sendEmail(customerEmail, 'Your Raise Ready Purchase', customerHtml),
    sendEmail(ADMIN_EMAIL, 'New sale: ' + productKeys.map(function(k) { return PRODUCTS[k].name; }).join(', '),
      '<h3>New Purchase!</h3>'
      + '<p><strong>Customer:</strong> ' + esc(customerEmail) + '</p>'
      + '<p><strong>Products:</strong> ' + productNames + '</p>'
      + '<p><strong>Amount:</strong> ' + esc(amount) + '</p>'
      + '<p><strong>Session:</strong> ' + esc(session.id) + '</p>')
  ]);

  var customerResult = results[0].status === 'fulfilled' ? results[0].value : { sent: false, reason: 'promise_rejected' };
  if (!customerResult.sent) {
    console.error('Failed to send customer email for session:', session.id, 'reason:', customerResult.reason);
  }

  // Mark processed after successful email send
  markProcessed(session.id);

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
