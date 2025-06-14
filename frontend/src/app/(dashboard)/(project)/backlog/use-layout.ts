import { createPersistedAtom, usePersistedAtom } from "@/hooks/use-persist";

export type BacklogLayout = 'list' | 'group'
export type BacklogGroup = 'type' | 'priority' | 'status'

export const layoutAtom = createPersistedAtom<BacklogLayout>('backlog.layout', 'list');
export const groupAtom = createPersistedAtom<BacklogGroup>('backlog-group', 'type');

export function useLayout() {
    return usePersistedAtom(layoutAtom)
}

export function useGroup() {
    return usePersistedAtom(groupAtom)
}