// Ensure NODE_ENV is set to 'test' for all test runs
process.env.NODE_ENV = 'test';

// Mock the database pool for all tests (no real PostgreSQL needed)
jest.mock('./config/database');
