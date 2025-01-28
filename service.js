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
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error.response?.data || error.message);
    throw error;
  }
};

const verifyConnection = async (data) => {
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

const fundCard = async (paramstr) => {
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
              <paramstr><![CDATA[${paramstr}]]></paramstr>
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

const voidCard = async (paramstr) => {
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
              <paramstr><![CDATA[${paramstr}]]></paramstr>
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

const getFundingList = async ({ userName, date, showUnfunded, showFunded, showAllUnfunded, showZeroPurse, showVoidTrans }) => {
  try {
    await connectToDatabase();

    const request = new sql.Request();

    request.input('UserName', sql.NVarChar(50), userName);
    request.input('Date', sql.NVarChar(50), date);
    request.input('ShowUnfunded', sql.Bit, showUnfunded ? 1 : 0);
    request.input('ShowFunded', sql.Bit, showFunded ? 1 : 0);
    request.input('ShowAllUnfunded', sql.Bit, showAllUnfunded ? 1 : 0);
    request.input('ShowZeroPurse', sql.Bit, showZeroPurse ? 1 : 0);
    request.input('ShowVoidTrans', sql.Bit, showVoidTrans ? 1 : 0);

    const result = await request.execute('GetUserTransactionList_SS');

    return result.recordset;
  } catch (err) {
    console.error('Error executing GetFundingList:', err.message);
    throw err;
  }
};




/**
 * Check user by email and return user details.
 * @param {string} email
 * @returns {Promise<object>}
 */
const checkUserByEmail = async (email) => {
  try {
    await connectToDatabase();

    const query = `SELECT UserName FROM [dbo].[Users] WHERE Email = @Email AND Active = 1`;
    const request = new sql.Request();
    request.input('Email', sql.NVarChar, email);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // No user found
    }

    return result.recordset[0]; // Return the first matching user
  } catch (err) {
    console.error('Error checking user by email:', err.message);
    throw err;
  }
};

const updateLocation = async ({ username, location }) => {
  try {
    // Establish the database connection
    await connectToDatabase();

    // Map location IDs to corresponding strings
    const locationMap = {
      22: 'Main Line',
      23: 'In House',
      24: 'Massanutten',
    };

    // Get the location name from the map
    const locationName = locationMap[location];
    if (!locationName) {
      throw new Error('Invalid location ID provided.');
    }

    // Prepare and execute the query to update the user's location
    const request = new sql.Request();
    request.input('Username', sql.NVarChar(255), username);
    request.input('Location', sql.NVarChar(255), locationName);

    const query = `
      UPDATE [GC_Activator_Dev].[dbo].[Users]
      SET Location = @Location
      WHERE UserName = @Username;
    `;

    // Execute the query
    const result = await request.query(query);

    // Check if any rows were affected (to confirm the update was successful)
    if (result.rowsAffected[0] === 0) {
      throw new Error('No user found with the provided username.');
    }

    // Return a success response
    return {
      success: true,
      message: `Location updated to '${locationName}' for user '${username}'.`,
    };
  } catch (err) {
    console.error('Error in updateLocation:', err.message);
    throw err;
  }
};

const getTransactions = async (gc) => {
  try {
    await connectToDatabase();

    const query = `SELECT * FROM [GC_Activator_Dev].[dbo].[Transactions] WHERE GC_Number = @GC_Number`;
    const request = new sql.Request();
    request.input('GC_Number', sql.NVarChar, gc);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // No transactions found
    }
    return result.recordset; // Return all matching transactions
  } catch (err) {
    console.error('Error retrieving transaction list:', err.message);
    throw err;
  }
};


module.exports = {
  fetchAuthToken,
  verifyConnection,
  fundCard,
  voidCard,
  getFundingList,
  getUserList,
  getTourList,
  checkUserByEmail,
  getTransactions,
  updateLocation
};
