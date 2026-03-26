const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email i pavlefshëm' }) };
    }

    const API_KEY = process.env.BREVO_API_KEY;
    const LIST_ID = parseInt(process.env.BREVO_LIST_ID) || 2;

    if (!API_KEY) {
      console.error('BREVO_API_KEY not found. Env keys:', Object.keys(process.env).filter(k => k.startsWith('BREVO')));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
    }

    const postData = JSON.stringify({
      email: email,
      listIds: [LIST_ID],
      updateEnabled: true,
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/contacts',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': API_KEY,
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (result.statusCode === 201 || result.statusCode === 204) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    let responseData = {};
    try { responseData = JSON.parse(result.body); } catch(e) {}

    if (responseData.code === 'duplicate_parameter') {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    console.error('Brevo:', result.statusCode, result.body);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Gabim' }) };
  }
};
