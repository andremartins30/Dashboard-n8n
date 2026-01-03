"use client"

import * as React from "react"
import { X, Loader2, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface Titulo {
    codigo: string
    nome: string
    numero_titulo: string
    parcela: string
    dt_emissao: string
    vencto_real: string
    vencto_real: string
    valor_titulo: number
    saldo: number
    filial_titulo: string
    prefixo: string
    tipo: string
    criado_em: string
    status: string
}

interface ClientTitlesModalProps {
    clientCodigo: string | null
    clientNome?: string
    onClose: () => void
}

export function ClientTitlesModal({ clientCodigo, clientNome, onClose }: ClientTitlesModalProps) {
    const [titulos, setTitulos] = React.useState<Titulo[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        if (clientCodigo) {
            setLoading(true)
            // Trava a rolagem do fundo
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleEsc)

            fetch(`/api/titulos-cliente?codigo=${clientCodigo}`)
                .then(res => res.json())
                .then(data => {
                    setTitulos(data)
                    setLoading(false)
                })
                .catch(err => {
                    console.error("Erro ao carregar títulos:", err)
                    setLoading(false)
                })
        }

        // Cleanup: retorna a rolagem e remove evento ao fechar ou desmontar
        return () => {
            document.body.style.overflow = 'unset'
            window.removeEventListener('keydown', handleEsc)
        }
    }, [clientCodigo, onClose])

    if (!clientCodigo) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border-primary/10 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <List className="h-5 w-5 text-primary" />
                            Títulos Vencidos
                        </CardTitle>
                        <CardDescription>
                            Detalhes financeiros do cliente {clientNome || clientCodigo}
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Carregando títulos...</p>
                        </div>
                    ) : titulos.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            Nenhum título vencido encontrado para este cliente.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background border-b z-10">
                                    <tr className="hover:bg-transparent">
                                        <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground">Título</th>
                                        <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground">Pref.</th>
                                        <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground">Tipo</th>
                                        <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground">Parcela</th>
                                        <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground">Vencimento</th>
                                        <th className="h-10 px-4 text-right align-middle font-semibold text-muted-foreground">Valor</th>
                                        <th className="h-10 px-4 text-right align-middle font-semibold text-muted-foreground">Saldo</th>
                                        <th className="h-10 px-4 text-center align-middle font-semibold text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {titulos.map((t, i) => (
                                        <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium">{t.numero_titulo}</td>
                                            <td className="p-4 align-middle">{t.prefixo}</td>
                                            <td className="p-4 align-middle">{t.tipo}</td>
                                            <td className="p-4 align-middle">{t.parcela}</td>
                                            <td className="p-4 align-middle">
                                                {new Date(t.vencto_real).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor_titulo)}
                                            </td>
                                            <td className="p-4 align-middle text-right font-semibold text-destructive">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.saldo)}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'Vencido Ontem'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    : 'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
                <div className="p-4 border-t bg-muted/10 flex justify-end">
                    <Button onClick={onClose} variant="outline">Fechar</Button>
                </div>
            </Card>
        </div>
    )
}
