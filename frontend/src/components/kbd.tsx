import React from 'react'
import { cn } from "@/lib/utils";

const Kbd = React.forwardRef<HTMLElement, React.ComponentProps<'kbd'>>(
    ({ children, className, ...props }, ref) => (
        <kbd
            ref={ref}
            {...props}
            className={cn(
                'rounded bg-accent text-accent-foreground font-light p-1',
                className
            )}
        >
            {children}
        </kbd>
    )
);
Kbd.displayName = "Kbd"

export { Kbd }