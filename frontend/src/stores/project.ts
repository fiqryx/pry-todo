import { create } from 'zustand';
import { User } from '@/types/schemas/user';
import { DeepPartial } from 'react-hook-form';
import { Project } from '@/types/schemas/project';
import { UserRoles, UserlevelRoles } from '@/types/misc';

interface ProjectState {
    active?: Project | null
    list: Project[]
}

export interface ProjectStore extends ProjectState {
    set: (state: DeepPartial<ProjectState>) => void
    getTeams(): User[]
    checkPermission: (level: UserRoles) => boolean
}

function isObject(item: any): item is Record<string, any> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
    const output = Array.isArray(target) ? [...(target as any)] : { ...target };

    for (const key in source) {
        const sourceVal = source[key];
        const targetVal = (target as any)[key];

        if (Array.isArray(sourceVal)) {
            (output as any)[key] = [...sourceVal];
        } else if (isObject(sourceVal) && isObject(targetVal)) {
            (output as any)[key] = deepMerge(targetVal, sourceVal as any);
        } else {
            (output as any)[key] = sourceVal;
        }
    }

    return output as T;
}

export const useProject = create<ProjectStore>(
    (setter, getter) => ({
        list: [],

        set: (state) => {
            setter((prev) => deepMerge(prev, state) as ProjectStore);
        },

        getTeams() {
            const { active } = getter();

            if (!active?.users) {
                return [];
            }

            return [...active.users].sort((a, b) => {
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();
                return dateB - dateA;
            });
        },

        checkPermission(level) {
            const { active } = getter();
            return active?.role ? UserlevelRoles[active.role] >=
                UserlevelRoles[level] : false
        },
    })
);