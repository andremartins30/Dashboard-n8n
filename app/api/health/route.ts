import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();

        try {
            // Test query
            const result = await client.query('SELECT NOW() as current_time, version() as pg_version');

            return NextResponse.json({
                status: 'healthy',
                database: 'connected',
                timestamp: result.rows[0].current_time,
                version: result.rows[0].pg_version,
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 503 });
    }
}
