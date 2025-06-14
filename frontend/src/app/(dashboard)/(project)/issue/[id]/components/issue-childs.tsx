'use client'
import { cn } from "@/lib/utils"
import { useCallback } from "react";
import { PlusIcon } from "lucide-react";
import { Issue } from "@/types/schemas/issue";
import { Button } from "@/components/ui/button";
import { useIssue, useIssueChilds } from "../use-issue";
import { DataTable } from "@/components/ui/data-table";
import { columns, tableConfig } from "./issue-columns";
import { IssueFormDialog } from "@/components/issue-dialog";

interface IssueChildsProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
}

export function IssueChilds({
    disabled,
    className,
    ...props
}: IssueChildsProps) {
    const { issue } = useIssue();
    const [issuesChilds, setIssuesChilds] = useIssueChilds();

    const handleSave = useCallback((issue: Issue) => {
        setIssuesChilds((prev) =>
            prev.some(v => v.id === issue.id)
                ? prev.map(t => t.id === issue.id ? issue : t)
                : [...prev, issue]
        );
    }, [setIssuesChilds]);

    return (
        <div
            {...props}
            className={cn('flex flex-col gap-2', className)}
        >
            <div className="flex items-center justify-between border rounded-sm py-1 px-2">
                <h3 className="text-xs font-semibold">
                    Childs work
                </h3>
                <div className="flex items-center gap-1">
                    <IssueFormDialog
                        parentId={issue?.id}
                        disabled={disabled}
                        excludeType={['task']}
                        defaultType="subtask"
                        onSave={handleSave}
                    >
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                'size-6 rounded-sm [&_svg]:size-5',
                                disabled && 'pointer-events-none opacity-50'
                            )}
                        >
                            <PlusIcon />
                        </Button>
                    </IssueFormDialog>
                </div>
            </div>
            <DataTable
                resizeable
                suppressWidth
                columnControl
                height={300}
                data={issuesChilds}
                hideSelectedRows
                columns={columns}
                tableId="issue-childs-table"
                classNames={tableConfig}
                hideColumns={['startDate', 'dueDate']}
            />
        </div>
    )
}