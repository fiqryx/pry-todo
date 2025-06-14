'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { Comment } from '@/types/schemas/comment';

type Data<T = Comment> = { data: T }

export async function getComments(issueId: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/comment`;
    const { data, code, error } = await service<Data<Comment[]>>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function createComment(issueId: string, message: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/comment/create`;
    const { data, code, error } = await service<Data>(url, {
        method: 'POST',
        body: JSON.stringify({ message })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function updateComment(id: string, issueId: string, message: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/comment/${encodeURIComponent(id)}`;
    const { data, code, error } = await service<Data>(url, {
        method: 'POST',
        body: JSON.stringify({ message })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function deleteComment(id: string, issueId: string) {
    const url = `/issue/${encodeURIComponent(issueId)}/comment/${encodeURIComponent(id)}`;
    const { data, code, error } = await service<Data>(url, {
        method: 'DELETE',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}