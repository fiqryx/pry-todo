import { BadgeProps } from "@/components/ui/badge"
import {
    ChevronDown,
    Clock,
    CircleMinus,
    CircleCheckBig,
    ChevronsDown,
    EqualIcon,
    ChevronUp,
    ChevronsUp,
    Crown,
    CogIcon,
    EditIcon,
    EyeIcon,
    SquareCheck,
    BugIcon,
    Bookmark,
    ZapIcon,
    CopyIcon,
    FileIcon,
} from "lucide-react";

export const STATUS_MAP = {
    draft: FileIcon,
    todo: CircleMinus,
    on_progress: Clock,
    done: CircleCheckBig,
} as const

export const PRIORITY_MAP = {
    highest: ChevronsUp,
    high: ChevronUp,
    medium: EqualIcon,
    low: ChevronDown,
    lowest: ChevronsDown,
} as const

export const USER_ROLES_MAP = {
    owner: Crown,
    admin: CogIcon,
    editor: EditIcon,
    viewer: EyeIcon,
} as const

export const ISSUE_TYPE_MAP = {
    task: SquareCheck,
    subtask: CopyIcon,
    bug: BugIcon,
    story: Bookmark,
    epic: ZapIcon,
} as const

export const UserlevelRoles = {
    viewer: 0,
    editor: 1,
    admin: 2,
    owner: 3,
} as const

export type IssueType = keyof typeof ISSUE_TYPE_MAP;
export type IssuePriority = keyof typeof PRIORITY_MAP;
export type IssueStatus = keyof typeof STATUS_MAP;
export type UserRoles = keyof typeof USER_ROLES_MAP;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeyValue<T> = {
    [K in keyof T]?: T[K];
}

export type Navigation = Record<string, (NavTeam | NavMain | NavFooter)[]>

export type NavLabel = string | Pick<BadgeProps, 'variant' | 'children'>

export interface NavTeam {
    name: string
    logo: React.ElementType
    plan: string
}

export interface NavFooter {
    title: string
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    icon: React.ElementType
}

export interface NavMain {
    title: string
    url?: string
    target?: React.HTMLAttributeAnchorTarget
    icon?: string | React.ElementType
    isOpen?: boolean
    disabled?: boolean
    label?: NavLabel
    items?: NavMain[]
}

export interface TimeAgoOptions {
    locale?: string;
    style?: 'long' | 'short' | 'narrow';
    numeric?: 'always' | 'auto';
    thresholds?: {
        minute?: number;
        hour?: number;
        day?: number;
        week?: number;
        month?: number;
        year?: number;
    };
    format?: 'relative' | 'absolute' | 'auto';
    showTime?: boolean;
    customLabels?: {
        now?: string;
        minute?: string;
        hour?: string;
        day?: string;
        week?: string;
    };
}
