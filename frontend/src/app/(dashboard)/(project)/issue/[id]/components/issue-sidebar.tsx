'use client'
import { cn } from '@/lib/utils'
import { PanelRight } from "lucide-react";
import { useProject } from '@/stores/project';
import { Fragment, useMemo, useEffect } from "react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { IssueSidebarContent } from './issue-sidebar-content';

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar
} from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

const styles = {
    "--sidebar-width": `24rem`,
    "--sidebar-width-mobile": "20rem",
} as React.CSSProperties

export function IssueSidebar({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SidebarProvider>) {
    const { active } = useProject();
    const { open } = useSidebar();

    const breadcrumb = useMemo(() => [
        { label: 'Project', url: '#' },
        { label: active?.name, url: '#' },
    ], [active]);

    useEffect(() => {
        if (!active) return
        document.title = `Issue - ${active.name}`;
    }, [active]);

    return (
        <SidebarProvider {...props} style={styles} className='h-[calc(100vh-4rem)] min-h-0 overflow-hidden'>
            <SidebarInset className='flex flex-col h-full overflow-hidden'>
                <header className="border-b flex h-12 sm:h-16 shrink-0 items-center justify-between gap-2 p-4">
                    <div className="flex flex-col gap-1">
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumb?.map((item, idx) => (
                                    <Fragment key={idx}>
                                        <BreadcrumbItem className="hidden md:block hover:underline">
                                            <BreadcrumbLink href={item.url}>
                                                {item.label}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        {idx < breadcrumb.length - 1 && (
                                            <BreadcrumbSeparator className='hidden md:block'>
                                                /
                                            </BreadcrumbSeparator>
                                        )}
                                    </Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">
                            Issue
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className='rounded-sm'>
                            <PanelRight />
                        </SidebarTrigger>
                    </div>
                </header>
                <div className="flex-1 overflow-hidden mb-16">
                    <ScrollArea className="h-full w-full">
                        <div className={cn(
                            'flex flex-col w-full max-w-sm mx-auto gap-4',
                            open
                                ? 'md:max-w-md lg:max-w-[calc(100vw-var(--sidebar-width)-18rem)]'
                                : 'md:max-w-2xl lg:max-w-7xl',
                            className
                        )}>
                            {children}
                        </div>
                    </ScrollArea>
                </div>
            </SidebarInset>
            <IssueSidebarContent side='right' className="inset-y-auto h-full" />
        </SidebarProvider>
    )
}