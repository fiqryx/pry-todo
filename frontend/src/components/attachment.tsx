'use client'
import Image from "next/image";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Translate } from "@/components/translate";

import { forwardRef, useState, useEffect, useCallback, useMemo } from "react"
import { Download, EllipsisIcon, FileIcon, Expand, Link2Icon, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const images = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];

interface AttachmentProps extends
    React.ComponentProps<'div'> {
    src?: string
    label?: string
    description?: string
    disabledDelete?: boolean
    onDelete?: () => Promise<void>
}

const Attachment = forwardRef<
    HTMLDivElement,
    AttachmentProps
>(({ src, label, description, onDelete, className, disabledDelete, ...props }, ref) => {
    const { t } = useTranslation();

    const [isOpen, setOpen] = useState(false);
    const [isError, setError] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [source, setSource] = useState(src);
    const [openPreview, setOpenPreview] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    const isImage = useMemo(() => source ?
        images.some(ext => source.toLowerCase().endsWith(ext)) : false,
        [source]
    );

    const handleError = useCallback(() => {
        setError(true);
        setSource('/no-image-placeholder.png');
    }, []);

    const handleCopy = useCallback(
        async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.stopPropagation()
            if (!source) return
            try {
                await navigator.clipboard.writeText(source);
                toast.success('Copied!');
                // eslint-disable-next-line
            } catch (e) {
                toast.error('Failed to copy');
            }
        },
        [source]
    );

    const handleDonwload = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.stopPropagation();
            if (!source) return;
            const parts = source.split('/upload/');
            const a = document.createElement('a');

            a.href = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
            a.download = label || source.split('/').pop() || 'download';
            a.style.display = 'none';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        [source]
    );

    useEffect(() => {
        setSource(src);
        setError(false);
    }, [src]);

    return (
        <>
            <div
                ref={ref}
                {...props}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpenPreview(true);
                }}
                className={cn(
                    'flex flex-col rounded-xl border group cursor-pointer h-full size-20 xsm:w-full',
                    className
                )}
            >
                <div className="relative flex justify-center items-center rounded-t-xl bg-muted h-full">
                    <DropdownMenu open={isOpen} onOpenChange={setOpen}>
                        <DropdownMenuTrigger asChild>
                            <div className="absolute top-1 right-1 z-10">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        'size-6 bg-background/50 backdrop-blur-xs',
                                        isOpen ? 'flex' : 'hidden group-hover:flex'
                                    )}
                                >
                                    <EllipsisIcon className="size-4" />
                                </Button>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="bottom">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPreview(true);
                                }}
                            >
                                <div className="flex items-center text-xs gap-3">
                                    <Expand className="size-4" />
                                    <Translate t={t} capitalize value="view" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDonwload}>
                                <div className="flex items-center text-xs gap-3">
                                    <Download className="size-4" />
                                    <Translate t={t} capitalize value="download" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopy}>
                                <div className="flex items-center text-xs gap-3">
                                    <Link2Icon className="size-4" />
                                    <Translate t={t} capitalize value="copy.link" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={disabledDelete}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDelete(true);
                                }}
                            >
                                <div className="flex items-center text-xs gap-3">
                                    <Trash2 className="size-4" />
                                    <Translate t={t} capitalize value="delete" />
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {source && isImage && !isError ? (
                        <Image
                            fill
                            alt="cover"
                            src={source}
                            className="rounded-t-xl object-cover size-full"
                            onError={handleError}
                            unoptimized={source.endsWith('.svg')}
                        />
                    ) : <FileIcon className="text-muted-foreground size-6" />}
                </div>
                <div className="flex flex-col border-t text-xs p-2 gap-1">
                    <span title={label} className="line-clamp-1">{label}</span>
                    <span className="text-muted-foreground">{description}</span>
                </div>
            </div>

            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <Translate t={t} as={DialogTitle} value="delete.attachment" />
                        <Translate t={t} as={DialogDescription} value="delete.attachment.description" />
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            size="sm"
                            disabled={isLoading}
                            variant="destructive"
                            className="rounded-md"
                            onClick={() => {
                                setLoading(true);
                                onDelete?.().finally(() => {
                                    setLoading(false);
                                    setOpenDelete(false);
                                })
                            }}
                        >
                            {isLoading && <span className="loading loading-xs loading-spinner" />}
                            <Translate t={t} capitalize value="delete" />
                        </Button>
                        <DialogClose asChild>
                            <Button size="sm" variant="secondary" className="rounded-md">
                                <Translate t={t} capitalize value="cancel" />
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                <DialogContent
                    className="bg-transparent border-none p-0 overflow-hidden max-w-none size-full"
                    onInteractOutside={(e) => e.preventDefault()}
                    classNames={{ close: 'text-white' }}
                >
                    <div className="flex items-center justify-center size-full">
                        {source && isImage && !isError && (
                            <Image
                                width={300}
                                height={200}
                                unoptimized
                                alt="preview"
                                src={source}
                                className="object-contain size-full max-w-[80vw] max-h-[80vh]"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
});
Attachment.displayName = "Attachment"

export {
    Attachment
}