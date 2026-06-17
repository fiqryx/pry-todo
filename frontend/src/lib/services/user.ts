'use server'
import { logger } from '@/lib/logger';
import { service } from '@/lib/service';
import { CreateUser } from '@/types/query';
import { User } from '@/types/schemas/user';
import { createClient } from '@/lib/supabase/server';

type Data<T = { user: User }> = T

export async function getUser() {
    try {
        const { user, code } = await service<Data>('/user', {
            method: 'GET'
        })

        if (!user && code === 403) {
            const supabase = await createClient();
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user;

            logger.debug('user not registered', { user });
            return { code, data: user, error: 'User not registered' }
        }

        return { user };
    } catch (e) {
        logger.debug(e);
        return { error: 'An unexpected error occurred' }
    }
}

export async function registerUser(params: CreateUser) {
    const { data, code, error } = await service<Data<{ data: User }>>('/user/register', {
        method: 'POST',
        body: JSON.stringify(params)
    })

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}

export async function updateUser(params: Omit<CreateUser, 'id'>) {
    const { data, code, error } = await service<Data<{ data: User }>>('/user/update', {
        method: 'POST',
        body: JSON.stringify(params)
    })

    if (error) {
        logger.debug(code, error)
        return { error }
    }

    return { data }
}