'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { UserRoles } from '@/types/misc';
import { Notification } from '@/types/schemas/notification';

type Data<T = Notification> = { data: T }

type VerifyProject = Data<{
    id: string
    name: string
    role: UserRoles
}>

export async function getNotifications() {
    const { data, code, error } = await service<Data<Notification[]>>('/notifications');

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data: data }
}

export async function verifyInvitation(token: string) {
    const url = `/verify/project?token=${encodeURIComponent(token)}`;
    const { data, code, error } = await service<VerifyProject>(url, {
        method: 'POST',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}