'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { GetProjectQuery } from '@/types/query';
import { Setting } from '@/types/schemas/setting';
import { ProjectSchema } from '@/types/schemas/project';
import { Project, ProjectInviteSchema } from '@/types/schemas/project';
import { UserRoles } from '@/types/misc';

type Data<T = Project> = { data: T }

export async function getProjects(params: GetProjectQuery) {
    const { data, code, error } = await service<Data<Project[]>>('/projects', {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function getProject() {
    const { data, code, error } = await service<Data>('/project/active');

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function saveProject(params: ProjectSchema & { id?: string }) {
    const { data, code, error } = await service<Data>('/project', {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function inviteUser(params: ProjectInviteSchema & { id?: string }) {
    const { data, code, error } = await service<Data<string>>('/project/invite', {
        method: 'POST',
        body: JSON.stringify(params)
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function switchProject(id: string) {
    const { data, code, error } = await service<Data>(`/project/${id}`, {
        method: 'POST',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function changeSetting(projectId: string, values: Partial<Setting>) {
    const { data, code, error } = await service<Data<Setting>>('/project/setting', {
        method: 'POST',
        body: JSON.stringify({ projectId, ...values })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function changeProjectAccess(projectId: string, userId: string, role: UserRoles) {
    const url = `/project/${projectId}/teams/access`;
    const { data, code, error } = await service<Data<any>>(url, {
        method: 'POST',
        body: JSON.stringify({ userId, role })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function removeProjectAccess(projectId: string, userId: string) {
    const url = `/project/${projectId}/teams`;
    const { data, code, error } = await service<Data<any>>(url, {
        method: 'DELETE',
        body: JSON.stringify({ userId })
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function deleteProject(id: string) {
    const { data, code, error } = await service<Data>(`/project/${id}`, {
        method: 'DELETE',
    });

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}