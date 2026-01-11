export default async function handler(req, res) {
  console.log('API /api/upload called, method:', req.method);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Forward the request to Express
    const expressUrl = 'http://localhost:3001/api/upload';
    console.log('Forwarding to:', expressUrl);

    // Create a new FormData or use the raw body
    const response = await fetch(expressUrl, {
      method: 'POST',
      body: req, // This might not work for multipart
      headers: {
        ...req.headers,
        host: 'localhost:3001',
      },
    });

    console.log('Express response status:', response.status);

    // Forward the response back
    res.status(response.status);
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    res.send(responseBody);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
}

export const config = {
  api: {
    bodyParser: false, // disable body parsing for multipart
  },
};