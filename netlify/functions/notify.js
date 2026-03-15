var https = require('https');

var NOTIFY_TO = 'papoutsis89@gmail.com';
var FROM = 'Raise Ready <onboarding@resend.dev>';

function sendRaw(to, subject, html) {
  if (!process.env.RESEND_API_KEY) return Promise.resolve();
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
      res.on('end', function() { resolve(); });
    });
    req.on('error', function() { resolve(); });
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

module.exports = { sendEmail: sendEmail, sendToSubscriber: sendToSubscriber };
