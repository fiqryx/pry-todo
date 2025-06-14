'use client'
import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { Issue } from '@/types/schemas/issue';
import { useEffect } from 'react';
import { useProject } from '@/stores/project';
import { TimelineFallback } from './timeline-fallback';
import { searchAtom, issuesAtom } from '../use-timeline';
import { getIssuesWithFilter } from '@/lib/services/issues';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function TimelineHydrator({ children }: React.PropsWithChildren) {
    useHydrateAtoms([[searchAtom, '']]);
    const { active } = useProject();
    const queryClient = useQueryClient();
    const setIssues = useSetAtom(issuesAtom);
    const prefetchedData = queryClient.getQueryData<{ data?: Issue[] }>(['timeline-issues']);

    const { data, isLoading, error, isFetching, refetch } = useQuery({
        enabled: false,
        queryKey: ['timeline-issues'],
        queryFn: async () => {
            if (!active) return []
            const { data, error } = await getIssuesWithFilter()
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
        return <TimelineFallback />
    }

    return children
}