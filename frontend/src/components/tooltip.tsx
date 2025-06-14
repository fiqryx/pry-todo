'use client'
import React from 'react'

import {
    Tooltip as TooltipX,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface Tooltip extends
    React.ComponentProps<typeof TooltipContent> {
    label?: React.ReactNode
}

const Tooltip = React.forwardRef<HTMLDivElement, Tooltip>(
    ({ label, children, className, ...props }, ref) => (
        <TooltipProvider>
            <TooltipX>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                {label && (
                    <TooltipContent
                        ref={ref}
                        side="bottom"
                        suppressHydrationWarning
                        {...props}
                        className={cn('bg-accent text-accent-foreground', className)}
                    >
                        {label}
                    </TooltipContent>
                )}
            </TooltipX>
        </TooltipProvider>
    )
)
Tooltip.displayName = "Tooltip"

export { Tooltip }