"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SortableHeaderProps {
    label: string
    value: string
    className?: string
}

export function SortableHeader({ label, value, className }: SortableHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentSort = searchParams.get("sort")
    const currentOrder = searchParams.get("order")

    const isSorted = currentSort === value
    const isAsc = currentOrder === "asc"

    const toggleSort = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (isSorted) {
            // Toggle order if already sorted by this column
            params.set("order", isAsc ? "desc" : "asc")
        } else {
            // New sort column, default to desc (usually better for dates/amounts)
            params.set("sort", value)
            params.set("order", "desc")
        }

        // Reset to page 1 when sorting changes
        params.set("page", "1")

        router.push(`/?${params.toString()}`)
    }

    return (
        <Button
            variant="ghost"
            onClick={toggleSort}
            className={cn("-ml-4 h-8 data-[state=open]:bg-accent", className)}
        >
            <span>{label}</span>
            {isSorted ? (
                isAsc ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                ) : (
                    <ArrowDown className="ml-2 h-4 w-4" />
                )
            ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
        </Button>
    )
}
