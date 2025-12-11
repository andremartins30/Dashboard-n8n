"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs } from "@/components/ui/tabs"

interface DashboardTabsProps extends React.ComponentProps<typeof Tabs> {
    defaultTab?: string
    children: React.ReactNode
    className?: string
}

export function DashboardTabs({ children, defaultTab = "vencidos", ...props }: DashboardTabsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentTab = searchParams.get("tab") || defaultTab

    const onTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", value)
        params.delete("page") // Reset pagination when switching tabs
        router.push(`/?${params.toString()}`)
    }

    return (
        <Tabs value={currentTab} onValueChange={onTabChange} {...props}>
            {children}
        </Tabs>
    )
}
