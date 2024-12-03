const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');

const apiURL = process.env.URL

const fetchAuthToken = async () => {
  try {
    const jar = new tough.CookieJar();
    const client = wrapper(axios.create({ jar }));

    const url = `${apiURL}/oauth/oauth20/token`;
    console.log(url)
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });

    const response = await client.post(url, data, { headers });

    console.log('Access Token:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching token:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  fetchAuthToken,
};
