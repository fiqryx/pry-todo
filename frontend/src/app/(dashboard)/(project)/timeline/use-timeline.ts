import { useCallback } from 'react';
import { atom, useAtom } from 'jotai'
import { Issue } from '@/types/schemas/issue';
import { createPersistedAtom, usePersistedAtom } from '@/hooks/use-persist';

type State = Partial<Options> | ((prev: Options) => Options)
interface Options {
    showPanel: boolean
    timeUnit?: 'day' | 'week' | 'month' | 'quarter'
    showEmptyDate?: boolean
    showDayOnTimeline?: boolean
}

export const searchAtom = atom('');
export const issuesAtom = atom<Issue[]>([]);
export const optionsAtom = createPersistedAtom<Options>('timeline.options', { showPanel: true })
export const sortAtom = createPersistedAtom<'date' | 'priority'>('timeline.sort', 'date');

export function useSearch() {
    return useAtom(searchAtom)
}

export function useSort() {
    return usePersistedAtom(sortAtom)
}

export function useIssues() {
    return useAtom(issuesAtom)
}

export function useTimelineOptions() {
    const [options, setter] = usePersistedAtom(optionsAtom);

    const setOptions = useCallback((state: State) => {
        setter((prev) =>
            typeof state === 'function'
                ? state(prev)
                : { ...prev, ...state }
        );
    }, [setter]);

    return [options, setOptions] as const
}