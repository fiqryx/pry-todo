/* eslint-disable */
'use client'
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
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


interface IssueDetailChildProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
    // onValueChange?: (issue: Partial<Issue>) => void
}

export function IssueDetailChild({
    className,
    ...props
}: IssueDetailChildProps) {
    return (
        <div
            {...props}
            className={cn('flex flex-col gap-1')}
        >
            <span className="text-xs font-semibold">
                Child works items
            </span>
        </div>
    )
}