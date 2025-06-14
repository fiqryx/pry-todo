import { User } from "@/types/schemas/user"

export type NotificationType = 'system' | 'message' | 'comment' | 'task'

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message?: string
    isRead: boolean
    metadata: Record<string, any>
    createdAt: string
    updatedAt: string
    user?: User
}