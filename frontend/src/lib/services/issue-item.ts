'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { Activity } from '@/types/schemas/activity';
import { IssueItem, IssueItemSchema } from '@/types/schemas/issue-item';

type Data<T = IssueItem> = { data: T }

export async function getIssueItems(issueId: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/item`;
    const { data, code, error } = await service<Data<IssueItem[]>>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function getIssueActivities(issueId: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/activity`;
    const { data, code, error } = await service<Data<Activity[]>>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function createIssueItem(issueId: string, payload: IssueItemSchema) {
    const url = `/issue/${encodeURIComponent(issueId)}/item/create`;
    const { data, code, error } = await service<Data>(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function updateIssueItem(id: string, issueId: string, payload: IssueItemSchema) {
    const url = `/issue/${encodeURIComponent(issueId)}/item/${encodeURIComponent(id)}`;
    const { data, code, error } = await service<Data>(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function deleteIssueItem(id: string, issueId: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/item/${encodeURIComponent(id)}`;
    const { data, code, error } = await service<Data>(url, {
        method: 'DELETE',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}