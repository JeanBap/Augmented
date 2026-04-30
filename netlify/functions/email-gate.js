var https = require('https');
var notify = require('./notify');
var config = require('./products');

var REPO_OWNER = 'JeanBap';
var REPO_NAME = 'Augmented';
var DATA_PATH = 'data/tool-leads.json';
var ALLOWED_ORIGIN = config.SITE_URL;
var MAX_RETRIES = 3;

function ghRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var data = body ? JSON.stringify(body) : '';
    var opts = {
      hostname: 'api.github.com',
      path: '/repos/' + REPO_OWNER + '/' + REPO_NAME + path,
      method: method,
      headers: {
        'Authorization': 'token ' + process.env.GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Augmented-EmailGate',
        'Content-Type': 'application/json'
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    var req = https.request(opts, function(res) {
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, function() { req.destroy(new Error('GitHub API timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// Read-modify-write with retry on SHA conflict (409)
async function appendLead(email, tool) {
  for (var attempt = 0; attempt < MAX_RETRIES; attempt++) {
    var existing = [];
    var fileSha = null;
    var fileRes = await ghRequest('GET', '/contents/' + DATA_PATH + '?ref=main');
    if (fileRes.status === 200 && fileRes.data.content) {
      var decoded = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
      existing = JSON.parse(decoded);
      fileSha = fileRes.data.sha;
    }

    // Check duplicate (case-insensitive since we already lowercased input)
    var isDuplicate = existing.some(function(entry) {
      return (entry.email || '').toLowerCase() === email && entry.tool === tool;
    });
    if (isDuplicate) return { ok: true, duplicate: true };

    existing.push({ email: email, tool: tool, date: new Date().toISOString() });

    var writeBody = {
      message: 'Tool lead: ' + email + ' (' + tool + ')',
      content: Buffer.from(JSON.stringify(existing, null, 2)).toString('base64'),
      branch: 'main'
    };
    if (fileSha) writeBody.sha = fileSha;

    var writeRes = await ghRequest('PUT', '/contents/' + DATA_PATH, writeBody);
    if (writeRes.status === 200 || writeRes.status === 201) {
      return { ok: true, duplicate: false };
    }
    // 409 = SHA conflict (race condition), retry with fresh SHA
    if (writeRes.status === 409 && attempt < MAX_RETRIES - 1) {
      console.log('SHA conflict on attempt ' + (attempt + 1) + ', retrying...');
      continue;
    }
    console.error('GitHub write failed (' + writeRes.status + '):', JSON.stringify(writeRes.data));
    return { ok: false, error: 'write_failed' };
  }
  return { ok: false, error: 'max_retries' };
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

  var email = (body.email || '').trim().toLowerCase();
  var tool = (body.tool || '').trim();

  if (!config.isValidEmail(email)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Valid email required' }) };
  }
  if (!tool) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Tool name required' }) };
  }

  try {
    var result = await appendLead(email, tool);

    if (!result.ok) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to save' }) };
    }

    if (result.duplicate) {
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, message: 'Already saved' }) };
    }

    // Admin notification (escaped)
    var esc = config.escapeHtml;
    await notify.sendEmail(
      'Tool Lead: ' + email + ' used ' + tool,
      '<h2>New Tool Lead</h2>' +
      '<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">' +
      '<tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">' + esc(email) + '</td></tr>' +
      '<tr><td style="padding:6px 12px;font-weight:bold;">Tool</td><td style="padding:6px 12px;">' + esc(tool) + '</td></tr>' +
      '<tr><td style="padding:6px 12px;font-weight:bold;">Date</td><td style="padding:6px 12px;">' + new Date().toISOString() + '</td></tr>' +
      '</table>'
    );

    // Send checklist to subscriber if newsletter signup
    if (tool === 'newsletter-audit-checklist') {
      await notify.sendToSubscriber(
        email,
        'Your 90-Minute Financial Model Audit Checklist',
        '<div style="max-width:560px;margin:0 auto;font-family:Georgia,serif;color:#08080d;">' +
        '<h1 style="font-size:22px;margin-bottom:8px;">Here is your checklist.</h1>' +
        '<p style="font-size:15px;color:#555;line-height:1.6;">Thanks for signing up. The 90-Minute Financial Model Audit checklist is a step-by-step guide to stress-testing your model before investors do.</p>' +
        '<p style="margin:24px 0;"><a href="https://www.raisereadybook.com/assets/90-minute-model-audit.pdf" style="display:inline-block;padding:12px 28px;background:#c8a45a;color:#08080d;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;">Download the Checklist (PDF)</a></p>' +
        '<p style="font-size:14px;color:#555;line-height:1.6;">You will also receive weekly insights on fundraising, financial modeling, and exit strategy.</p>' +
        '<p style="font-size:14px;color:#555;">Yanni Papoutsis<br><a href="https://www.raisereadybook.com" style="color:#c8a45a;">raisereadybook.com</a></p>' +
        '</div>'
      );
    }

    return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, message: 'Saved' }) };
  } catch (err) {
    console.error('email-gate error:', err.message);
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
