const https = require('https');
const http = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./dbConfig');
require('dotenv').config({ path: '.env.local' });

const { fetchAuthToken, verifyConnection, fundCard, getUserList, getTourList, checkUserByEmail, getFundingList } = require('./service');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/fetchAuthToken', async (req, res) => {
  try {
    const data = await fetchAuthToken();
    res.json(data);
  } catch (error) {
    console.error('Error in /fetchAuthToken route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to authenticate' });
  }
});

app.post('/verifyConnection', async (req, res) => {
  try {
    const data = await verifyConnection(req.body);
    res.json(data);
  } catch (error) {
    console.error('Error in /verifyConnection route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

app.post('/fundCard', async (req, res) => {
  try {
    const data = await fundCard(req.body);
    res.json(data);
  } catch (error) {
    console.error('Error in /fundCard route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

app.get('/getUserList', async (req, res) => {
  try {
    const data = await getUserList();
    res.json(data);
  } catch (err) {
    console.error('Error in /getUserList route:', err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/getTourList', async (req, res) => {
  try {
    const { username, date, locationID } = req.body;

    if (!username || !date || !locationID) {
      return res.status(400).json({
        error: "Please provide 'username', 'date', and 'locationID' in the request body.",
      });
    }

    const data = await getTourList(username, date, locationID);
    res.json(data);
  } catch (err) {
    console.error('Error in /getTourList route:', err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/getFundingList', async (req, res) => {
  try {
    console.log('test1')
    console.log('Request Body:', req.body); // Log the incoming request body

    const { userName, date, showUnfunded, showFunded, showAllUnfunded, showZeroPurse, showVoidTrans } = req.body;

    if (!userName || !date) {
      return res.status(400).json({
        error: "Missing 'userName' or 'date' in the request body.",
      });
    }

    const data = await getFundingList({
      userName,
      date,
      showUnfunded,
      showFunded,
      showAllUnfunded,
      showZeroPurse,
      showVoidTrans,
    });

    res.json(data);
  } catch (err) {
    console.error('Error in /getFundingList route:', err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});




// const privateKey = fs.readFileSync('C:/Users/ryantaylor/.vscode/projects/Affinity/certs/privateKey.pem', 'utf8');
// const certificate = fs.readFileSync('C:/Users/ryantaylor/.vscode/projects/Affinity/certs/certificate.pem', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

// connectToDatabase().then(() => {
//   const httpsServer = https.createServer(credentials, app);
//   httpsServer.listen(3001, '0.0.0.0', () => {
//     console.log('HTTPS Server running on port 3001');
//   });
// });

connectToDatabase().then(() => {
  const httpServer = http.createServer(app);
  httpServer.listen(3001, '0.0.0.0', () => {
    console.log('HTTP Server running on port 3001');
  });
});