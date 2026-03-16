// Account system for FM Pro - uses Supabase for auth + storage.
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
// DB table: saved_models (id uuid PK, user_id uuid FK, name text, assumptions jsonb, hires jsonb, created_at timestamptz, updated_at timestamptz)
var https = require('https');
var config = require('./products');

var ALLOWED_ORIGIN = config.SITE_URL;

function supabaseRequest(method, path, body, token) {
  return new Promise(function(resolve, reject) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return resolve({ status: 503, data: { error: 'Account system not configured' } });
    }
    var url = new URL(process.env.SUPABASE_URL);
    var data = body ? JSON.stringify(body) : '';
    var headers = {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    else headers['Authorization'] = 'Bearer ' + process.env.SUPABASE_SERVICE_KEY;
    var opts = {
      hostname: url.hostname,
      path: path,
      method: method,
      headers: headers
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
    req.setTimeout(10000, function() { req.destroy(new Error('Supabase timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async function(event) {
  var origin = event.headers['origin'] || '';
  var allowedOrigin = (origin === ALLOWED_ORIGIN || origin === 'https://raisereadybook.com') ? origin : ALLOWED_ORIGIN;
  var headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers, body: '' };

  var body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var action = body.action || event.queryStringParameters?.action;

  // ===== SIGN UP =====
  if (action === 'signup') {
    var email = (body.email || '').trim().toLowerCase();
    var password = body.password || '';
    if (!config.isValidEmail(email)) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Invalid email' }) };
    }
    if (password.length < 8) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Password must be at least 8 characters' }) };
    }
    try {
      var res = await supabaseRequest('POST', '/auth/v1/signup', { email: email, password: password });
      if (res.status >= 400) {
        var msg = res.data?.msg || res.data?.error_description || 'Signup failed';
        return { statusCode: res.status, headers: headers, body: JSON.stringify({ error: msg }) };
      }
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, user: res.data }) };
    } catch (err) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Signup service unavailable' }) };
    }
  }

  // ===== LOG IN =====
  if (action === 'login') {
    var email = (body.email || '').trim().toLowerCase();
    var password = body.password || '';
    if (!email || !password) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Email and password required' }) };
    }
    try {
      var res = await supabaseRequest('POST', '/auth/v1/token?grant_type=password', { email: email, password: password });
      if (res.status >= 400) {
        return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, token: res.data.access_token, user: res.data.user }) };
    } catch (err) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Login service unavailable' }) };
    }
  }

  // ===== SAVE MODEL =====
  if (action === 'save') {
    var token = (event.headers['authorization'] || '').replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Not authenticated' }) };
    }
    var assumptions = body.assumptions;
    var hiresList = body.hires;
    var modelName = (body.name || 'My Model').substring(0, 100);
    if (!assumptions) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'No model data' }) };
    }
    try {
      // Get user from token
      var userRes = await supabaseRequest('GET', '/auth/v1/user', null, token);
      if (userRes.status >= 400) {
        return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Invalid session' }) };
      }
      var userId = userRes.data.id;
      // Upsert: update if same user+name, insert otherwise
      var saveRes = await supabaseRequest('POST', '/rest/v1/saved_models', {
        user_id: userId,
        name: modelName,
        assumptions: assumptions,
        hires: hiresList,
        updated_at: new Date().toISOString()
      });
      if (saveRes.status >= 400) {
        console.error('Save model error:', JSON.stringify(saveRes.data));
        return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Save failed' }) };
      }
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, model: saveRes.data }) };
    } catch (err) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Save service unavailable' }) };
    }
  }

  // ===== LIST SAVED MODELS =====
  if (action === 'list') {
    var token = (event.headers['authorization'] || '').replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Not authenticated' }) };
    }
    try {
      var userRes = await supabaseRequest('GET', '/auth/v1/user', null, token);
      if (userRes.status >= 400) {
        return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Invalid session' }) };
      }
      var userId = userRes.data.id;
      var listRes = await supabaseRequest('GET', '/rest/v1/saved_models?user_id=eq.' + userId + '&order=updated_at.desc&limit=20', null, token);
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, models: listRes.data || [] }) };
    } catch (err) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'List service unavailable' }) };
    }
  }

  // ===== LOAD MODEL =====
  if (action === 'load') {
    var token = (event.headers['authorization'] || '').replace('Bearer ', '');
    var modelId = body.id;
    if (!token) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Not authenticated' }) };
    }
    if (!modelId) {
      return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Model ID required' }) };
    }
    try {
      var userRes = await supabaseRequest('GET', '/auth/v1/user', null, token);
      if (userRes.status >= 400) {
        return { statusCode: 401, headers: headers, body: JSON.stringify({ error: 'Invalid session' }) };
      }
      var userId = userRes.data.id;
      var loadRes = await supabaseRequest('GET', '/rest/v1/saved_models?id=eq.' + modelId + '&user_id=eq.' + userId, null, token);
      if (!loadRes.data || loadRes.data.length === 0) {
        return { statusCode: 404, headers: headers, body: JSON.stringify({ error: 'Model not found' }) };
      }
      return { statusCode: 200, headers: headers, body: JSON.stringify({ ok: true, model: loadRes.data[0] }) };
    } catch (err) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: 'Load service unavailable' }) };
    }
  }

  return { statusCode: 400, headers: headers, body: JSON.stringify({ error: 'Unknown action. Use: signup, login, save, list, load' }) };
};
