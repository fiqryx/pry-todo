import { z } from 'zod';
import { UserRoles } from '@/types/misc';
import { Issue } from '@/types/schemas/issue';
import { Project } from '@/types/schemas/project';
import { Comment } from '@/types/schemas/comment';
import { Activity } from '@/types/schemas/activity';

export const userSchema = z.object({
    name: z.string(),
    email: z.string(),
    image: z.string().optional(),
});

export interface User extends z.infer<typeof userSchema> {
    id: string
    projectId?: string
    project?: Project
    projects?: Project[]
    issuesAssignee?: Issue[]
    issueReporter?: Issue[]
    comments?: Comment[]
    createdAt: string
    updatedAt: string
    activities?: Activity[]
    role?: UserRoles
}