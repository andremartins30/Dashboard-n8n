import pool from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { PaginationControl } from '@/components/ui/pagination-control';
import { DashboardTabs } from '@/components/dashboard-tabs';
import { Suspense } from 'react';
import { ItemsPerPage } from '@/components/ui/items-per-page';
import { SortableHeader } from '@/components/ui/sortable-header';
import { DateFilter } from '@/components/date-filter';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

async function getLastUpdate() {
  const client = await pool.connect();
  try {
    const [clientesRes, titulosRes, enviosRes] = await Promise.all([
      client.query('SELECT criado_em FROM clientes ORDER BY criado_em DESC LIMIT 1'),
      client.query('SELECT criado_em FROM titulos ORDER BY criado_em DESC LIMIT 1'),
      client.query('SELECT enviado_em FROM envios_whatsapp ORDER BY enviado_em DESC LIMIT 1'),
    ]);

    const dates: Date[] = [];

    if (clientesRes.rows[0]?.criado_em) {
      dates.push(new Date(clientesRes.rows[0].criado_em));
    }

    if (titulosRes.rows[0]?.criado_em) {
      dates.push(new Date(titulosRes.rows[0].criado_em));
    }

    if (enviosRes.rows[0]?.enviado_em) {
      dates.push(new Date(enviosRes.rows[0].enviado_em));
    }

    if (dates.length === 0) return null;

    // Retorna a data mais recente entre as três, subtraindo 4 horas para o fuso de Manaus
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    return new Date(latest.getTime() - 4 * 60 * 60 * 1000);
  } finally {
    client.release();
  }
}

async function getStats() {
  const client = await pool.connect();
  try {
    const [clientesRes, titulosRes, enviosRes] = await Promise.all([
      client.query('SELECT COUNT(*) FROM clientes'),
      client.query('SELECT COUNT(*) FROM titulos'),
      client.query('SELECT COUNT(*) FROM envios_whatsapp'),
    ]);

    return {
      clientesCount: parseInt(clientesRes.rows[0].count),
      titulosCount: parseInt(titulosRes.rows[0].count),
      enviosCount: parseInt(enviosRes.rows[0].count),
    };
  } finally {
    client.release();
  }
}

async function getRecentData(page: number = 1, limit: number = 10, sort?: string, order: 'asc' | 'desc' = 'desc', query?: string, date?: string) {
  const offset = (page - 1) * limit;
  const client = await pool.connect();

  // Safelist columns for sorting
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  const clientesSortMap: Record<string, string> = {
    'nome': 'nome',
    'telefone': 'telefone',
    'criado_em': 'criado_em'
  };
  const clientesOrderBy = sort && clientesSortMap[sort] ? clientesSortMap[sort] : 'criado_em';

  const titulosSortMap: Record<string, string> = {
    'numero_titulo': 'numero_titulo',
    'valor_titulo': 'valor_titulo',
    'vencto_real': 'vencto_real',
    'saldo': 'saldo'
  };
  const titulosOrderBy = sort && titulosSortMap[sort] ? titulosSortMap[sort] : 'criado_em';

  const enviosSortMap: Record<string, string> = {
    'nome': 'c.nome',
    'nome_fantasia': 'c.nome_fantasia',
    'titulo_numero': 'e.titulo_numero',
    'enviado_em': 'e.enviado_em',
    'valor_titulo': 'e.valor_titulo',
    'vencto_orig': 'e.vencto_orig'
  };
  const enviosOrderBy = sort && enviosSortMap[sort] ? enviosSortMap[sort] : 'e.enviado_em';

  try {
    const queryParams = query ? [`%${query}%`, limit, offset] : [limit, offset];
    const limitOffsetIndex = query ? '$2 OFFSET $3' : '$1 OFFSET $2';

    const [clientes, titulos, envios] = await Promise.all([
      client.query(`
        SELECT * FROM clientes 
        ${query ? "WHERE nome ILIKE $1 OR nome_fantasia ILIKE $1 OR telefone ILIKE $1" : ""}
        ORDER BY ${clientesOrderBy} ${safeOrder} 
        LIMIT ${limitOffsetIndex}
      `, queryParams),
      client.query(`
        SELECT * FROM titulos 
        ${query ? "WHERE numero_titulo ILIKE $1" : ""}
        ORDER BY ${titulosOrderBy} ${safeOrder} 
        LIMIT ${limitOffsetIndex}
      `, queryParams),
      client.query(`
        SELECT 
          e.*, 
          c.nome, 
          c.nome_fantasia,
          c.whatsapp
        FROM envios_whatsapp e
        LEFT JOIN clientes c ON e.cliente_id = c.codigo
        WHERE 1=1
        ${query ? "AND (c.nome ILIKE $1 OR c.nome_fantasia ILIKE $1 OR e.titulo_numero ILIKE $1)" : ""}
        ${date ? `AND e.enviado_em >= '${date} 00:00:00' AND e.enviado_em < '${date} 00:00:00'::timestamp + interval '1 day'` : ""}
        ORDER BY ${enviosOrderBy} ${safeOrder} 
        LIMIT ${limitOffsetIndex}
      `, queryParams),
    ]);

    return {
      clientes: clientes.rows,
      titulos: titulos.rows,
      envios: envios.rows,
    };
  } finally {
    client.release();
  }
}

async function getOverdueTitles(sort?: string, order: 'asc' | 'desc' = 'desc', query?: string) {
  const client = await pool.connect();

  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';
  const sortMap: Record<string, string> = {
    'nome_fantasia': 'c.nome_fantasia',
    'whatsapp': 'c.whatsapp',
    'qtd_titulos': 'qtd_titulos',
    'valor': 'valor'
  };
  const orderBy = sort && sortMap[sort] ? sortMap[sort] : 'qtd_titulos';

  try {
    let queryText = `
      SELECT
          c.id AS cliente_id,
          c.codigo,
          c.nome,
          c.nome_fantasia,
          c.whatsapp,
          COUNT(t.id) AS qtd_titulos,
          SUM(t.saldo) AS valor
      FROM clientes c
      INNER JOIN titulos t
          ON c.codigo = t.codigo
      WHERE
          t.vencto_orig::date IN (
              CURRENT_DATE - interval '1 day'
          )
          AND t.saldo > 0
    `;

    const queryParams: any[] = [];
    if (query) {
      queryText += ` AND (c.nome ILIKE $1 OR c.nome_fantasia ILIKE $1 OR c.whatsapp ILIKE $1)`;
      queryParams.push(`%${query}%`);
    }

    queryText += `
      GROUP BY 
          c.id, c.codigo, c.nome, c.nome_fantasia, c.whatsapp
      ORDER BY 
          ${orderBy} ${safeOrder};
    `;

    const res = await client.query(queryText, queryParams);
    return res.rows;
  } finally {
    client.release();
  }
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ page?: string, limit?: string, sort?: string, order?: string, query?: string, date?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '10');
  const sort = params.sort;
  const order = (params.order === 'asc' ? 'asc' : 'desc');
  const query = params.query;
  const date = params.date;

  const stats = await getStats();
  const recentData = await getRecentData(page, limit, sort, order, query, date);
  const overdueTitles = await getOverdueTitles(sort, order, query);
  const lastUpdate = await getLastUpdate();

  // Calculate overdue stats
  const overdueStats = {
    clientsCount: overdueTitles.length,
    titlesCount: overdueTitles.reduce((acc, curr) => acc + parseInt(curr.qtd_titulos), 0),
    totalValue: overdueTitles.reduce((acc, curr) => acc + parseFloat(curr.valor), 0),
  };

  // Calculate total pages
  const totalPages = Math.ceil(Math.max(stats.clientesCount, stats.titulosCount, stats.enviosCount) / limit);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Dashboard N8N</h1>
          <div className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate ? lastUpdate.toLocaleString('pt-BR') : 'N/A'}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Títulos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.titulosCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Envios WhatsApp</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enviosCount}</div>
            </CardContent>
          </Card>
        </div>



        {/* Data Tabs */}
        <Suspense fallback={<div>Carregando abas...</div>}>
          <DashboardTabs defaultTab="vencidos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="vencidos">Vencidos Ontem</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="titulos">Títulos</TabsTrigger>
              <TabsTrigger value="envios">Envios WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value="vencidos" className="space-y-4">
              {/* Overdue Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Pendentes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overdueStats.clientsCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Títulos Pendentes</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overdueStats.titlesCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total Pendente</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overdueStats.totalValue)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes com Títulos Vencidos Ontem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Cliente" value="nome_fantasia" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="WhatsApp" value="whatsapp" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Qtd Títulos" value="qtd_titulos" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Valor Total" value="valor" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {overdueTitles.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum título vencido encontrado para ontem.</td>
                          </tr>
                        ) : (
                          overdueTitles.map((item: any) => (
                            <tr key={item.cliente_id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <td className="p-4 align-middle">
                                <div className="font-medium">{item.nome_fantasia}</div>
                                <div className="text-xs text-muted-foreground">{item.nome}</div>
                              </td>
                              <td className="p-4 align-middle">{item.whatsapp}</td>
                              <td className="p-4 align-middle">{item.qtd_titulos}</td>
                              <td className="p-4 align-middle">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clientes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Listagem de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto mb-4">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Nome" value="nome" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Telefone" value="telefone" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Criado em" value="criado_em" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {recentData.clientes.map((client: any) => (
                          <tr key={client.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">{client.nome}</td>
                            <td className="p-4 align-middle">{client.telefone}</td>
                            <td className="p-4 align-middle">{new Date(client.criado_em).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <ItemsPerPage />
                    <PaginationControl currentPage={page} totalPages={Math.ceil(stats.clientesCount / limit)} baseUrl="/" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="titulos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Listagem de Títulos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto mb-4">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Número" value="numero_titulo" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Valor" value="valor_titulo" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Vencimento" value="vencto_real" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Portador
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            Situação
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Status" value="saldo" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {recentData.titulos.map((titulo: any) => (
                          <tr key={titulo.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">{titulo.numero_titulo}</td>
                            <td className="p-4 align-middle">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(titulo.valor_titulo)}
                            </td>
                            <td className="p-4 align-middle">{new Date(titulo.vencto_real).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 align-middle">{titulo.portador}</td>
                            <td className="p-4 align-middle">{titulo.situacao}</td>
                            <td className="p-4 align-middle">{titulo.saldo > 0 ? 'Aberto' : 'Pago'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <ItemsPerPage />
                    <PaginationControl currentPage={page} totalPages={Math.ceil(stats.titulosCount / limit)} baseUrl="/" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="envios" className="space-y-4">
              <div className="flex flex-col items-end gap-2">
                <DateFilter />
                {date && (
                  <a href={`/api/export-csv?date=${date}`} download>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </a>
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Envios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-auto mb-4">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Cliente" value="nome" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Nome Fantasia" value="nome_fantasia" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="WhatsApp" value="whatsapp" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Nº Título" value="titulo_numero" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Parcela" value="parcela" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Vencimento" value="vencto_orig" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Valor" value="valor_titulo" />
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <SortableHeader label="Enviado em" value="enviado_em" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {recentData.envios.map((envio: any) => (
                          <tr key={envio.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                              <div className="font-medium">{envio.nome || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">ID: {envio.cliente_id}</div>
                            </td>
                            <td className="p-4 align-middle">{envio.nome_fantasia || 'N/A'}</td>
                            <td className="p-4 align-middle">{envio.whatsapp}</td>
                            <td className="p-4 align-middle">{envio.titulo_numero}</td>
                            <td className="p-4 align-middle">{envio.parcela}</td>
                            <td className="p-4 align-middle">{new Date(envio.vencto_orig).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 align-middle">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(envio.valor_titulo)}
                            </td>
                            <td className="p-4 align-middle">{new Date(new Date(envio.enviado_em).getTime() - 4 * 60 * 60 * 1000).toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <ItemsPerPage />
                    <PaginationControl currentPage={page} totalPages={Math.ceil(stats.enviosCount / limit)} baseUrl="/" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </DashboardTabs>
        </Suspense>
      </div>
    </div>
  );
}
