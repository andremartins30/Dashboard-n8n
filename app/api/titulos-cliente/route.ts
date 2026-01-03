import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
        return NextResponse.json({ error: 'Código do cliente é obrigatório' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
        const query = `
            SELECT 
                t.codigo,
                c.nome,
                t.numero_titulo,
                t.parcela,
                t.dt_emissao,
                t.vencto_real,
                t.vencto_real,
                t.valor_titulo,
                t.saldo,
                t.filial_titulo,
                t.prefixo,
                t.tipo,
                t.criado_em,
                CASE
                    WHEN t.vencto_real::date = CURRENT_DATE - INTERVAL '1 day' THEN 'Vencido Ontem'
                    WHEN t.vencto_real::date < CURRENT_DATE - INTERVAL '1 day' THEN 'Vencido'
                END AS status
            FROM titulos t
            INNER JOIN clientes c 
                ON t.codigo = c.codigo
            WHERE 
                t.codigo = $1
                AND t.vencto_real IS NOT NULL
                AND t.vencto_real::date <= CURRENT_DATE - INTERVAL '1 day'
            ORDER BY 
                t.vencto_real DESC;
        `;

        const res = await client.query(query, [codigo]);
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Erro interno ao buscar títulos' }, { status: 500 });
    } finally {
        client.release();
    }
}
