import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false, 
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
const connectToDB = async () => {
    try {
        const client = await pool.connect();
        console.log("✓ Connected to PostgreSQL database successfully");
        client.release();
    } catch (error: any) {
        console.error("✗ Error connecting to the database:", error.message);
        throw error;
    }
};

// Initialize database schema
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        // Create events table for raw event storage
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                site_id VARCHAR(255) NOT NULL,
                event_type VARCHAR(100) NOT NULL,
                path VARCHAR(1000),
                user_id VARCHAR(255),
                timestamp TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Create indexes for better query performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_events_site_timestamp 
            ON events(site_id, timestamp DESC);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_events_site_date 
            ON events(site_id, DATE(timestamp));
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_events_user_id 
            ON events(user_id);
        `);

        console.log("✓ Database schema initialized successfully");
    } catch (error: any) {
        console.error("✗ Error initializing database:", error.message);
        throw error;
    } finally {
        client.release();
    }
};

export { pool, connectToDB, initializeDatabase };
