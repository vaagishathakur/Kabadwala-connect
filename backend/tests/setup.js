// tests/setup.js
// Set test environment variables before any tests run
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_kabadconnect';
process.env.PORT = '3001';

// Use SQLite in-memory for testing (via Sequelize dialect override)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'kabadconnect_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = 'testpassword';

// ML service mock URL
process.env.ML_SERVICE_URL = 'http://localhost:8001';
