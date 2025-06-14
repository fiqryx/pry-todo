"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const porgressVariant = cva(
  'relative h-2 w-full overflow-hidden rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-primary/20',
        muted: 'bg-muted-foreground/20',
        success: 'bg-success/20',
        warning: 'bg-warning/20',
        destructive: 'bg-destructive/20',
        purple: 'bg-purple-500/20'
      },
      size: {
        sm: 'h-1',
        default: 'h-2',
        lg: 'h-4'
      }
    },
    defaultVariants: {}
  }
);

export interface ProgressProps extends
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
  VariantProps<typeof porgressVariant> {
  classNameIndicator?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, classNameIndicator, size, variant, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(porgressVariant({ className, variant, size }))}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 transition-all',
        variant === 'default' && 'bg-primary',
        variant === 'muted' && 'bg-muted-foreground/50',
        variant === 'success' && 'bg-success',
        variant === 'warning' && 'bg-warning',
        variant === 'destructive' && 'bg-destructive',
        variant === 'purple' && 'bg-purple-500',
        classNameIndicator
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
