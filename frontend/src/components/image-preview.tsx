'use client'
import { cn } from '@/lib/utils'
import { UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip } from './tooltip'

interface ImagePreviewProps extends
    React.ComponentProps<typeof Dialog> {
    src: string
    className?: string
    classNames?: {
        container?: string
        img?: string
    }
}

export function ImagePreview({
    src,
    className,
    classNames,
    ...props
}: ImagePreviewProps) {
    return (
        <Dialog {...props}>
            <DialogContent
                classNames={{ close: 'hidden' }}
                className={cn('sm:max-w-md bg-transparent border-none shadow-none focus:outline-none', className)}
            >
                <div className={cn('flex justify-center', classNames?.container)}>
                    <img
                        src={src}
                        alt="Preview"
                        className={cn('rounded-full w-64 h-64 object-cover', classNames?.img)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface AvatarWithPreviewProps extends
    React.ComponentProps<typeof Dialog> {
    asChild?: boolean
    src?: string
    alt?: string
    className?: string
    fallback?: React.ReactNode
    tooltip?: React.ReactNode
    tooltipSide?: "top" | "right" | "bottom" | "left"
    classNames?: {
        fallback?: string
        img?: string
        dialogClose?: string
        daialogContent?: string
        dialogImg?: string
        dialogContainer?: string
    }
}

export function AvatarWithPreview({
    asChild,
    src,
    alt,
    tooltip,
    tooltipSide,
    className,
    classNames,
    fallback,
    ...props
}: AvatarWithPreviewProps) {
    return (
        <Dialog {...props}>
            <DialogTrigger disabled={!src} asChild={asChild}>
                <Tooltip side={tooltipSide} label={tooltip}>
                    <Avatar className={className}>
                        <AvatarImage alt={alt} src={src} className={classNames?.img} />
                        <AvatarFallback className={cn('text-muted-foreground', classNames?.fallback)}>
                            {fallback || <UserIcon className='size-4 text-muted-foreground' />}
                        </AvatarFallback>
                    </Avatar>
                </Tooltip>
            </DialogTrigger>
            <DialogContent
                classNames={{ close: cn('hidden', classNames?.dialogClose) }}
                className={cn('sm:max-w-md bg-transparent border-none shadow-none focus:outline-none', classNames?.daialogContent)}
            >
                <div className={cn('flex justify-center', classNames?.dialogContainer)}>
                    <img
                        src={src}
                        alt="preview"
                        className={cn('rounded-full w-64 h-64 object-cover', classNames?.dialogImg)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}