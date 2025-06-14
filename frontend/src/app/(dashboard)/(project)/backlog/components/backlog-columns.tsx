'use client'
import Link from "next/link";
import { format } from "date-fns";
import { useCallback, useState } from "react"
import { useProject } from "@/stores/project";
import { Issue } from "@/types/schemas/issue";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { BacklogEditor } from "./backlog-editor";
import { ColumnDef } from "@tanstack/react-table"
import { BacklogDetail } from "./backlog-details";
import { useIssueChilds, useIssues } from "../use-issue";
import { IssueFormDialog } from "@/components/issue-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Translate, translateText } from "@/components/translate";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { DataTableClassNames, DataTableColumnHeader } from "@/components/ui/data-table"
import { IssueActionMenu, IssueDropdown, UserAvatarDropdown } from "@/components/issue-dropdown";

type TRender<T> = {
    label: string
    render?: (value: T) => boolean
    children: React.ReactNode | ((value: T) => React.ReactNode)
}

export const tableConfig: DataTableClassNames = {
    header: 'bg-sidebar',
    bodyCell: 'border-x py-0 content-center',
}

export const tableChildConfig: DataTableClassNames = {
    placeholder: 'h-fit p-1',
    header: 'bg-sidebar',
    headerCell: 'text-xs',
    bodyCell: 'border-x py-0 content-center',
}

export const columns: ColumnDef<Issue>[] = [
    {
        size: 300,
        accessorKey: 'title',
        meta: { columnName: 'Name' },
        header: ({ column }) => {
            const { t } = useTranslation();
            return <DataTableColumnHeader column={column} title={translateText(t, 'name', { capitalize: true })} />
        },
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
        header: ({ column }) => {
            const { t } = useTranslation();
            return <DataTableColumnHeader column={column} title={translateText(t, 'type', { capitalize: true })} />
        },
        cell: ({ row }) => (
            <IssueDropdown
                name="type"
                issue={row.original}
                excludes={['subtask']}
                disabled={useIsMobile()}
                onValueChange={useIssues()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 100,
        accessorKey: 'priority',
        header: ({ column }) => {
            const { t } = useTranslation();

            return < DataTableColumnHeader column={column} title={translateText(t, 'priority', { capitalize: true })} />
        },
        cell: ({ row }) => (
            <IssueDropdown
                name="priority"
                issue={row.original}
                disabled={useIsMobile()}
                onValueChange={useIssues()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 200,
        accessorKey: 'status',
        header: ({ column }) => {
            const { t } = useTranslation();

            return <DataTableColumnHeader column={column} title={translateText(t, 'status', { capitalize: true })} />
        },
        cell: ({ row }) => (
            <IssueDropdown
                name="status"
                issue={row.original}
                disabled={useIsMobile()}
                onValueChange={useIssues()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        size: 100,
        minSize: 50,
        accessorKey: 'startDate',
        meta: { columnName: 'Start date' },
        header: ({ column }) => {
            const { t } = useTranslation();

            return <DataTableColumnHeader column={column} title={translateText(t, 'start.date', { capitalize: true })} />
        },
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
        header: ({ column }) => {
            const { t } = useTranslation();

            return <DataTableColumnHeader column={column} title={translateText(t, 'due.date', { capitalize: true })} />
        },
        cell: ({ row }) => {
            const dueDate = row.original.dueDate;
            return dueDate ? format(dueDate, 'MMMM dd, y') : '-'
        }
    },
    {
        size: 200,
        accessorKey: 'assignee',
        header: ({ column }) => {
            const { t } = useTranslation();

            return <DataTableColumnHeader column={column} title={translateText(t, 'assignee', { capitalize: true })} />
        },
        cell: ({ row }) => {
            const setIssues = useIssues()[1];

            return (
                <UserAvatarDropdown
                    size="sm"
                    className="w-full"
                    disabled={useIsMobile()}
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
            const total = table.getRowCount();
            const { t } = useTranslation();
            const { checkPermission } = useProject();

            const [issues, setIssues] = useIssues();
            const [isEdit, setEdit] = useState(false);
            const levelEditor = checkPermission('editor');

            const onMoveOrDelete = useCallback((value: Issue) => setIssues(
                (prev) => prev.filter(v => v.id !== value.id)
            ), []);

            const handleSave = useCallback((issue: Issue) => setIssues((prev) =>
                prev.some(v => v.id === issue.id)
                    ? prev.map(t => t.id === issue.id ? issue : t)
                    : [...prev, issue]
            ), []);

            return (
                <div className="w-full text-center">
                    <Sheet>
                        <IssueActionMenu
                            align="end"
                            className="w-48"
                            index={row.index}
                            issue={row.original}
                            count={total}
                            options={issues}
                            onMoveOrder={(values) => setIssues(() => values)}
                            onMoveParent={onMoveOrDelete}
                            onDelete={onMoveOrDelete}
                        >
                            <SheetTrigger asChild>
                                <DropdownMenuItem className="capitalize">
                                    {t('view')}
                                </DropdownMenuItem>
                            </SheetTrigger>
                            <DropdownMenuItem
                                hidden={!levelEditor}
                                className="capitalize"
                                onClick={() => setEdit(!isEdit)}
                            >
                                {t('edit')}
                            </DropdownMenuItem>
                        </IssueActionMenu>

                        <SheetContent hideClose className="flex flex-col max-w-sm sm:max-w-lg overflow-x-hidden overflow-y-auto p-0">
                            <BacklogDetail issue={row.original} />
                        </SheetContent>
                    </Sheet>

                    <IssueFormDialog
                        open={isEdit}
                        onOpenChange={setEdit}
                        issue={row.original}
                        parentId={row.original.parents}
                        disabled={!levelEditor}
                        excludeType={['subtask']}
                        defaultType="task"
                        onSave={handleSave}
                    />
                </div >
            )
        }
    }
];

export const columnChilds: ColumnDef<Issue>[] = [
    {
        size: 160,
        accessorKey: 'title',
        meta: { columnName: 'Name' },
        header: () => <Translate capitalize value="name" />,
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
        accessorKey: 'type',
        header: () => <Translate capitalize value="type" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="type"
                issue={row.original}
                excludes={['task']}
                defaultValue="subtask"
                disabled={useIsMobile()}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        accessorKey: 'priority',
        header: () => <Translate capitalize value="priority" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="priority"
                issue={row.original}
                defaultValue="medium"
                disabled={useIsMobile()}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        accessorKey: 'status',
        header: () => <Translate capitalize value="status" />,
        cell: ({ row }) => (
            <IssueDropdown
                name="status"
                defaultValue="todo"
                issue={row.original}
                disabled={useIsMobile()}
                onValueChange={useIssueChilds()[1]}
                className="w-full rounded-sm justify-between"
            />
        )
    },
    {
        accessorKey: 'startDate',
        meta: { columnName: 'Start date' },
        header: () => <Translate capitalize value="start.date" />,
        cell: ({ row }) => {
            const startDate = row.original.startDate;
            return startDate ? format(startDate, 'MMMM dd, y') : '-'
        }
    },
    {
        accessorKey: 'dueDate',
        meta: { columnName: 'Due date' },
        header: () => <Translate capitalize value="due.date" />,
        cell: ({ row }) => {
            const dueDate = row.original.dueDate;
            return dueDate ? format(dueDate, 'MMMM dd, y') : '-'
        }
    },
    {
        accessorKey: 'assignee',
        header: () => <Translate capitalize value="assignee" />,
        cell: ({ row }) => {
            const setIssues = useIssueChilds()[1];

            return (
                <UserAvatarDropdown
                    size="sm"
                    className="w-full"
                    disabled={useIsMobile()}
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
        maxSize: 10,
        id: 'actions',
        enableResizing: false,
        enableHiding: false,
        cell: ({ row }) => {
            const { checkPermission } = useProject();
            const [issues, setIssues] = useIssues();
            const [issuesChilds, setIssuesChilds] = useIssueChilds();
            const [openDialog, setOpenDialog] = useState(false);

            const total = issuesChilds.length;
            const levelEditor = checkPermission('editor');

            const onMoveOrDelete = (value: Issue) => setIssuesChilds(
                (prev) => prev.filter(v => v.id !== value.id)
            );

            const onRemoveParent = useCallback((value: Issue) => {
                setIssuesChilds((prev) => prev.filter(v => v.id !== value.id));
                setIssues(prev => [value, ...prev].sort((a, b) => a.order - b.order));
            }, []);

            const handleSave = useCallback((issue: Issue) => setIssuesChilds((prev) =>
                prev.some(v => v.id === issue.id)
                    ? prev.map(t => t.id === issue.id ? issue : t)
                    : [...prev, issue]
            ), []);

            return (
                <>
                    <IssueActionMenu
                        align="end"
                        index={row.index}
                        count={total}
                        issue={row.original}
                        options={issues}
                        disabled={!levelEditor}
                        onDelete={onMoveOrDelete}
                        onMoveParent={onMoveOrDelete}
                        onRemoveParent={onRemoveParent}
                        onMoveOrder={(values) => setIssuesChilds(() => values)}
                    >
                        <DropdownMenuItem
                            hidden={!levelEditor}
                            onClick={() => setOpenDialog(!openDialog)}
                        >
                            <Translate capitalize value="edit" />
                        </DropdownMenuItem>
                    </IssueActionMenu>

                    <IssueFormDialog
                        open={openDialog}
                        onOpenChange={setOpenDialog}
                        issue={row.original}
                        parentId={row.original.parents}
                        disabled={!levelEditor}
                        excludeType={['task']}
                        defaultType="subtask"
                        onSave={handleSave}
                    />
                </>
            )
        }
    }
]

export const columnDetails: TRender<Issue>[] = [
    {
        label: 'Priority',
        children: (issue) => {
            const setIssues = useIssues()[1]

            return (
                <IssueDropdown
                    name="priority"
                    issue={issue} side="right"
                    onValueChange={setIssues}
                // disabled={issue.status === 'done'}
                />
            )
        }
    },
    {
        label: 'Assignee',
        children: (issue) => {
            const setIssues = useIssues()[1]
            return (
                <UserAvatarDropdown
                    size="sm"
                    side="right"
                    value={issue.assigneeId}
                    // disabled={issue.status === 'done'}
                    onValueChange={(value) => {
                        setIssues({ ...issue, assigneeId: value })
                    }}
                />
            )
        }
    },
    {
        label: 'Reporter',
        children: (issue) => <UserAvatarDropdown disabled size="sm" value={issue.reporterId} />
    },
    {
        label: 'Start date',
        render: (state) => !!state.startDate,
        children: () => <BacklogEditor item="startDate" />
    },
    {
        label: 'End date',
        render: (state) => !!state.dueDate,
        children: () => <BacklogEditor item="dueDate" />
    },
    {
        label: 'Done at',
        render: (state) => !!state.doneDate,
        children: (issue) => issue?.createdAt ? format(issue?.createdAt, "LLL dd, y, HH:mm") : null
    },
];

// {
//     accessorKey: 'label',
//     header: ({ column }) => <DataTableColumnHeader column={column} title="Label" />,
//     cell: ({ row }) => {
//         const { label } = row.original;

//         if (!label) {
//             return '-'
//         }

//         return (
//             <div className="flex flex-wrap w-40 gap-1">
//                 {label.split(',').map((item, idx) => (
//                     <Badge
//                         key={idx}
//                         variant="primary"
//                         className="rounded-full text-xs font-normal py-1 px-2 gap-1"
//                     >
//                         {item.trim()}
//                     </Badge>
//                 ))}
//             </div>
//         )
//     }
// },
// {
//     accessorKey: 'createdAt',
//     header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
//     cell: ({ row }) => format(row.getValue('createdAt'), 'MMMM dd, y, HH:mm')
// },
// {
//     accessorKey: 'updatedAt',
//     header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
//     cell: ({ row }) => format(row.getValue('updatedAt'), 'MMMM dd, y, HH:mm')
// },