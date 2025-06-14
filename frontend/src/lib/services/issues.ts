'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { GetIssueQuery } from '@/types/query';
import { Issue, IssueSchema } from '@/types/schemas/issue';

type Data<T = Issue> = { data: T }

export async function getIssues(parents?: string) {
    const url = `/issue${parents ? `?id=${encodeURIComponent(parents)}` : ''}`
    const { data, code, error } = await service<Data<Issue[]>>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function getRecentIssues() {
    const { data, code, error } = await service<Data<Issue[]>>(`/issue/analytic`);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function getIssuesWithFilter(params: GetIssueQuery = {}) {
    const { data, code, error } = await service<Data<Issue[]>>(`/issue/board`, {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function getIssueById(id: string) {
    const { data, code, error } = await service<Data>(`/issue/${id}`);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function createOrUpdateIssue(params: IssueSchema & { id?: string }) {
    const { data, code, error } = await service<Data>('/issue', {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function issueRemoveParents(id: string) {
    const { data, code, error } = await service<Data>(`/issue/parent/${id}`, {
        method: 'DELETE',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function updateIssueOrderIndex(
    issue: Issue,
    direction: 'top' | 'up' | 'down' | 'bottom',
) {
    const { data, code, error } = await service<Data<Issue[]>>('/issue/order', {
        method: 'POST',
        body: JSON.stringify({ id: issue.id, direction })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function moveParents(id: string, parents: string) {
    const { data, code, error } = await service<Data>('/issue/move', {
        method: 'POST',
        body: JSON.stringify({ id, parents })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: parseDates(data) }
}

export async function deleteIssueById(id: string) {
    const { code, error } = await service('/issue/' + id, {
        method: 'DELETE',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return {}
}

function parseDates<T extends Issue | Issue[]>(data: T): T {
    if (Array.isArray(data)) {
        return data.map(issue => ({
            ...issue,
            ...(issue.startDate && { startDate: new Date(issue.startDate) }),
            ...(issue.dueDate && { dueDate: new Date(issue.dueDate) }),
            ...(issue.doneDate && { doneDate: new Date(issue.doneDate) }),
            // Add other date fields as needed
        })) as T;
    } else {
        return {
            ...data,
            ...(data.startDate && { startDate: new Date(data.startDate) }),
            ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
            ...(data.doneDate && { doneDate: new Date(data.doneDate) }),
            // Add other date fields as needed
        } as T;
    }
}