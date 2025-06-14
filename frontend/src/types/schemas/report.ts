import { z } from 'zod';
import { User } from '@/types/schemas/user';

export const reportSchema = z.object({
    type: z.enum(["feedback", "bug", "feature", "other"], {
        required_error: "Please select a type",
    }),
    message: z.string().min(10, {
        message: "Message must be at least 10 characters",
    }),
});

export type ReportSchema = z.infer<typeof reportSchema>

export interface Report extends ReportSchema {
    id: string
    user?: User
    createdAt: string
    updatedAt: string
}