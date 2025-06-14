'use client'
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { logger } from '@/lib/logger';
import { Issue } from '@/types/schemas/issue';
import { IssueItem } from '@/types/schemas/issue-item';

import {
    atom,
    Getter,
    Setter,
    useAtom,
} from 'jotai';
import {
    getIssueById,
    createOrUpdateIssue,
} from '@/lib/services/issues';

export type UpdateFn<T> = T | ((prev: T[]) => T[]);

export const issues = atom<Issue[]>([]);
export const issueChilds = atom<Issue[]>([]);
export const issueItems = atom<IssueItem[]>([]);

const persistent = atom((get) => get(issues), setter(issues));
const persistentChild = atom((get) => get(issueChilds), setter(issueChilds));

const debouncedSync = debounce(
    (set: Setter, atom: typeof issues, update: Issue, current: Issue[]) => {
        createOrUpdateIssue(update).then(({ data, error }) => {
            if (!data) throw error;
            set(atom, (prev) => prev.map(
                t => (t.id === data.id || (!t.id && t.title === data.title)) ? data : t
            ));

            if (data.parents) {
                getIssueById(data.parents).then(({ data }) => {
                    if (!data) return
                    set(issues, (prev) => prev.map(
                        t => t.id === data.id ? data : t)
                    );
                })
            }
        }).catch((e) => {
            set(atom, current);
            logger.debug(e);
            toast.error(
                typeof e === 'string' ? e : `Failed to changes: ${update.title}`
            );
        });
    },
    300
);

export function useIssues() {
    return useAtom(persistent);
}

export function useIssueChilds() {
    return useAtom(persistentChild);
}

export function useIssueItems() {
    return useAtom(issueItems);
}

function setter(atom: typeof issues) {
    return (get: Getter, set: Setter, update: UpdateFn<Issue>) => {
        const current = get(atom);

        if (typeof update === 'function') {
            set(atom, update(current));
            return
        }

        set(atom, prev => {
            const exists = prev.some(t => t.id === update.id);
            return exists
                ? prev.map(t => t.id === update.id ? update : t)
                : [...prev, update];
        });

        // sync to server for direct updates
        debouncedSync(set, atom, update, current);
    }
}