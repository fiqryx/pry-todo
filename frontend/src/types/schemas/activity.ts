import { User } from "@/types/schemas/user"
import { Issue } from "@/types/schemas/issue"
import { Project } from "@/types/schemas/project"
import { Comment } from "@/types/schemas/comment"
import { IssueItem } from "@/types/schemas/issue-item"

export const ActivityType_Map = {
    project_create: "Create project",
    project_update: "Update project",
    project_delete: "Delete project",
    issue_create: "Create task",
    issue_update: "Update task",
    issue_delete: "Delete task",
    issue_move: "Move issue",
    comment_create: "Comment",
    comment_update: "Update comment",
    comment_delete: "Delete comment",
    sprint_start: "Start sprint",
    sprint_end: "End sprint",
    status_change: "Change status",
    issue_children_create: "Add subtask",
    issue_children_update: "Update subtask",
    issue_children_delete: "Remove subtask",
    issue_item_create: "Add attached file",
    issue_item_update: "Update attached file",
    issue_item_delete: "Remove attached file"
} as const;

export type ActivityType = keyof typeof ActivityType_Map;

export interface Activity {
    id: string
    userId: string
    projectId?: string
    issueId?: string
    commentId?: string
    itemId?: string
    type: ActivityType
    old?: Record<string, any>
    new?: Record<string, any>
    user?: User
    project?: Project
    issue?: Issue
    comment?: Comment
    item?: IssueItem
    createdAt: string
    updatedAt: string
}