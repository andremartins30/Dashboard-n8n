import { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
        return new Response('Date is required', { status: 400 });
    }

    const client = await pool.connect();

    try {
        const query = `
      SELECT
        ew.cliente_id,
        c.nome,
        c.nome_fantasia,
        ew.titulo_numero,
        ew.parcela,
        ew.vencto_orig,
        ew.valor_titulo,
        c.whatsapp,
        ew.enviado_em
      FROM envios_whatsapp ew
      INNER JOIN clientes c
        ON c.codigo = ew.cliente_id
      WHERE ew.enviado_em >= $1::timestamp
        AND ew.enviado_em < ($1::timestamp + interval '1 day')
      ORDER BY ew.enviado_em DESC;
    `;

        const res = await client.query(query, [date]);

        // Create CSV content
        const headers = ['ID Cliente', 'Nome', 'Nome Fantasia', 'Nº Titulo', 'Parcela', 'Vencto Orig', 'Valor Titulo', 'WhatsApp', 'Enviado em'];
        const rows = res.rows.map(r => [
            r.cliente_id,
            r.nome,
            r.nome_fantasia,
            r.titulo_numero,
            r.parcela,
            new Date(r.vencto_orig).toLocaleDateString('pt-BR'),
            r.valor_titulo,
            r.whatsapp,
            new Date(r.enviado_em).toLocaleString('pt-BR')
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n');

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="envios_${date}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return new Response('Internal Server Error', { status: 500 });
    } finally {
        client.release();
    }
}
