import { z } from 'zod';
import { Issue } from '@/types/schemas/issue';
import { Activity } from '@/types/schemas/activity';

const ITEM_TYPE_VALUES = ['attachment', 'web_link', 'link_work'] as const

export type IssueItemType = typeof ITEM_TYPE_VALUES[number];

export const issueItemSchema = z.object({
    type: z.enum(ITEM_TYPE_VALUES),
    url: z.string().optional(),
    text: z.string().optional(),
    publicId: z.string().optional(),
    assetId: z.string().optional(),
});

export type IssueItemSchema = z.infer<typeof issueItemSchema>;

export interface IssueItem extends IssueItemSchema {
    id: string
    issueId: string
    issue?: Issue
    createdAt: string
    updatedAt: string
    activities?: Activity[]
}