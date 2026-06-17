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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const BACKEND_URL = (() => {
    if (API_URL) return API_URL;

    if (typeof window !== "undefined") {
        const protocol = window.location.protocol;        // "http:" or "https:"
        const currentHostname = window.location.hostname; // "localhost", "192.168.1.13", atau "domain.com"
        const isLocalOrIP = currentHostname === "localhost" || currentHostname === "127.0.0.1" || /^[0-9.]+$/.test(currentHostname);

        if (isLocalOrIP) {
            return `${protocol}//${currentHostname}:8000/api`; // "[protocol]://[hostname]:8000"
        }

        if (currentHostname.startsWith("todo.")) {
            return `${protocol}//${currentHostname.replace("todo.", "api-todo.")}/api`;
        }

        return `${protocol}//api.${currentHostname}/api`; // "[protocol]://api.domain.com"
    }

    return "http://localhost:8000/api"; // fallback
})();