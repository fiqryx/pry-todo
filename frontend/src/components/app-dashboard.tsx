"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app"

import ToogleLocale from "./toggle-locale"
import { ToggleTheme } from "./toggle-theme"
import { Resize } from "@/components/ui/resize"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { ToggleNotification } from "./toggle-notification"

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"


export type Breadcrumb = {
    label: string
    href?: string
}

export interface DashboardProps extends
    React.HtmlHTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode
    className?: string
    breadcrumb?: Breadcrumb[]
    breadcrumbSparator?: React.ReactNode
}

export function Dashboard({
    children,
    className,
    breadcrumbSparator,
    breadcrumb,
    ...props
}: DashboardProps) {
    const appStore = useAppStore();
    const [disableTransition, setDisableTransition] = React.useState(false)

    const sidebarWidth = React.useMemo(() => {
        if (typeof document === 'undefined') return 16;

        const rootFontSize = parseFloat(
            getComputedStyle(document.documentElement).fontSize
        );

        return appStore.sidebar_width / rootFontSize;
    }, [appStore.sidebar_width])

    const onSizeChange = React.useCallback((size: number) => {
        const width = Math.min(size, 500); // max sidebar_width 500
        const sidebar_open = width >= 160; // min sidebar_width 160

        appStore.set({
            sidebar_open,
            sidebar_width: sidebar_open ? width : 160
        })
    }, [])

    return (
        <SidebarProvider
            open={appStore.sidebar_open}
            onOpenChange={(sidebar_open) => appStore.set({ sidebar_open })}
            style={
                {
                    "--sidebar-width": `${sidebarWidth}rem`,
                    "--sidebar-width-mobile": "20rem",
                } as React.CSSProperties
            }
        >
            <AppSidebar disableTransition={disableTransition} />
            <Resize
                size={appStore.sidebar_width}
                onEnter={setDisableTransition}
                onSizeChange={onSizeChange}
            />
            <SidebarInset>
                <header className="sticky top-0 flex h-16 shrink-0 justify-between items-center px-4 gap-2 bg-background z-50 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <ToggleTheme className="hidden" />
                        <ToggleNotification />
                        <Separator orientation="vertical" className="hidden xsm:flex mx-1 h-4" />
                        <ToogleLocale />
                    </div>
                </header>
                {breadcrumb?.length && (
                    <div className="flex p-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumb?.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href={item.href}>
                                                {item.label}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        {idx < breadcrumb.length - 1 && (
                                            <BreadcrumbSeparator className='hidden md:block'>
                                                {breadcrumbSparator}
                                            </BreadcrumbSeparator>
                                        )}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                )}
                <div {...props} className={cn('flex flex-1 flex-col gap-4 p-4', className)}>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
