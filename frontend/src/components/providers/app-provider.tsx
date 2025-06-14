"use client"

import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { colors } from "@/config/colors"

import { useAppStore } from "@/stores/app"
import { usePathname } from "next/navigation"
import { Loading } from "@/components/ui/loading"

export function AppProvider({ children }: React.PropsWithChildren) {
    const pathname = usePathname()
    const appStore = useAppStore()

    useEffect(() => {
        if (!appStore.initialize) {
            appStore.init()
        }
    }, [pathname])

    useEffect(() => {
        const root = window.document.body;

        for (const value in colors) {
            const matcher = value + '-';
            const color = appStore.color[value as keyof typeof colors]
            const current = Array.from(root.classList).find((className) =>
                className.startsWith(matcher)
            )

            if (current) {
                root.classList.remove(current);
            }

            if (color && color !== 'default') {
                root.classList.add(`${matcher}${color}`);
            }
        }
    }, [appStore.color])

    if (appStore.loading && !appStore.overlay) {
        return (
            <Loading
                variant={cn({
                    'spinner': appStore.loading_message
                }) as 'dots'}
            >
                <span className="text-xs text-muted-foreground">
                    {appStore.loading_message}
                </span>
            </Loading>
        )
    }

    return (
        <>
            {children}
            {appStore.loading && appStore.overlay && (
                <Loading
                    variant={cn({
                        'spinner': appStore.loading_message
                    }) as 'dots'}
                    className="fixed flex flex-col items-center justify-center top-0 w-full h-screen z-50 overflow-hidden bg-black/70 text-white gap-4"
                >
                    <span className="text-sm">
                        {appStore.loading_message}
                    </span>
                </Loading>
            )}
        </>
    )
}