'use client'
import { useCallback } from 'react';
import { useHydrateAtoms } from 'jotai/utils';
import { createPersistedAtom, usePersistedAtom } from '@/hooks/use-persist';

export type SortType = 'updatedAt' | 'createdAt' | 'name'
export type LayoutType = 'grid' | 'list'
export type State = Partial<FilterAtom> | ((prev: FilterAtom) => FilterAtom)
export interface FilterAtom {
    search?: string
    sort: SortType
    layout: LayoutType
}

const persistentFilterAtom = createPersistedAtom<FilterAtom>('project.filter', {
    search: '',
    layout: 'grid',
    sort: 'updatedAt',
});

export function FilterHydrator({ children }: React.PropsWithChildren) {
    useHydrateAtoms([[persistentFilterAtom, {
        search: '',
        layout: 'grid',
        sort: 'updatedAt',
    }]]);

    return children
}

export function useFilter() {
    const [state, setter] = usePersistedAtom(persistentFilterAtom);

    const setState = useCallback((state: State) => {
        setter((prev) =>
            typeof state === 'function'
                ? state(prev)
                : { ...prev, ...state }
        );
    }, [setter]);

    return [state, setState] as const
}
