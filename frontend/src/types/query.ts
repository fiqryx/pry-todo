import { Issue } from "@/types/schemas/issue"
import { IssueItem } from "@/types/schemas/issue-item"

export type Response<T = any> = Promise<T | { error: string }>

export type GetProjectQuery = {
    status?: "active" | "inactive" | "done"
    search?: string
    sort?: 'updatedAt' | 'name' | 'createdAt'
}

export type CreateUser = {
    id: string
    name: string
    email?: string
    image?: string
}

export type GetIssueQuery = {
    search?: string
    userId?: string
}

export type IssueDetailsResponse = {
    issue: Issue;
    childs: Issue[];
    items: IssueItem[];
}