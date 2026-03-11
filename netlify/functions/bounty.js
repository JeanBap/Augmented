var https = require('https');
var notify = require('./notify');

var REPO_OWNER = 'JeanBap';
var REPO_NAME = 'Augmented';
var DATA_PATH = 'data/bounties.json';
var ALLOWED_ORIGIN = 'https://www.raisereadybook.com';

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
        'User-Agent': 'Augmented-Bounty',
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
    if (data) req.write(data);
    req.end();
  });
}

var VALID_BUDGETS = ['1000-2500', '2500-5000', '5000-10000', '10000-25000', '25000+'];

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

  var name = (body.name || '').trim();
  var email = (body.email || '').trim().toLowerCase();
  var company = (body.company || '').trim();
  var description = (body.description || '').trim();
  var budget = (body.budget || '').trim();

  if (!name || name.length > 200) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Name is required' }) };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Valid email required' }) };
  }
  if (!company || company.length > 200) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Company name is required' }) };
  }
  if (!description || description.length < 10) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Please describe what you want automated (at least 10 characters)' }) };
  }
  if (description.length > 5000) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Description too long (max 5000 characters)' }) };
  }
  if (VALID_BUDGETS.indexOf(budget) === -1) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Please select a budget range' }) };
  }

  try {
    var existing = [];
    var fileSha = null;
    var fileRes = await ghRequest('GET', '/contents/' + DATA_PATH + '?ref=main');
    if (fileRes.status === 200 && fileRes.data.content) {
      var decoded = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
      existing = JSON.parse(decoded);
      fileSha = fileRes.data.sha;
    }

    existing.push({
      name: name,
      email: email,
      company: company,
      description: description,
      budget: budget,
      status: 'new',
      date: new Date().toISOString()
    });

    var writeBody = {
      message: 'Bounty: ' + company + ' (' + budget + ')',
      content: Buffer.from(JSON.stringify(existing, null, 2)).toString('base64'),
      branch: 'main'
    };
    if (fileSha) writeBody.sha = fileSha;

    var writeRes = await ghRequest('PUT', '/contents/' + DATA_PATH, writeBody);
    if (writeRes.status === 200 || writeRes.status === 201) {
      await notify.sendEmail(
        'New Bounty: ' + company + ' (' + budget + ')',
        '<h2>New Bounty Submission</h2>' +
        '<table style="border-collapse:collapse;font-family:sans-serif;">' +
        '<tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">' + name + '</td></tr>' +
        '<tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;"><a href="mailto:' + email + '">' + email + '</a></td></tr>' +
        '<tr><td style="padding:6px 12px;font-weight:bold;">Company</td><td style="padding:6px 12px;">' + company + '</td></tr>' +
        '<tr><td style="padding:6px 12px;font-weight:bold;">Budget</td><td style="padding:6px 12px;">$' + budget + '</td></tr>' +
        '<tr><td style="padding:6px 12px;font-weight:bold;">Description</td><td style="padding:6px 12px;">' + description.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td></tr>' +
        '</table>'
      );
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true }) };
    } else {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Failed to save' }) };
    }
  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
