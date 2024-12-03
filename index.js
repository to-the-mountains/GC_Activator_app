const https = require('https');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });

const { fetchAuthToken } = require('./service');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/fetchAuthToken', async (req, res) => { // Fixed parameter signature
  try {
    const data = await fetchAuthToken();
    res.json(data);
  } catch (error) {
    console.error('Error in /fetchAuthToken route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to authenticate' });
  }
});

const privateKey = fs.readFileSync('C:/Users/ryantaylor/.vscode/projects/Affinity/certs/privateKey.pem', 'utf8');
const certificate = fs.readFileSync('C:/Users/ryantaylor/.vscode/projects/Affinity/certs/certificate.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(3001, '0.0.0.0', () => {
  console.log('HTTPS Server running on port 3001');
});
