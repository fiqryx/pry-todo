'use client'
import React, { useCallback, useState } from "react"
import Link from "next/link";
import { Issue } from "@/types/schemas/issue";
import { useProject } from "@/stores/project";
import { ColumnDef } from "@tanstack/react-table";
import { useIssue, useIssueChilds } from "../use-issue";
import { IssueActionMenu, IssueDropdown, UserAvatarDropdown } from "@/components/issue-dropdown";
import { DataTableClassNames, DataTableColumnHeader } from "@/components/ui/data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IssueFormDialog } from "@/components/issue-dialog";
import { format } from "date-fns";

export const tableConfig: DataTableClassNames = {
    header: 'bg-sidebar',
    headerCell: 'border-x',
    headerRow: 'hover:bg-transparent',
    bodyCell: 'border-x py-0 content-center',
    placeholder: 'h-10 text-xs'
}

export const columns: ColumnDef<Issue>[] = [
    {
        size: 300,
        accessorKey: 'title',
        meta: { columnName: 'Name' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
            <Link
                href={`/issue/${row.original.id}`}
                className="line-clamp-1 w-fit text-sm hover:text-primary hover:underline"
            >
                {row.getValue('title')}
            </Link>
        )
    },
    {
        size: 100,
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="type"
                issue={row.original}
                excludes={['task']}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 100,
        accessorKey: 'priority',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="priority"
                issue={row.original}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 200,
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="status"
                issue={row.original}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 100,
        minSize: 50,
        accessorKey: 'startDate',
        meta: { columnName: 'Start date' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start date" />,
        cell: ({ row }) => {
            const startDate = row.original.startDate;
            return startDate ? format(startDate, 'MMMM dd, y') : '-'
        }
    },
    {
        size: 100,
        minSize: 50,
        accessorKey: 'dueDate',
        meta: { columnName: 'Due date' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due date" />,
        cell: ({ row }) => {
            const dueDate = row.original.dueDate;
            return dueDate ? format(dueDate, 'MMMM dd, y') : '-'
        }
    },
    {
        size: 200,
        accessorKey: 'assignee',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
        cell: ({ row }) => {
            const setIssues = useIssueChilds()[1];

            return (
                <UserAvatarDropdown
                    size="sm"
                    className="w-full"
                    value={row.original.assigneeId}
                    onValueChange={(value) => {
                        setIssues({ ...row.original, assigneeId: value })
                    }}
                />
            )
        }
    },
    {
        size: 10,
        minSize: 10,
        id: 'actions',
        enableResizing: false,
        enableHiding: false,
        cell: ({ row, table }) => {
            const { issue } = useIssue();
            const { checkPermission } = useProject();
            const setIssuesChilds = useIssueChilds()[1];
            const [openDialog, setOpenDialog] = useState(false);

            const total = table.getRowCount();
            const levelEditor = checkPermission('editor');

            const onMoveOrDelete = useCallback((value: Issue) => {
                setIssuesChilds((prev) => prev.filter(v => v.id !== value.id))
            }, [setIssuesChilds]);

            const handleSave = useCallback((issue: Issue) => {
                setIssuesChilds((prev) =>
                    prev.some(v => v.id === issue.id)
                        ? prev.map(t => t.id === issue.id ? issue : t)
                        : [...prev, issue]
                );
            }, [setIssuesChilds]);

            return (
                <div className="w-full text-center">
                    <IssueActionMenu
                        align="end"
                        className="w-48"
                        index={row.index}
                        count={total}
                        issue={row.original}
                        options={[]}
                        disabled={!levelEditor}
                        onDelete={onMoveOrDelete}
                        onRemoveParent={onMoveOrDelete}
                        onMoveOrder={(values) => setIssuesChilds(() => values)}
                        onMoveParent={(value) => setIssuesChilds(
                            (prev) => prev.filter(v => v.id !== value.id)
                        )}
                    >
                        <DropdownMenuItem hidden={!levelEditor} onClick={() => setOpenDialog(!openDialog)}>
                            Edit
                        </DropdownMenuItem>
                    </IssueActionMenu>

                    <IssueFormDialog
                        open={openDialog}
                        onOpenChange={setOpenDialog}
                        issue={row.original}
                        parentId={issue?.id}
                        disabled={!levelEditor}
                        excludeType={['task']}
                        defaultType="subtask"
                        onSave={handleSave}
                    />
                </div>
            )
        }
    }
]