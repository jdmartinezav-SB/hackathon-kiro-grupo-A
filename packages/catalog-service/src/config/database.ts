import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'conecta2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'catalog-service',
    message: 'Unexpected PostgreSQL pool error',
    details: err.message,
  };
  console.error(JSON.stringify(log));
});

export default pool;
