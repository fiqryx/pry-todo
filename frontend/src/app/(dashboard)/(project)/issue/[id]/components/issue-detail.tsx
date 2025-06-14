'use client'
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useIssue } from '../use-issue';
import { Issue } from '@/types/schemas/issue';
import { RealTimeAgo } from '@/components/time-ago';
import { InputEditor } from '@/components/input-editor';
import { IssueDropdown, UserAvatarDropdown } from '@/components/issue-dropdown';

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from "@/components/ui/table"

type TRender<T> = {
    label: string
    render?: (value: T) => boolean
    children: React.ReactNode | ((value: T) => React.ReactNode)
}

interface IssueDetailProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
}

export function IssueDetail({
    className,
    disabled,
    ...props
}: IssueDetailProps) {
    const { issue, onUpdateIssue } = useIssue();

    const fields = useMemo<TRender<Issue>[]>(() => [
        {
            label: 'Priority',
            children: (issue) => (
                <IssueDropdown name="priority" align='end' issue={issue} onValueChange={onUpdateIssue} />
            )
        },
        {
            label: 'Assignee',
            children: (state) => (
                <UserAvatarDropdown
                    size="sm"
                    align='end'
                    value={state.assigneeId}
                    disabled={state.status === 'done'}
                    onValueChange={(value) => {
                        onUpdateIssue({ assigneeId: value })
                    }}
                />
            )
        },
        {
            label: 'Reporter',
            children: (state) => (
                <UserAvatarDropdown disabled size="sm" value={state.reporterId} />
            )
        },
        {
            label: 'Start date',
            render: (state) => !!state.startDate,
            children: (issue) => (
                <InputEditor
                    className='w-fit'
                    value={issue.startDate}
                    onValueChange={(startDate) => onUpdateIssue({ startDate } as Issue)}
                />
            )
        },
        {
            label: 'Due date',
            render: (state) => !!state.dueDate,
            children: (issue) => (
                <InputEditor
                    side='bottom'
                    className='w-fit'
                    value={issue.dueDate}
                    onValueChange={(dueDate) => onUpdateIssue({ dueDate } as Issue)}
                />
            )
        },
        {
            label: 'Done at',
            render: (state) => !!state.doneDate,
            children: (issue) => (
                <InputEditor
                    disabled
                    side='bottom'
                    className='w-fit'
                    value={issue.doneDate}
                    onValueChange={(doneDate) => onUpdateIssue({ doneDate } as Issue)}
                />
            )
        },
    ], [issue, disabled]);

    return (
        <div
            {...props}
            className={cn('flex flex-col gap-1', className)}
        >
            <span className="text-xs font-semibold">
                Details
            </span>
            <div className="rounded-sm border">
                <Table className="text-xs">
                    <TableBody>
                        {fields.map(({ label, children, render }, idx) => issue && (render?.(issue) ?? true) && (
                            <TableRow key={idx}>
                                <TableCell className="content-center text-muted-foreground min-w-20">
                                    {label}
                                </TableCell>
                                <TableCell className='w-full' align='right'>
                                    {typeof children === 'function' ? children(issue) : children}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Table className="text-xs text-muted-foreground mt-4">
                <TableBody>
                    <TableRow className="border-none hover:bg-transparent">
                        <TableCell className="w-20 p-1">
                            Created
                        </TableCell>
                        <TableCell className="p-1">
                            {issue?.createdAt ? format(issue?.createdAt, "LLL dd, y, HH:mm") : '-'}
                        </TableCell>
                    </TableRow>
                    <TableRow className="border-none hover:bg-transparent">
                        <TableCell className="w-20 p-1">
                            Updated
                        </TableCell>
                        <TableCell className="p-1">
                            <RealTimeAgo date={issue?.updatedAt} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}