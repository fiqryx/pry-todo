import { create } from 'zustand';
import { site } from '@/config/site';
import { User } from '@/types/schemas/user';
import { UserRoles, UserlevelRoles } from '@/types/misc';

import {
    setCookie,
    getCookie,
    deleteCookie,
} from 'cookies-next/client';

export interface AuthState {
    token?: string
    user?: User
}

export interface AuthStore extends AuthState {
    set: (state: AuthState) => void
    checkPermission: (level: UserRoles) => boolean
    reset: () => void
}

const key = site.auth.key

export const useAuthStore = create<AuthStore>((setter, getter) => ({
    token: getCookie(key),
    project: {
        list: []
    },

    set: (state) => setter((prev) => {
        if (state.token) {
            setCookie(key, state.token, {
                secure: true,
                maxAge: 7 * 3600
            })
        }

        return { ...prev, ...state }
    }),

    checkPermission(level) {
        const { user } = getter()
        return user?.role ? UserlevelRoles[user.role] >=
            UserlevelRoles[level] : false
    },

    reset: () => {
        deleteCookie(key, { secure: true })
        setter({
            token: undefined,
            user: undefined
        })
    }
}))