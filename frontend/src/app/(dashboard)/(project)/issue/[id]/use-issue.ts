import { toast } from 'sonner';
import { debounce } from 'lodash';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Issue } from '@/types/schemas/issue';
import { IssueItem } from '@/types/schemas/issue-item';
import { atom, Getter, Setter, useAtom } from 'jotai';
import { getIssueById, createOrUpdateIssue } from '@/lib/services/issues';

export type UpdateFn<T> = T | ((prev: T[]) => T[]);

export const issueAtom = atom<Issue>();
export const issueChilds = atom<Issue[]>([]);
export const issueItems = atom<IssueItem[]>([]);
export const persistent = atom((get) => get(issueChilds), setter(issueChilds));

const debouncedSync = debounce(
    (set: Setter, update: Issue, current: Issue[]) => {
        createOrUpdateIssue(update).then(({ data, error }) => {
            if (!data) throw new Error(error);
            set(issueChilds, (prev) => prev.map(
                t => (t.id === data.id || (!t.id && t.title === data.title)) ? data : t
            ));

            if (data.parents) {
                getIssueById(data.parents).then(({ data }) => {
                    if (!data) return
                    set(issueAtom, data);
                })
            }
        }).catch((e) => {
            set(issueChilds, current);
            logger.debug(e);
            toast.error(e?.message || `Failed to changes: ${update.title}`);
        });
    },
    300
);

function setter(atom: typeof issueChilds) {
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
        debouncedSync(set, update, current);
    }
}

export function useIssue() {
    const [issue, setIssue] = useAtom(issueAtom)

    const onUpdateIssue = useCallback(async (updates: Partial<Issue>) => {
        if (!issue) return;

        const current = { ...issue };
        const optimisticUpdate = { ...issue, ...updates };

        setIssue(optimisticUpdate);

        try {
            const { data, error } = await createOrUpdateIssue(optimisticUpdate);
            if (error || !data) {
                throw new Error(error || 'Update failed');
            }

            setIssue(data);

            return data;
        } catch (e) {
            setIssue(current);
            toast.error(e instanceof Error ? e.message : 'Update failed');
        }
    }, [issue, setIssue]);

    return {
        issue,
        setIssue,
        onUpdateIssue
    };
}

export function useIssueChilds() {
    return useAtom(persistent)
}

export function useIssueItems() {
    return useAtom(issueItems)
}