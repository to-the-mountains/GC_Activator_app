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

    const result = await request.execute('GetUserTourList_SS');
    return result.recordset;
  } catch (err) {
    console.error('Error executing GetUserTourList_SS:', err.message);
    throw err;
  }
};

const getFundingList = async ({ userName, date }) => {
  try {
    await connectToDatabase();

    const request = new sql.Request();

    request.input('UserName', sql.NVarChar(50), userName);
    request.input('Date', sql.NVarChar(50), date);
    request.input('ShowUnfunded', sql.Bit, 1);
    request.input('ShowFunded', sql.Bit, 1);
    request.input('ShowAllUnfunded', sql.Bit, 1);
    request.input('ShowZeroPurse', sql.Bit, 1);
    request.input('ShowVoidTrans', sql.Bit, 1);

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

    const query = `SELECT UserName, Location FROM [dbo].[Users] WHERE Email = @Email AND Active = 1`;
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

    const userId = username.split("@")[0]

    // Prepare and execute the query to update the user's location
    const request = new sql.Request();
    request.input('Username', sql.NVarChar(255), userId);
    request.input('Location', sql.NVarChar(255), locationName);

    const query = `
      UPDATE [GC_Activator].[dbo].[Users]
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
    let query = '';
    if(gc.includes('*'))
    {
      const number = gc.replace(/\D/g, '');
      query = `SELECT * 
      FROM [GC_Activator].[dbo].[Transactions] 
      WHERE GC_Number LIKE '%${number}%'`
    }
    else{
      query = `SELECT * FROM [GC_Activator].[dbo].[Transactions] WHERE GC_Number = @GC_Number`;
    }
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

const getFundedAmount = async (gc) => {
  try {
    await connectToDatabase();
    let query = '';
    if(gc.includes('*'))
    {
      const number = gc.replace(/\D/g, '');
      query = `SELECT * 
      FROM [GC_Activator].[dbo].[Transactions] 
      WHERE GC_Number LIKE '%${number}%'
      AND TransType = 'AddFunds'
      AND Response_Code = '1'`
    }
    else{
      query = `SELECT * FROM [GC_Activator].[dbo].[Transactions] WHERE GC_Number = @GC_Number AND TransType = 'AddFunds' AND Response_Code = '1'`;
    }
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

const logFundTransactions = async (data) => {
  try {
    await connectToDatabase();

    // Create SQL request object for the first transaction
    let request = new sql.Request();

    // Insert "Create" transaction
    request.input('GC_Number', sql.NVarChar, data.gcNumber);
    request.input('Amount', sql.Decimal(10, 2), data.amount);
    request.input('Location', sql.NVarChar, data.location);
    request.input('Premium', sql.Decimal(10, 2), data.premium);
    request.input('Refund', sql.Decimal(10, 2), data.refund);
    request.input('Customer', sql.NVarChar, data.customer);
    request.input('Tour_id', sql.Int, data.tourId);
    request.input('Sub_Program', sql.NVarChar, data.subProgram);
    request.input('Balance', sql.Decimal(10, 2), null);
    request.input('Status', sql.NVarChar, 'Created');
    request.input('TransType', sql.NVarChar, 'Created');
    request.input('Request', sql.NVarChar, null);
    request.input('Response', sql.NVarChar, null);
    request.input('Response_Code', sql.NVarChar, null);
    request.input('Response_Desc', sql.NVarChar, null);
    request.input('CreatedBy', sql.NVarChar, data.createdBy);

    await request.query(`
      INSERT INTO [GC_Activator].[dbo].[Transactions] 
      (GC_Number, Amount, Location, Premium, Refund, Customer, Tour_id, Sub_Program, Balance, Status, TransType, Request, Response, Response_Code, Response_Desc, CreatedBy, CreateDate)
      VALUES 
      (@GC_Number, @Amount, @Location, @Premium, @Refund, @Customer, @Tour_id, @Sub_Program, @Balance, @Status, @TransType, @Request, @Response, @Response_Code, @Response_Desc, @CreatedBy, GETDATE())
    `);

    // **Reset request object for second transaction**
    request = new sql.Request();

    // Insert "AddFunds" transaction
    request.input('GC_Number', sql.NVarChar, data.gcNumber);
    request.input('Amount', sql.Decimal(10, 2), data.amount);
    request.input('Location', sql.NVarChar, data.locationId);
    request.input('Premium', sql.Decimal(10, 2), data.premium);
    request.input('Refund', sql.Decimal(10, 2), data.refund);
    request.input('Customer', sql.NVarChar, data.customer);
    request.input('Tour_id', sql.Int, data.tourId);
    request.input('Sub_Program', sql.NVarChar, data.subProgram);
    request.input('Balance', sql.Decimal(10, 2), data.amount);
    request.input('Status', sql.NVarChar, 'Funded');
    request.input('TransType', sql.NVarChar, 'AddFunds');
    request.input('Request', sql.NVarChar, data.request);
    request.input('Response', sql.NVarChar, data.response);
    request.input('Response_Code', sql.NVarChar, data.responseCode);
    request.input('Response_Desc', sql.NVarChar, data.responseDesc);
    request.input('CreatedBy', sql.NVarChar, data.createdBy);

    await request.query(`
      INSERT INTO [GC_Activator].[dbo].[Transactions] 
      (GC_Number, Amount, Location, Premium, Refund, Customer, Tour_id, Sub_Program, Balance, Status, TransType, Request, Response, Response_Code, Response_Desc, CreatedBy, CreateDate)
      VALUES 
      (@GC_Number, @Amount, @Location, @Premium, @Refund, @Customer, @Tour_id, @Sub_Program, @Balance, @Status, @TransType, @Request, @Response, @Response_Code, @Response_Desc, @CreatedBy, GETDATE())
    `);

    return { success: true, message: 'Transactions created successfully' };
  } catch (err) {
    console.error('Error inserting transactions:', err.message);
    throw err;
  }
};

const logVoidTransactions = async (data) => {
  try {
    await connectToDatabase();

    // Create SQL request object for the first transaction
    let request = new sql.Request();

    // Insert "VoidTrans" transaction
    request.input('GC_Number', sql.NVarChar, data.gcNumber);
    request.input('Amount', sql.Decimal(10, 2), data.amount);
    request.input('Location', sql.NVarChar, data.locationId);
    request.input('Premium', sql.Decimal(10, 2), data.premium);
    request.input('Refund', sql.Decimal(10, 2), data.refund);
    request.input('Customer', sql.NVarChar, data.customer);
    request.input('Tour_id', sql.Int, data.tourId);
    request.input('Sub_Program', sql.NVarChar, data.subProgram);
    request.input('Balance', sql.Decimal(10, 2), 0);
    request.input('Status', sql.NVarChar, 'Voided');
    request.input('TransType', sql.NVarChar, 'VoidTrans');
    request.input('Request', sql.NVarChar, data.request);
    request.input('Response', sql.NVarChar, data.response);
    request.input('Response_Code', sql.NVarChar, data.responseCode);
    request.input('Response_Desc', sql.NVarChar, data.responseDesc);
    request.input('CreatedBy', sql.NVarChar, data.createdBy);

    await request.query(`
      INSERT INTO [GC_Activator].[dbo].[Transactions] 
      (GC_Number, Amount, Location, Premium, Refund, Customer, Tour_id, Sub_Program, Balance, Status, TransType, Request, Response, Response_Code, Response_Desc, CreatedBy, CreateDate)
      VALUES 
      (@GC_Number, @Amount, @Location, @Premium, @Refund, @Customer, @Tour_id, @Sub_Program, @Balance, @Status, @TransType, @Request, @Response, @Response_Code, @Response_Desc, @CreatedBy, GETDATE())
    `);

    return { success: true, message: 'Transactions created successfully' };
  } catch (err) {
    console.error('Error inserting transactions:', err.message);
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
  updateLocation,
  logFundTransactions,
  logVoidTransactions,
  getFundedAmount
};
