require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Use encryption for data
    trustServerCertificate: true, // Set to true if using self-signed certificates
  },
};

// Function to connect to the database
const connectToDatabase = async () => {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server');
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
};

// Export the SQL object for use in other parts of the application
module.exports = {
  sql,
  connectToDatabase,
};
