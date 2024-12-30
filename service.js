const { parseStringPromise } = require('xml2js');
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const { connectToDatabase, sql } = require('./dbConfig');

const apiURL = process.env.URL;

const fetchAuthToken = async () => {
  try {
    const jar = new tough.CookieJar();
    const client = wrapper(axios.create({ jar }));

    const url = `${apiURL}/oauth/oauth20/token`;
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
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error.response?.data || error.message);
    throw error;
  }
};

const callSoapAPI = async (data) => {
  try {
    const accessToken = await fetchAuthToken();
    const soapUrl = `${apiURL}/FSVRemote/v1/fsvremote`;
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://FSVWebServices/FSVRemote/Transact',
      Authorization: `Bearer ${accessToken}`,
    };

    const soapBody = `
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <Transact xmlns="http://FSVWebServices/FSVRemote/">
              <userid>${process.env.USER_ID}</userid>
              <password>${process.env.PASSWORD}</password>
              <paramstr><![CDATA[${data.certCard},${data.passcode},${data.transaction},${data.transactionString}]]></paramstr>
            </Transact>
          </soap:Body>
        </soap:Envelope>
      `;

    const response = await axios.post(soapUrl, soapBody, { headers });

    const parsed = await parseStringPromise(response.data, { trim: true, explicitArray: false });

    const result = parsed['soap:Envelope']['soap:Body']['TransactResponse']['TransactResult'];
    return result;
  } catch (error) {
    console.error('Error in SOAP call:', error.response?.data || error.message);
    throw error;
  }
};

const getUserList = async () => {
  try {
    await connectToDatabase();

    const storedProcedure = 'GetUserList';
    const request = new sql.Request();

    const result = await request.execute(storedProcedure);
    return result.recordset;
  } catch (err) {
    console.error('Error executing stored procedure:', err.message);
    throw err;
  }
};

const getTourList = async (username, date, locationID) => {
  try {
    await connectToDatabase();

    const request = new sql.Request();
    request.input('UserName', sql.NVarChar(50), username);
    request.input('Date', sql.DateTime, date);
    request.input('LocationID', sql.Int, locationID);

    const result = await request.execute('GetUserTourList_SS');
    return result.recordset;
  } catch (err) {
    console.error('Error executing GetUserTourList_SS:', err.message);
    throw err;
  }
};

module.exports = {
  fetchAuthToken,
  callSoapAPI,
  getUserList,
  getTourList,
};
