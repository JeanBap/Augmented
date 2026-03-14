var crypto = require('crypto');
var https = require('https');

var SITE_URL = 'https://www.raisereadybook.com';
var FROM_EMAIL = 'Raise Ready <onboarding@resend.dev>';
var ADMIN_EMAIL = 'papoutsis89@gmail.com';

var CALENDLY_URL = 'https://calendly.com/yannipapoutsi';

var PRODUCTS = {
  'start-book':           { name: 'Start Ready Book',                          file: '/products/a7e2f19d3b064c81/Start_Ready_Book.pdf' },
  'book':                 { name: 'Raise Ready Book',                          file: '/products/8330624caf17f4c6/Raise_Ready_Book.pdf' },
  'exit-book':            { name: 'Exit Ready Book',                           file: '/products/f83d3651800e29cf/Exit_Ready_Book.pdf' },
  'tpl-complete':         { name: 'Complete Financial Model Template',         file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx' },
  'tpl-complete-support': { name: 'Complete Financial Model + 1hr Video Support', file: '/products/c322d33ab84431e9/Complete_Financial_Model.xlsx', service: true },
  'audit-990':            { name: 'Fundraising Readiness Audit',               service: true },
  'advisory-2000':        { name: 'Fractional Fundraise Advisory (1 month)',   service: true },
  'model-build-5000':     { name: 'Model Build',                              service: true },
  'investor-pkg-8000':    { name: 'Investor Materials Package',                service: true }
};

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
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.signature));
}

function makeDownloadUrl(productKey, expiresAt) {
  var secret = process.env.DOWNLOAD_SECRET || 'default-dev-secret';
  var payload = productKey + ':' + expiresAt;
  var sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return SITE_URL + '/.netlify/functions/download?p=' + productKey + '&e=' + expiresAt + '&s=' + sig;
}

function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) return Promise.resolve();
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
      res.on('end', function() { resolve(); });
    });
    req.on('error', function() { resolve(); });
    req.write(data);
    req.end();
  });
}

function buildCustomerEmail(productKeys, downloadLinks) {
  var fileKeys = productKeys.filter(function(k) { return PRODUCTS[k] && PRODUCTS[k].file; });
  var serviceKeys = productKeys.filter(function(k) { return PRODUCTS[k] && PRODUCTS[k].service && !PRODUCTS[k].file; });

  var rows = fileKeys.map(function(key) {
    var p = PRODUCTS[key];
    var link = downloadLinks[productKeys.indexOf(key)];
    return '<tr><td style="padding:12px 16px;border-bottom:1px solid #eee;font-family:sans-serif;font-size:14px;">'
      + p.name + '</td><td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;">'
      + '<a href="' + link + '" style="background:#c8a45a;color:#08080d;padding:8px 16px;'
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

  var bookingSection = '';
  if (serviceKeys.length > 0) {
    var serviceNames = serviceKeys.map(function(k) { return PRODUCTS[k].name; }).join(', ');
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
    + bookingSection
    + '<p style="font-size:13px;color:#666;margin-top:20px;">Need help? Reply to this email or contact yanni@raisereadybook.com</p>'
    + '</div></div>';
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  var sigHeader = event.headers['stripe-signature'];
  if (!sigHeader || !process.env.STRIPE_WEBHOOK_SECRET) {
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
  var customerEmail = session.customer_details && session.customer_details.email;
  var productString = session.metadata && session.metadata.products;

  if (!customerEmail || !productString) {
    console.log('Missing customer email or products in session:', session.id);
    return { statusCode: 200, body: JSON.stringify({ received: true, warning: 'missing data' }) };
  }

  var productKeys = productString.split(',').filter(function(k) { return PRODUCTS[k]; });
  var expiresAt = Math.floor(Date.now() / 1000) + (72 * 3600); // 72 hours
  var downloadLinks = productKeys.map(function(key) {
    return PRODUCTS[key].file ? makeDownloadUrl(key, expiresAt) : '';
  });

  // Send customer email with download links
  var customerHtml = buildCustomerEmail(productKeys, downloadLinks);
  await sendEmail(customerEmail, 'Your Raise Ready Download Links', customerHtml);

  // Send admin notification
  var productNames = productKeys.map(function(k) { return PRODUCTS[k].name; }).join(', ');
  var amount = session.amount_total ? ('$' + (session.amount_total / 100).toFixed(2)) : 'unknown';
  var adminHtml = '<h3>New Purchase!</h3>'
    + '<p><strong>Customer:</strong> ' + customerEmail + '</p>'
    + '<p><strong>Products:</strong> ' + productNames + '</p>'
    + '<p><strong>Amount:</strong> ' + amount + '</p>'
    + '<p><strong>Session:</strong> ' + session.id + '</p>';
  await sendEmail(ADMIN_EMAIL, 'New sale: ' + productNames, adminHtml);

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
