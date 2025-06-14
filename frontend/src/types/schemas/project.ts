import { z } from 'zod';
import { User } from '@/types/schemas/user';
import { Setting } from '@/types/schemas/setting';
import { Activity } from '@/types/schemas/activity';
import { USER_ROLES_MAP, UserRoles } from '@/types/misc';

export const projectSchema = z.object({
    name: z.string().min(1, {
        message: "Project name is required"
    }).max(30, 'Maximum 30 characters'),
    image: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
});

export const projectInviteSchema = z.object({
    email: z.string().min(1, "Email address is required").email("Email address is invalid"),
    role: z.enum(Object.keys(USER_ROLES_MAP) as [UserRoles, ...UserRoles[]]),
    message: z.string().optional(),
})

export type ProjectSchema = z.infer<typeof projectSchema>
export type ProjectInviteSchema = z.infer<typeof projectInviteSchema>
export type ProjectStatus = 'active' | 'inactive' | 'done'

export interface Project extends ProjectSchema {
    id: string
    projectId?: string
    order: number
    status: ProjectStatus
    lastAssignedIndex?: number
    setting?: Setting
    users?: User[]
    activeUsers?: User[]
    issues?: any[]
    createdAt: string
    updatedAt: string
    activities?: Activity[]
    role?: UserRoles
}