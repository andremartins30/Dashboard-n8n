import pool from '../lib/db';

async function testConnection() {
    try {
        console.log('Connecting to:', process.env.DB_HOST, 'as', process.env.DB_USER);
        const client = await pool.connect();
        console.log('Connected to database');

        const tables = ['clientes', 'titulos', 'envios_whatsapp'];
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT * FROM ${table} LIMIT 1`);
                console.log(`\nTable: ${table}`);
                console.log(res.rows[0]);
            } catch (err) {
                console.error(`Error querying ${table}:`, err);
            }
        }

        client.release();
    } catch (err) {
        console.error('Error connecting to database:', err);
    } finally {
        await pool.end();
    }
}

testConnection();
