"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/ui/sortable-header"
import { ClientTitlesModal } from "@/components/client-titles-modal"

interface OverdueTitlesTableProps {
    overdueTitles: any[]
}

export function OverdueTitlesTable({ overdueTitles }: OverdueTitlesTableProps) {
    const [selectedClient, setSelectedClient] = React.useState<{ codigo: string, nome: string } | null>(null)

    return (
        <>
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50">
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
                            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {overdueTitles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground">Nenhum título vencido encontrado para ontem.</td>
                            </tr>
                        ) : (
                            overdueTitles.map((item: any) => (
                                <tr key={item.cliente_id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">{item.nome_fantasia}</div>
                                        <div className="text-xs text-muted-foreground">{item.nome}</div>
                                    </td>
                                    <td className="p-4 align-middle">{item.whatsapp}</td>
                                    <td className="p-4 align-middle">{item.qtd_titulos}</td>
                                    <td className="p-4 align-middle">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                                    </td>
                                    <td className="p-4 align-middle text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-primary/10 text-primary"
                                            onClick={() => setSelectedClient({ codigo: item.codigo, nome: item.nome_fantasia || item.nome })}
                                        >
                                            <Menu className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ClientTitlesModal
                clientCodigo={selectedClient?.codigo || null}
                clientNome={selectedClient?.nome}
                onClose={() => setSelectedClient(null)}
            />
        </>
    )
}
