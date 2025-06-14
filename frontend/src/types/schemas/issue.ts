import { z } from 'zod';
import { User } from '@/types/schemas/user';
import { Project } from '@/types/schemas/project';
import { Comment } from '@/types/schemas/comment';
import { Activity } from '@/types/schemas/activity';
import { IssueItem } from '@/types/schemas/issue-item';

import {
    IssueStatus,
    STATUS_MAP,
    IssuePriority,
    PRIORITY_MAP,
    IssueType,
    ISSUE_TYPE_MAP
} from '@/types/misc';

export const issueSchema = z.object({
    title: z.string().min(1, 'Title is required').max(60, 'Maximum 60 characters'),
    type: z.enum(
        Object.keys(ISSUE_TYPE_MAP) as [IssueType, ...IssueType[]],
        { message: 'Type value is not valid' }
    ),
    priority: z.enum(
        Object.keys(PRIORITY_MAP) as [IssuePriority, ...IssuePriority[]],
        { message: 'Priority value is not valid' }
    ),
    status: z.enum(
        Object.keys(STATUS_MAP) as [IssueStatus, ...IssueStatus[]],
        { message: 'Status value is not valid' }
    ),
    assigneeId: z.string().optional(),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
    label: z.string().optional(),
    reporterId: z.string().optional(),
    description: z.string().optional(),
    goal: z.string().optional(),
    parents: z.string().optional(),
});

export type MoveDirection = 'top' | 'up' | 'down' | 'bottom'
export type IssueSchema = z.infer<typeof issueSchema>

export interface Issue extends IssueSchema {
    id: string
    projectId: string
    parents?: string
    order: number
    creatorId?: string
    doneDate?: Date
    project?: Project
    assignee?: User
    reporter?: User
    creator?: User
    comments?: Comment[]
    items?: IssueItem[]
    createdAt: string
    updatedAt: string
    activities?: Activity[]
}