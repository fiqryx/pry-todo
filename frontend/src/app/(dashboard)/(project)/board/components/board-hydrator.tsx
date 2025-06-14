'use client'
import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { Issue } from '@/types/schemas/issue';
import { useEffect } from 'react';
import { useProject } from '@/stores/project';
import { BoardFallback } from './board-fallback';
import { getIssuesWithFilter } from '@/lib/services/issues';
import { queueAtom, searchAtom, boardIssuesAtom } from '../use-board';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface BoardHydratorProps {
    children: React.ReactNode
}

export function BoardHydrator({
    children
}: BoardHydratorProps) {
    useHydrateAtoms([[queueAtom, []], [searchAtom, '']]);

    const { active } = useProject();
    const queryClient = useQueryClient();
    const setIssues = useSetAtom(boardIssuesAtom);
    const prefetchedData = queryClient.getQueryData<{ data?: Issue[] }>(['board-issues']);

    const { data, isLoading, error, isFetching, refetch } = useQuery({
        enabled: false,
        queryKey: ['board-issues'],
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
        return <BoardFallback />
    }

    return children
}
