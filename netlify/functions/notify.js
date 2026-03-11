var https = require('https');

var NOTIFY_TO = 'papoutsis89@gmail.com';
var FROM = 'Augmented <onboarding@resend.dev>';

function sendEmail(subject, html) {
  if (!process.env.RESEND_API_KEY) return Promise.resolve();
  var data = JSON.stringify({
    from: FROM,
    to: [NOTIFY_TO],
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
    req.on('error', function() { resolve(); }); // fail silently, don't block the form
    req.write(data);
    req.end();
  });
}

module.exports = { sendEmail: sendEmail };
