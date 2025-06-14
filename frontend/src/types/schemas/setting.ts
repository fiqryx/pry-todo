import { IssuePriority, IssueStatus } from "@/types/misc"

export type AssigmentMethod = 'round_robin' | 'least_busy' | 'random'

export type TimeUnit = 'hours' | 'minutes' | 'days'

export interface Setting {
    id: string
    projectId: string
    autoAssignment: boolean
    assignmentMethod: AssigmentMethod
    defaultIssuePriority: IssuePriority
    defaultIssueStatus: IssueStatus
    enableTimeTracking: boolean
    timeTrackingUnit?: TimeUnit
    requireDueDate: boolean
    defaultDueDateOffset: number
    enableApprovalWorkflow: boolean
    requireDescription: boolean
    allowAttachments: boolean
    maxAttachmentSize: number
    taskLimitPerUser: number
    notifyOnAssignment: boolean
    notifyOnStatusChange: boolean
    notifyOnDueDate: boolean
    notifyOnOverdue: boolean
    dailyDigest: boolean
    createdAt: Date
    updatedAt: Date
}