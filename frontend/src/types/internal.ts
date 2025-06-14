import { LucideIcon } from "lucide-react";
import { Issue } from "@/types/schemas/issue";
import { STATUS_MAP, PRIORITY_MAP, ISSUE_TYPE_MAP } from "@/types/misc";

export type IssueEnum = 'status' | 'type' | 'priority';
export type IssueUser = 'assigneeId' | 'reporterId';
export type ValueMap<T extends IssueEnum, V> = { [K in Issue[T]]: V };

export const ISSUE_MAPS: { [K in IssueEnum]: ValueMap<K, LucideIcon> } = {
    status: STATUS_MAP,
    priority: PRIORITY_MAP,
    type: ISSUE_TYPE_MAP,
} as const;

export const ISSUE_COLOR_MAP: ValueMap<IssueEnum, string> = {
    // type color
    task: 'text-primary',
    subtask: 'text-primary',
    bug: 'text-destructive',
    story: 'text-success',
    epic: 'text-purple-500',
    // priority color
    lowest: 'text-success',
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-destructive',
    highest: 'text-destructive',
    // status color
    draft: 'text-muted-foreground',
    todo: 'text-muted-foreground',
    on_progress: 'text-primary',
    done: 'text-success',
} as const;