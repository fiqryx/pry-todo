import { z } from 'zod';
import { User } from '@/types/schemas/user';
import { Issue } from '@/types/schemas/issue';
import { Activity } from '@/types/schemas/activity';

export const commentSchema = z.object({
    title: z.string().min(1, 'Title is required')
});

export type CommentSchema = z.infer<typeof commentSchema>

export interface Comment extends CommentSchema {
    id: string
    userId: string
    issueId: string
    user?: User
    issue?: Issue
    message: string
    createdAt: string
    updatedAt: string
    activities?: Activity[]
}