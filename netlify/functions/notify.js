var https = require('https');

var NOTIFY_TO = process.env.ADMIN_EMAIL || 'papoutsis89@gmail.com';
var FROM = 'Raise Ready <onboarding@resend.dev>';

function sendRaw(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set, skipping email to:', to, 'subject:', subject);
    return Promise.resolve({ sent: false, reason: 'no_api_key' });
  }
  var data = JSON.stringify({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject: subject,
    html: html
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
        if (res.statusCode >= 400) {
          var body = Buffer.concat(chunks).toString();
          console.error('Resend API error (' + res.statusCode + ') sending to', to, ':', body);
          resolve({ sent: false, reason: 'api_error', status: res.statusCode });
        } else {
          resolve({ sent: true });
        }
      });
    });
    req.on('error', function(err) {
      console.error('Email network error to', to, ':', err.message);
      resolve({ sent: false, reason: err.message });
    });
    req.setTimeout(10000, function() {
      req.destroy();
      console.error('Email send timeout to', to);
      resolve({ sent: false, reason: 'timeout' });
    });
    req.write(data);
    req.end();
  });
}

function sendEmail(subject, html) {
  return sendRaw(NOTIFY_TO, subject, html);
}

function sendToSubscriber(email, subject, html) {
  return sendRaw(email, subject, html);
}

module.exports = { sendEmail: sendEmail, sendToSubscriber: sendToSubscriber, sendRaw: sendRaw };
