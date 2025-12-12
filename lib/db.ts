import { Pool } from 'pg';

// Validate required environment variables
function validateEnv() {
    const usingConnectionString = !!process.env.DATABASE_URL;
    const usingIndividualParams = !!(
        process.env.DB_USER &&
        process.env.DB_PASSWORD &&
        process.env.DB_HOST &&
        process.env.DB_NAME
    );

    if (!usingConnectionString && !usingIndividualParams) {
        throw new Error(
            'Database configuration missing. Please set either DATABASE_URL or individual DB_* environment variables.'
        );
    }

    return { usingConnectionString, usingIndividualParams };
}

// Create pool configuration
function createPoolConfig() {
    const { usingConnectionString } = validateEnv();

    if (usingConnectionString) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
    }

    return {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    };
}

// Create pool with error handling
const pool = new Pool(createPoolConfig());

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

// Test connection on startup (only in production)
if (process.env.NODE_ENV === 'production') {
    pool.connect()
        .then(client => {
            console.log('✅ Database connection established successfully');
            client.release();
        })
        .catch(err => {
            console.error('❌ Failed to connect to database:', err.message);
            console.error('Connection details:', {
                host: process.env.DB_HOST || 'from DATABASE_URL',
                database: process.env.DB_NAME || 'from DATABASE_URL',
                port: process.env.DB_PORT || '5432',
            });
        });
}

export default pool;

