'use client'
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { logger } from '@/lib/logger';
import { useIssue } from "../use-issue";
import { PlusIcon } from 'lucide-react';
import { Icons } from '@/components/icons';
import { useAppStore } from "@/stores/app";
import { useProject } from '@/stores/project';
import { Button } from '@/components/ui/button';
import { Attachment } from '@/components/attachment';
import { useCallback, useRef, useState } from 'react';
import { IssueItem } from '@/types/schemas/issue-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createIssueItem } from '@/lib/services/issue-item';
import { cloudinaryUpload } from '@/lib/services/cloudinary';

interface IssueAttactmentProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
    items?: IssueItem[]
    onValueChange?: (item: IssueItem) => void
    onDelete: (item: IssueItem) => Promise<void>
}

export function IssueAttachment({
    items,
    disabled,
    className,
    onValueChange,
    onDelete,
    ...props
}: IssueAttactmentProps) {
    const { issue } = useIssue();
    const { active } = useProject();
    const { sidebar_open } = useAppStore();

    const ref = useRef<HTMLInputElement>(null);
    const [isLoading, setLoading] = useState(false);

    const onUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled || !issue) return;
            setLoading(true);
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
                });
                if (!data) throw error;
                onValueChange?.(data);
                toast.success("Attachment has been added");
            } catch (e: any) {
                toast.error(e?.message || "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        },
        [disabled, issue]
    );

    return (
        <div
            {...props}
            className={cn('flex flex-col gap-2', className)}
        >
            <div className="flex items-center justify-between border rounded-sm py-1 px-2">
                <h3 className="text-xs font-semibold">
                    Attacments ({items?.length ?? 0})
                </h3>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className='size-6 rounded-sm [&_svg]:size-5'
                        disabled={isLoading || !active?.setting?.allowAttachments}
                        onClick={() => {
                            if (ref.current) {
                                ref.current.value = '';
                                ref.current.files = null;
                                ref.current.click();
                            }
                        }}
                    >
                        {isLoading ? <Icons.spinner className="animate-spin" /> : <PlusIcon />}
                    </Button>
                </div>
            </div>

            {!items?.length ? (
                <span className='text-center text-xs text-muted-foreground p-1'>Empty</span>
            ) : (
                <ScrollArea>
                    <div
                        className={cn(
                            'grid grid-cols-2 lg:grid-cols-7 xmax-w-xs w-full place-content-between gap-2 h-full max-h-96',
                            sidebar_open ? 'md:grid-cols-3' : 'md:grid-cols-4'
                        )}
                    >
                        {items?.map((item, idx) => (
                            <Attachment
                                key={idx}
                                src={item.url}
                                label={item.text}
                                className="size-40"
                                disabledDelete={disabled}
                                onDelete={() => onDelete(item)}
                                description={format(item.createdAt, "LLL dd, y HH:mm")}
                            />
                        ))}
                    </div>
                </ScrollArea>
            )}

            <input
                type="file"
                name="attachment"
                ref={ref}
                className="hidden"
                disabled={isLoading}
                onChange={onUpload}
            />
        </div>
    )
}