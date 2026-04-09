// Brevo newsletter subscription endpoint
// Adds emails to Raise Ready Weekly list (List ID: 5)
// Requires env var: BREVO_API_KEY

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, source } = JSON.parse(event.body || '{}');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const LIST_ID = 5; // Raise Ready Weekly

    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY env var not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        listIds: [LIST_ID],
        attributes: {
          SOURCE: source || 'raisereadybook.com',
          SIGNUP_DATE: new Date().toISOString()
        },
        updateEnabled: true
      })
    });

    // 201 = new contact, 204 = updated existing
    if (response.ok || response.status === 204) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Subscribed successfully' })
      };
    }

    const errorData = await response.json().catch(() => ({}));

    // duplicate_parameter = already subscribed, treat as success
    if (errorData.code === 'duplicate_parameter') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Already subscribed' })
      };
    }

    console.error('Brevo API error:', response.status, errorData);
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify({ error: errorData.message || 'Subscription failed' })
    };
  } catch (err) {
    console.error('Subscribe function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
