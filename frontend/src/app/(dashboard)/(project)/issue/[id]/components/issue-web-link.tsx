'use client'
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn, omit } from '@/lib/utils';
import { useIssue } from '../use-issue';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IssueItem } from '@/types/schemas/issue-item';
import { useCallback, useMemo, useState } from 'react';
import { createIssueItem } from '@/lib/services/issue-item';
import { BanIcon, Link2, PlusIcon, SaveIcon, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const generateId = () => `temp_${Math.random().toString(36).substring(2, 9)}`;

interface IssueWebLinkProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
    items?: IssueItem[]
    onValueChange?: (item: IssueItem) => void
    onDelete: (item: IssueItem) => Promise<void>
}

export function IssueWebLink({
    items,
    disabled,
    className,
    onValueChange,
    onDelete,
    ...props
}: IssueWebLinkProps) {
    const { issue } = useIssue();
    const [temps, setTemps] = useState<Partial<IssueItem>[]>([]);
    const isEmpty = useMemo(() => !items?.length && !temps.length, [items, temps]);

    const onSave = useCallback(
        async (item: Partial<IssueItem>) => {
            if (disabled || !issue) return;
            if (!item.url || !item.text) {
                const missing = [];
                if (!item.url) missing.push('url');
                if (!item.text) missing.push('description');
                toast.error(`Missing required fields: ${missing.join(', ')}`);
                return;
            }

            try {
                const { data, error } = await createIssueItem(issue.id, omit(item, 'id') as IssueItem);
                if (!data) {
                    throw new Error(error);
                }
                onValueChange?.(data);
                setTemps(prev => prev.filter(v => v.id !== item.id));
                toast.success('Web link has been added');
            } catch (e: any) {
                logger.debug("failed save web_link:", e);
                toast.error(e?.message || "An unexpected error occurred");
            }
        },
        [issue, temps, disabled],
    );

    return (
        <div
            {...props}
            className={cn('flex flex-col gap-2', className)}
        >
            <div className="flex items-center justify-between border rounded-sm py-1 px-2">
                <h3 className="text-xs font-semibold">
                    Web links ({items?.length ?? 0})
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className='size-6 rounded-sm [&_svg]:size-5'
                        onClick={() =>
                            setTemps(prev => [...prev, {
                                id: generateId(),
                                issueId: issue?.id,
                                type: 'web_link'
                            }])
                        }
                    >
                        <PlusIcon />
                    </Button>
                </div>
            </div>
            <div className="grid gap-1">
                {isEmpty && (
                    <span className='text-center text-xs text-muted-foreground p-1'>Empty</span>
                )}

                {items?.length && items.map((item) => (
                    <WebLink
                        key={item.id}
                        src={item.url}
                        label={item.text}
                        enableDelete={!disabled}
                        onDelete={() => onDelete(item)}
                        className={temps.some(v => v.id === item.id) ? 'hidden' : ''}
                    />
                ))}

                <AddWebLink
                    items={temps}
                    onSave={onSave}
                    onCancel={(item) => {
                        setTemps(prev => prev.filter(v => v.id !== item.id));
                    }}
                    onUpdate={(updates) => {
                        setTemps((prev) => prev.map((item) =>
                            item.id === updates.id ? { ...item, ...updates } : item
                        ))
                    }}
                />
            </div>
        </div>
    )
}

interface WebLinkProps extends
    React.ComponentProps<'div'> {
    src?: string
    label?: string
    description?: string
    enableDelete?: boolean
    onDelete?: () => Promise<void>
}

const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://')
        ? url : `https://${url}`;
};

export function WebLink({
    src,
    label,
    onDelete,
    className,
    enableDelete,
    ...props
}: WebLinkProps) {
    const [isLoading, setLoading] = useState(false);

    return (
        <div
            className={cn(
                'flex group items-center justify-between text-xs rounded-md hover:bg-accent hover:text-accent-foreground p-2',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-2">
                <Link2 className="size-5" />
                <a target="_blank" href={ensureAbsoluteUrl(src)} className="hover:underline">
                    {label}
                </a>
            </div>
            {enableDelete && (
                <Button
                    size="icon"
                    variant="outline"
                    disabled={isLoading}
                    className={`${isLoading ? 'flex' : 'hidden group-hover:flex'} size-5 rounded-sm`}
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

interface AddWebLinkProps extends
    React.ComponentProps<typeof Table> {
    items?: Partial<IssueItem>[]
    onSave?: (item: Partial<IssueItem>) => Promise<void>
    onUpdate: (item: Partial<IssueItem>) => void
    onCancel?: (item: IssueItem) => void
}

export function AddWebLink({
    onSave,
    onUpdate,
    onCancel,
    items = [],
    ...props
}: AddWebLinkProps) {
    const [isLoading, setLoading] = useState(false);

    return (
        <Table {...props}>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-transparent">
                        <TableCell>
                            <Input
                                max={60}
                                defaultValue={item.url}
                                placeholder="https://example.com"
                                className="outline-none focus-visible:ring-1 shadow-none rounded-sm"
                                onChange={(e) => onUpdate({ ...item, url: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setLoading(true);
                                        onUpdate({ ...item, url: e.currentTarget.value });
                                        onSave?.(item).finally(() => setLoading(false));
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                max={60}
                                defaultValue={item.text}
                                placeholder="Add a description"
                                className="outline-none focus-visible:ring-1 shadow-none rounded-sm"
                                onChange={(e) => onUpdate({ ...item, text: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setLoading(true);
                                        onUpdate({ ...item, text: e.currentTarget.value });
                                        onSave?.(item).finally(() => setLoading(false));
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell className="w-[5%] content-center">
                            <div className="inline-flex items-center gap-0.5">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={isLoading}
                                    className="size-6 rounded-sm"
                                    onClick={() => {
                                        setLoading(true);
                                        onSave?.(item).finally(() => setLoading(false));
                                    }}
                                >
                                    {isLoading ? <Icons.spinner className="animate-spin" /> : <SaveIcon />}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={isLoading}
                                    className="size-6 rounded-sm"
                                    onClick={() => onCancel?.(item as IssueItem)}
                                >
                                    <BanIcon />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}