'use client'
import { toast } from "sonner";
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger";
import { useCallback, useMemo } from "react";
import { useProject } from "@/stores/project"
import { useIssue, useIssueItems } from "../use-issue";

import { IssueAttachment } from "./issue-attachment";
import { InputEditor } from "@/components/input-editor";
import { IssueDescription } from "./issue-description";
import { IssueItem, IssueItemType } from "@/types/schemas/issue-item";
import { IssueWebLink } from "./issue-web-link";
import { deleteCloudinary } from "@/lib/services/cloudinary";
import { deleteIssueItem } from "@/lib/services/issue-item";
import { IssueChilds } from "./issue-childs";
import { IssueActivity } from "@/components/issue-activity";

export function IssueContent({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { issue, onUpdateIssue } = useIssue();
    const [issueItems, setIssueItems] = useIssueItems();

    const { active, checkPermission } = useProject();
    const levelEditor = useMemo(() => checkPermission('editor'), [active]);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const items = useMemo(() => {
        return issueItems.reduce((acc, component) => {
            const { type } = component;
            if (!acc[type]) acc[type] = [];
            acc[type].push(component);
            return acc;
        }, {} as Record<IssueItemType, typeof issueItems>);
    }, [issueItems]);

    const onDeleteItem = useCallback(async (item: IssueItem) => {
        if (!levelAdmin || !issue) return;
        try {
            if (item.publicId) await deleteCloudinary(item.publicId);
            const { error } = await deleteIssueItem(item.id, issue.id);
            if (error) {
                throw new Error(error);
            }
            setIssueItems((prev) => prev.filter(v => v.id !== item.id))
            toast.success("Delete successfully");
        } catch (e: any) {
            logger.debug(e);
            toast.error(e?.message || "An unexpected error occurred");
        }
    }, [issue, levelAdmin]);

    return (
        <div
            {...props}
            className={cn(
                'flex flex-col gap-4 p-4',
                className
            )}
        >
            <div className="flex flex-wrap lg:flex-nowrap justify-between w-full items-end gap-4">
                <InputEditor
                    value={issue?.title}
                    className="text-lg font-semibold text-foreground h-8"
                    disabled={!levelEditor}
                    onValueChange={(title) => onUpdateIssue({ title: title as string })}
                />
            </div>
            <IssueDescription disabled={!levelEditor} />
            <IssueAttachment
                items={items.attachment}
                disabled={!levelAdmin}
                onValueChange={(item) => setIssueItems(prev => [item, ...prev])}
                onDelete={onDeleteItem}
            />
            <IssueWebLink
                items={items.web_link}
                disabled={!levelAdmin}
                onValueChange={(item) => setIssueItems(prev => [item, ...prev])}
                onDelete={onDeleteItem}
            />
            <IssueChilds disabled={!levelAdmin} />
            {issue && <IssueActivity issue={issue} />}
        </div>
    )
}