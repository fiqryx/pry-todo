'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { Report, ReportSchema } from '@/types/schemas/report';

type Data<T = Report> = { data: T }

export async function getRepots(limit?: number, offset?: number) {
    const url = `/report?limit=${limit}&offset=${offset}`;
    const { data, code, error } = await service<Data<Report[]>>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function getRepotById(id: string) {
    const url = `/report/${id}`;
    const { data, code, error } = await service<Data>(url);

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function createReport(params: ReportSchema) {
    const url = `/report`;
    const { data, code, error } = await service<Data>(url, {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}


export async function deleteReport(id: string) {
    const url = `/report/${id}`;
    const { data, code, error } = await service<Data>(url, {
        method: 'DELETE'
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}