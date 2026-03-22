var https = require('https');
var config = require('./products');

var FROM = 'Raise Ready <onboarding@resend.dev>';
var SITE_URL = config.SITE_URL;

exports.handler = async function(event) {
  var origin = event.headers['origin'] || '';
  var allowedOrigin = (origin === SITE_URL || origin === 'https://raisereadybook.com') ? origin : SITE_URL;
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

  var email = (body.email || '').trim().toLowerCase();
  var fileData = body.file;
  var fileName = body.fileName || 'Raise_Ready_5Year_Model_Pro.xlsx';
  var fileType = body.fileType || 'excel';

  if (!config.isValidEmail(email)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Valid email required' }) };
  }
  if (!fileData || typeof fileData !== 'string') {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'File data required' }) };
  }
  // Cap at 5MB base64 (~3.75MB file)
  if (fileData.length > 5 * 1024 * 1024) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'File too large' }) };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Email service unavailable' }) };
  }

  var mime = fileType === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  var emailHtml =
    '<div style="max-width:560px;margin:0 auto;font-family:sans-serif;">' +
    '<div style="background:#08080d;padding:24px;text-align:center;">' +
    '<h1 style="color:#f2ede4;font-size:22px;margin:0;">Your Financial Model</h1></div>' +
    '<div style="padding:24px;background:#f9f9f6;">' +
    '<p style="font-size:15px;color:#333;">Your 5-Year Financial Model Builder is attached to this email.</p>' +
    '<p style="font-size:14px;color:#555;">You can also return to the tool anytime to make changes and re-export:</p>' +
    '<p style="margin:16px 0;"><a href="' + SITE_URL + '/tools/financial-model-pro.html?purchased=true" ' +
    'style="display:inline-block;background:#10B981;color:#fff;padding:12px 24px;border-radius:6px;' +
    'text-decoration:none;font-size:14px;font-weight:bold;">Open Financial Model</a></p>' +
    '<p style="font-size:13px;color:#666;margin-top:20px;">Need help? Reply to this email or contact yanni@raisereadybook.com</p>' +
    '</div></div>';

  var data = JSON.stringify({
    from: FROM,
    to: [email],
    subject: 'Your 5-Year Financial Model Builder',
    html: emailHtml,
    attachments: [{
      filename: fileName,
      content: fileData,
      type: mime
    }]
  });

  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var respBody = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          console.error('Resend error (' + res.statusCode + '):', respBody);
          resolve({ statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Email send failed' }) });
        } else {
          resolve({ statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) });
        }
      });
    });
    req.on('error', function(err) {
      console.error('Email send error:', err.message);
      resolve({ statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Email service error' }) });
    });
    req.setTimeout(15000, function() {
      req.destroy();
      resolve({ statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Email timeout' }) });
    });
    req.write(data);
    req.end();
  });
};
