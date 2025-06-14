'use client'
import { toast } from 'sonner';
import { useEffect } from 'react';
import { Issue } from '@/types/schemas/issue';
import { useHydrateAtoms } from 'jotai/utils';
import { useProject } from '@/stores/project';
import { atom, useAtom, useSetAtom } from 'jotai';
import { getRecentIssues } from '@/lib/services/issues';
import { AnalyticFallback } from './components/analytic-fallback';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const recentIssues = atom<Issue[]>([]);

export function useRecentIssues() {
    return useAtom(recentIssues);
}

export function RecentIssueHydrator({
    children
}: React.PropsWithChildren) {
    useHydrateAtoms([[recentIssues, []]]);

    const { active } = useProject();
    const setIssues = useSetAtom(recentIssues);

    const queryClient = useQueryClient();
    const prefetchedData = queryClient.getQueryData<{ data?: Issue[] }>(['board-issues']);

    const { data, isLoading, error, isFetching, refetch } = useQuery({
        enabled: false,
        queryKey: ['board-issues'],
        queryFn: async () => {
            if (!active) return []
            const { data, error } = await getRecentIssues()
            if (error) throw new Error(error)
            return data || []
        },
        initialData: prefetchedData?.data,
    });

    useEffect(() => {
        setIssues(Array.isArray(data) ? data : []);
    }, [data]);

    useEffect(() => {
        if (active) refetch();
    }, [active, refetch]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    if (isLoading || isFetching) {
        return <AnalyticFallback />
    }

    return children
}