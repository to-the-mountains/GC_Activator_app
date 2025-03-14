const https = require('https');
const http = require('http');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./dbConfig');
require('dotenv').config();

const { fetchAuthToken, verifyConnection, fundCard, getUserList, getTourList, checkUserByEmail, getFundingList, getTransactions, updateLocation, logFundTransactions, getFundedAmount, logVoidTransactions, addUser } = require('./service');

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

app.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;

    const data = await checkUserByEmail(email);
    res.json(data);
  } catch (err) {
    console.error('Error in /check-user route:', err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/getFundingList', async (req, res) => {
  try {
    const { userName, date } = req.body;

    if (!userName || !date) {
      return res.status(400).json({
        error: "Missing 'userName' or 'date' in the request body.",
      });
    }

    const data = await getFundingList({
      userName,
      date
    });

    res.json(data);
  } catch (err) {
    console.error('Error in /getFundingList route:', err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/fundCard', async (req, res) => {
  try {
    const data = req.body
    const paramstr = `${process.env.nbFundingCardID},${process.env.nbFundingCardPassCode},3464,${process.env.nbFundingCardID},${process.env.nbFundingCardPassCode},${data.nbATTMID},${data.nbATTMID},1,${data.nbTransferAmount},${data.nbTransferAmount},Activator,GiftCard,gcactivationnotice@massresort.com,9545561300,R,R,R,Reference,Reference`
    const result = await fundCard(paramstr);
    res.json(result);
  } catch (error) {
    console.error('Error in /fundCard route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

app.post('/voidCard', async (req, res) => {
  try {
    const data = req.body
    const paramstr = `${process.env.nbFundingCardID},${process.env.nbFundingCardPassCode},3461,${process.env.nbFundingCardID},${process.env.nbFundingCardPassCode},${data.nbCHCardID},${data.nbTransferAmount},R,R,R,Reference,Reference`
    const result = await fundCard(paramstr);
    res.json(result);
  } catch (error) {
    console.error('Error in /voidCard route:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

app.post('/updateLocation', async (req, res) => {
  try {
    const { username, location } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Location' is required." });
    }

    const data = await updateLocation({ username, location });
    res.json(data);
  } catch (err) {
    console.error('Error in /updateLocation route:', err.message);
    res.status(500).json({ error: 'An error occurred while updating the location.' });
  }
});

app.post('/getFundedAmount', async (req, res) => {
  try {
    const { gc } = req.body;

    if (!gc) {
      return res.status(400).json({ error: "'GC Number' is required." });
    }
    const data = await getFundedAmount(gc);
    res.json(data);
  } catch (err) {
    console.error('Error in /getFundedAmount route:', err.message);
    res.status(500).json({ error: 'An error occurred while retrieving the funded amount.' });
  }
});

app.post('/getTransactions', async (req, res) => {
  try {
    const { gc } = req.body;

    if (!gc) {
      return res.status(400).json({ error: "'GC Number' is required." });
    }
    const data = await getTransactions(gc);
    res.json(data);
  } catch (err) {
    console.error('Error in /getTransactions route:', err.message);
    res.status(500).json({ error: 'An error occurred while retrieving the transactions.' });
  }
});

app.post('/logFundTransactions', async (req, res) => {
  try {
    const data = await logFundTransactions(req.body.data);
    res.json(data);
  } catch (err) {
    console.error('Error in /logFundTransactions route:', err.message);
    res.status(500).json({ error: 'An error occurred while posting the data.' });
  }
});

app.post('/logVoidTransactions', async (req, res) => {
  try {
    const data = await logVoidTransactions(req.body.data);
    res.json(data);
  } catch (err) {
    console.error('Error in /logVoidTransactions route:', err.message);
    res.status(500).json({ error: 'An error occurred while posting the data.' });
  }
});

app.post('/addUser', async (req, res) => {
  try {
    const { username, firstname, lastname, email, phone, role, location } = req.body;

    if (!username || !firstname || !lastname || !email || !phone || !role || !location) {
      return res.status(400).json({ error: 'All fields are required: firstName, lastName, email, phone, role, location' });
    }

    const userData = { username, firstname, lastname, email, phone, role, location };
    const result = await addUser(userData);

    res.json(result);
  } catch (err) {
    console.error('Error in /addUser route:', err.message);
    res.status(500).json({ error: 'Failed to add user' });
  }
});


const privateKey = fs.readFileSync(process.env.KEY_PATH, 'utf8');
const certificate = fs.readFileSync(process.env.CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

connectToDatabase().then(() => {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(3001, '0.0.0.0', () => {
    console.log('HTTPS Server running on port 3001');
  });
});

// connectToDatabase().then(() => {
//   const httpServer = http.createServer(app);
//   httpServer.listen(3001, '0.0.0.0', () => {
//     console.log('HTTP Server running on port 3001');
//   });
// });