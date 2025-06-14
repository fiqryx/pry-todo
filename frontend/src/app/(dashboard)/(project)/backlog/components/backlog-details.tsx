'use client'
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { Icons } from "@/components/icons";
import { Issue } from "@/types/schemas/issue";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { RealTimeAgo } from "@/components/time-ago";
import { Separator } from "@/components/ui/separator";

import { useProject } from "@/stores/project";
import { useTranslation } from "react-i18next";
import { Attachment } from "@/components/attachment";
import { AddItemDropdown } from "./backlog-dropdowns";
import { useIssues, useIssueItems } from "../use-issue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IssueDropdown } from "@/components/issue-dropdown";
import { IssueActivity } from "@/components/issue-activity";
import { Translate, translateText } from "@/components/translate";
import { InputEditor, InputTiptapEditor } from "@/components/input-editor";
import { IssueItem, IssueItemType } from "@/types/schemas/issue-item";
import { createIssueItem, deleteIssueItem } from "@/lib/services/issue-item";
import { cloudinaryUpload, deleteCloudinary } from "@/lib/services/cloudinary";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BacklogChildTable, BacklogDetailTable, WrtieIssueItemTable } from "./backlog-table";
import { useEffect, useState, useMemo, useCallback, createContext, useContext } from "react";
import { Download, EllipsisIcon, FileIcon, Link2Icon, Scaling, Trash2, XIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const IssueContext = createContext<Issue | null>(null);

export const useIssueContext = () => {
    const context = useContext(IssueContext);
    if (!context) {
        throw new Error("Components must be used within a issue provider.")
    }
    return context
}

interface BacklogDetailProps {
    issue: Issue
}

export function BacklogDetail({ issue }: BacklogDetailProps) {
    const setIssues = useIssues()[1];

    const { t } = useTranslation();
    const { active, checkPermission } = useProject();

    const [desc, setDesc] = useState(issue.description);
    const [issueItems, setIssueItems] = useIssueItems()
    const [tempLinks, setTempLinks] = useState<Partial<IssueItem>[]>([]);

    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);
    const levelEditor = useMemo(() => checkPermission('editor'), [active]);

    const items = useMemo(() => {
        return issueItems.reduce((acc, component) => {
            const { type } = component;
            if (!acc[type]) acc[type] = [];
            acc[type].push(component);
            return acc;
        }, {} as Record<IssueItemType, typeof issueItems>);
    }, [issueItems]);

    const uploadAttachment = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!levelAdmin) return;
            const files = e.target.files;
            if (!files || files.length === 0) {
                logger.debug('No files selected');
                return;
            }
            try {
                const file = files[0];
                logger.debug("uploading attachment", file)
                const result = await cloudinaryUpload(file, 'attachments')
                const { data, error } = await createIssueItem(issue.id, {
                    type: 'attachment',
                    url: result.secure_url,
                    publicId: result.public_id,
                    assetId: result?.asset_id,
                    text: file.name
                })
                if (!data) throw error;
                setIssueItems(prev => [data, ...prev]);
                toast.success("Attachment has been added");
            } catch (e: any) {
                logger.debug(e);
                toast.error(e?.message || "An unexpected error occurred");
            }
        },
        [issue.id]
    );

    const saveLink = useCallback(
        (type: IssueItemType) => async (up: Partial<IssueItem>, idx: number) => {
            if (!levelAdmin) return;
            if (!up.url || !up.text) {
                const missing = [];
                if (!up.url) missing.push('Url');
                if (!up.text) missing.push('Text');
                toast.error(`Missing required fields: ${missing.join(', ')}`);
                return;
            }

            try {
                const values = { ...up } as IssueItem;
                const { data, error } = await createIssueItem(issue.id, values);
                if (!data) throw error;
                setIssueItems(prev => [data, ...prev]);
                setTempLinks(prev => prev.filter((_, i) => i !== idx));
                toast.success(`${type === 'web_link' ? 'Web link' : 'Link work'} has been added`);
            } catch (e: any) {
                logger.debug(e);
                toast.error(e?.message || "An unexpected error occurred");
            }
        },
        [issue.id]
    )

    const deleteItem = useCallback(
        (item: IssueItem, issueId: string | number) => async () => {
            if (!levelAdmin) return;
            if (typeof issueId === 'number') {
                setTempLinks(prev => prev.filter((_, i) => i !== issueId));
                return;
            }
            try {
                if (item.publicId) await deleteCloudinary(item.publicId); // ignore fail
                const { error } = await deleteIssueItem(item.id, issueId);
                if (error) throw error;
                setIssueItems((prev) => prev.filter(v => v.id !== item.id));
                toast.success("Item has been deleted");
            } catch (e: any) {
                logger.debug(e);
                toast.error(e?.message || "An unexpected error occurred");
            }
        },
        [],
    )

    return (
        <IssueContext.Provider value={issue}>
            <div className="sticky top-0 bg-background border-b z-10 p-4">
                <SheetClose asChild>
                    <Button size="icon" variant="ghost" className="absolute right-2 top-2 size-6">
                        <XIcon className="size-4" />
                    </Button>
                </SheetClose>
                <InputEditor
                    value={issue.title}
                    className="text-lg font-semibold text-foreground h-8 mb-2"
                    disabled={!levelEditor || issue?.status === 'done'}
                    onValueChange={(title) => setIssues({ ...issue, title: title as string })}
                />
                <div className="flex justify-between gap-2">
                    <div className="flex gap-2">
                        {levelAdmin && (
                            <AddItemDropdown
                                side="bottom"
                                align="start"
                                onAttacmentChange={uploadAttachment}
                                onAddWebLink={() =>
                                    setTempLinks(prev => [
                                        ...prev,
                                        { issueId: issue.id, type: 'web_link' }
                                    ])
                                }
                            />
                        )}
                    </div>
                    <IssueDropdown issue={issue} name="status" side="bottom" align="end" onValueChange={setIssues} />
                </div>
            </div>

            <div className="grid gap-4 h-min p-4 pt-0">
                <div className="flex flex-col gap-1">
                    <Translate t={t} value="description" className="capitalize text-xs font-semibold" />
                    <InputTiptapEditor
                        autoHide
                        value={desc ?? undefined}
                        placeholder={translateText(t, 'add.description', { capitalize: true })}
                        onChange={setDesc}
                        onSave={(value) => {
                            if (value !== issue.description) {
                                setIssues({ ...issue, description: value });
                            }
                        }}
                        onCancel={() => setDesc(issue.description)}
                    />
                </div>
                <Separator />

                {items.attachment?.length > 0 && (
                    <>
                        <div className="flex flex-col gap-1">
                            <Translate t={t} as="h3" value="attachment.count" className="text-xs font-semibold">
                                ({items.attachment?.length ?? 0})
                            </Translate>
                            <ScrollArea>
                                <div className="grid grid-cols-2 sm:grid-cols-3 w-full place-content-between h-full max-h-72 gap-2">
                                    {items.attachment?.map((item, idx) => (
                                        <Attachment
                                            key={idx}
                                            src={item.url}
                                            label={item.text}
                                            className="size-35"
                                            disabledDelete={!levelAdmin}
                                            onDelete={deleteItem(item, issue.id)}
                                            description={format(item.createdAt, "LLL dd, y HH:mm")}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <Separator />
                    </>
                )}

                {(items.web_link || tempLinks)?.length > 0 && (
                    <>
                        <div className="flex flex-col gap-1">
                            <Translate t={t} as="h3" value="web.link.count" className="text-xs font-semibold">
                                ({items.web_link?.length ?? 0})
                            </Translate>
                            <div className="grid gap-2">
                                {items.web_link?.map((item, idx) => (
                                    <LinkView
                                        key={idx}
                                        src={item.url}
                                        label={item.text}
                                        enableDelete={levelAdmin}
                                        onDelete={deleteItem(item, item.issueId)}
                                    />
                                ))}
                            </div>
                            <WrtieIssueItemTable
                                onSave={saveLink('web_link')}
                                onUpdate={(updates, idx) => {
                                    setTempLinks((prev) => prev.map((item, i) =>
                                        i === idx ? { ...item, ...updates } : item
                                    ))
                                }}
                                onRemove={(i, id) => deleteItem(i as IssueItem, id)}
                                records={tempLinks}
                            />
                        </div>
                        <Separator />
                    </>
                )}

                <BacklogChildTable />
                <Separator />

                <div className="flex flex-col gap-1">
                    <Translate t={t} value="details" className="capitalize text-xs font-semibold" />
                    <BacklogDetailTable />

                    <Table className="text-xs text-muted-foreground mt-4">
                        <TableBody>
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell className="w-20 p-1">
                                    <Translate t={t} capitalize value="created" />
                                </TableCell>
                                <TableCell className="p-1">
                                    <RealTimeAgo date={issue.createdAt} options={{ showTime: true, format: 'absolute' }} />
                                </TableCell>
                            </TableRow>
                            <TableRow className="border-none hover:bg-transparent">
                                <TableCell className="w-20 p-1">
                                    <Translate t={t} capitalize value="updated" />
                                </TableCell>
                                <TableCell className="p-1">
                                    <RealTimeAgo date={issue.updatedAt} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <Separator />

                <IssueActivity issue={issue} className="gap-1 mb-12" />
            </div>
        </IssueContext.Provider>
    )
}

interface ItemViewProps extends
    React.ComponentProps<'div'> {
    src?: string
    label?: string
    description?: string
    enableDelete?: boolean
    onDelete?: () => Promise<void>
}

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];

const isImageSource = (src: string) => {
    return imageExtensions.some(ext => src.toLowerCase().endsWith(ext));
};

export function AttachmentView({
    src,
    label,
    description,
    className,
    enableDelete,
    onDelete,
    ...props
}: ItemViewProps) {
    const { t } = useTranslation();

    const [isOpen, setOpen] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [currentSource, setCurrentSource] = useState(src);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        setCurrentSource(src);
        setIsError(false);
    }, [src]);

    const handleError = () => {
        setIsError(true);
        setCurrentSource('/no-image-placeholder.png');
    };

    return (
        <>
            <div
                onClick={(e) => {
                    e.stopPropagation()
                    setIsPreviewOpen(true)
                }}
                className={cn('flex flex-col rounded-xl border group cursor-pointer w-[8rem] sm:w-full', className)}
                {...props}
            >
                <div className="relative flex justify-center items-center rounded-t-xl bg-muted h-24">
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
                                    e.stopPropagation()
                                    setIsPreviewOpen(true)
                                }}
                            >
                                <div className="flex items-center text-xs gap-3">
                                    <Scaling className="size-4" />
                                    <Translate t={t} value="view" className="capitalize" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!currentSource) return;
                                    const parts = currentSource.split('/upload/');
                                    const a = document.createElement('a');
                                    a.href = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
                                    a.download = label || currentSource.split('/').pop() || 'download';
                                    a.style.display = 'none';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                            >
                                <div className="flex items-center text-xs gap-3">
                                    <Download className="size-4" />
                                    <Translate t={t} value="download" className="capitalize" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    if (!currentSource) return
                                    try {
                                        await navigator.clipboard.writeText(currentSource);
                                        toast.success('Copied!');
                                    } catch (e) {
                                        logger.debug(e);
                                        toast.error('Failed to copy');
                                    }
                                }}
                            >
                                <div className="flex items-center text-xs gap-3">
                                    <Link2Icon className="size-4" />
                                    <Translate t={t} capitalize value="copy.link" />
                                </div>
                            </DropdownMenuItem>
                            {enableDelete && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsDeleteOpen(true)
                                    }}
                                >
                                    <div className="flex items-center text-xs gap-3">
                                        <Trash2 className="size-4" />
                                        <Translate t={t} value="delete" className="capitalize" />
                                    </div>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {currentSource && isImageSource(currentSource) && !isError ? (
                        <Image
                            fill
                            alt="cover"
                            src={currentSource}
                            className="rounded-t-xl object-cover w-full"
                            onError={handleError}
                            unoptimized={currentSource.endsWith('.svg')}
                        />
                    ) : <FileIcon className="text-muted-foreground size-6" />}
                </div>
                <div className="flex flex-col border-t text-xs p-2 gap-1">
                    <span title={label} className="max-w-28 truncate">{label}</span>
                    <span className="text-muted-foreground">{description}</span>
                </div>
            </div>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete this attachment?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your attachment.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            disabled={isLoading}
                            variant="destructive"
                            onClick={() => {
                                setLoading(true);
                                onDelete?.().finally(() => {
                                    setLoading(false);
                                    setIsDeleteOpen(false);
                                })
                            }}
                        >
                            {isLoading && <Icons.spinner className="animate-spin" />}
                            Delete
                        </Button>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent
                    className="bg-transparent border-none p-0 overflow-hidden max-w-none size-full"
                    onInteractOutside={(e) => e.preventDefault()}
                    classNames={{ close: 'text-white' }}
                >
                    <div className="flex items-center justify-center size-full">
                        {currentSource && isImageSource(currentSource) && !isError && (
                            <Image
                                width={300}
                                height={200}
                                unoptimized
                                alt="preview"
                                src={currentSource}
                                className="object-contain size-full max-w-[80vw] max-h-[80vh]"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export function LinkView({
    src,
    label,
    onDelete,
    className,
    enableDelete,
    ...props
}: ItemViewProps) {
    const [isLoading, setLoading] = useState(false);

    return (
        <div
            className={cn(
                'flex group items-center justify-between text-xs border border-input rounded-md p-2',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <Link2Icon className="size-5" />
                <a target="_blank" href={src} className="hover:underline">
                    {label}
                </a>
            </div>
            {enableDelete && (
                <Button
                    size="icon"
                    variant="outline"
                    disabled={isLoading}
                    className={`${isLoading ? 'flex' : 'hidden group-hover:flex'} size-5`}
                    onClick={() => {
                        setLoading(true);
                        onDelete?.().finally(() => setLoading(false));
                    }}
                >
                    {isLoading ? <Icons.spinner className="animate-spin" />
                        : <Trash2 className="size-4" />}
                </Button>
            )}
        </div>
    )
}