require('dotenv').config();
const sql = require('mssql');

const config = {
  user: "sa",
  password: "%+eXe5qkzwd>^?31Ck?D",
  server: "192.168.216.99",
  database: "GC_Activator_Dev",
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
