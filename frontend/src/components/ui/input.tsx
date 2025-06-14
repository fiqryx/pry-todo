import React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { wrapperClassName?: string }

const renderIcon = (children: React.ReactNode) => {
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const displayName = (child.type as React.ComponentType)?.displayName;

      if (displayName === 'InputIcon') {
        return {
          child,
          props: child.props as React.ComponentProps<typeof InputIcon>
        }
      }
    }
  })?.[0]
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    const icon = renderIcon(children)

    if (icon) {
      return (
        <div
          className={cn(
            'group flex items-center gap-2 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-within:ring-1 focus-within:ring-ring',
            wrapperClassName
          )}
        >
          {icon.props.position === 'left' && icon.child}
          <input
            ref={ref}
            {...props}
            className={cn(
              'w-full bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
          />
          {icon.props.position === 'right' && icon.child}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    )
  }
)
Input.displayName = "Input"


type IconProps = {
  children: React.ReactNode
  position: 'left' | 'right'
}

const InputIcon = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"span"> & IconProps
>(
  ({ children, className, ...props }, ref) => {
    if (typeof children === "string") {
      return (
        <div
          {...props}
          ref={ref}
          className={cn('text-muted-foreground', className)}
        >
          {children}
        </div>
      )
    }

    if (React.isValidElement(children)) {
      return (
        <div
          {...props}
          ref={ref}
          className={cn('text-muted-foreground', className)}
        >
          {children}
        </div>
      )
    }

    console.error("Invalid type for `children` prop in Icon:", children);
    return null;
  }
)
InputIcon.displayName = "InputIcon"

interface InputMaxIndicatorProps extends
  React.ComponentProps<'div'> {
  max: number
  value: number
  align?: 'start' | 'end'
}

const InputMaxIndicator = React.forwardRef<
  HTMLDivElement,
  InputMaxIndicatorProps
>(({ max, value, align = 'end', className, children, ...props }, ref) => (
  <div ref={ref} {...props} className={cn('flex gap-2', className)}>
    {align === 'start' && (
      <span className="text-xs text-end text-muted-foreground">
        {value}/{max}
      </span>
    )}
    <div>{children}</div>
    {align === 'end' && (
      <span className="text-xs text-end text-muted-foreground">
        {value}/{max}
      </span>
    )}
  </div>
))

export {
  Input,
  InputIcon,
  InputMaxIndicator
}
