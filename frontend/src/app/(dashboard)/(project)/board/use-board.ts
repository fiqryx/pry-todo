import { atom, useAtom } from 'jotai'
import { Issue } from '@/types/schemas/issue';
import { useCallback } from 'react';
import { createPersistedAtom, usePersistedAtom } from '@/hooks/use-persist';
import { IssueStatus } from '@/types/misc';

type Options = {
    filterStatus: IssueStatus[]
    showAssignee?: boolean
    showTask?: boolean
    showSubtask?: boolean
    hideBug?: boolean
    hideStory?: boolean
    hideEpic?: boolean
}

export const searchAtom = atom('');
export const queueAtom = atom<string[]>([]);
export const boardIssuesAtom = atom<Issue[]>([]);
export const sortAtom = createPersistedAtom<'date' | 'priority'>('board.sort', 'date');
export const optionsAtom = createPersistedAtom<Options>('board.options', {
    showTask: true,
    showSubtask: true,
    filterStatus: ['draft']
})

export function useSearch() {
    return useAtom(searchAtom)
}

export function useQueue() {
    return useAtom(queueAtom)
}

export function useBoardIssues() {
    return useAtom(boardIssuesAtom)
}

export function useSort() {
    return usePersistedAtom(sortAtom)
}


export function useBoardOptions() {
    const [options, setter] = usePersistedAtom(optionsAtom);

    const setOptions = useCallback((state: Partial<Options> | ((prev: Options) => Options)) => {
        setter((prev) =>
            typeof state === 'function'
                ? state(prev)
                : { ...prev, ...state }
        );
    }, [setter]);

    const setFilterStatus = useCallback((status: IssueStatus) => {
        setter((prev) => {
            const isActive = prev.filterStatus?.includes(status);
            return {
                ...prev,
                filterStatus: isActive
                    ? prev.filterStatus.filter(s => s !== status)
                    : [...prev.filterStatus, status],
            };
        });
    }, [setter]);


    return { options, setOptions, setFilterStatus } as const
}