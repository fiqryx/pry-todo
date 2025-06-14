'use client'
import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { Issue } from '@/types/schemas/issue';
import { useProject } from '@/stores/project';
import { useHydrateAtoms } from 'jotai/utils';
import { getIssues } from '@/lib/services/issues';
import { BacklogFallback } from './backlog-fallback';
import { getIssueItems } from '@/lib/services/issue-item';
import { useEffect, PropsWithChildren } from 'react';
import { issueChilds, issueItems, issues } from '../use-issue';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Props {
    children: React.ReactNode
}

export function IssueHydrator({
    children,
}: Props) {
    useHydrateAtoms([[issues, []]]);

    const { active } = useProject();
    const setIssues = useSetAtom(issues);

    const queryClient = useQueryClient();
    const prefetchedData = queryClient.getQueryData<{ data?: Issue[] }>(['backlog-issues']);

    const { data, isLoading, error, isFetching, refetch } = useQuery({
        enabled: false,
        queryKey: ['backlog-issues'],
        queryFn: async () => {
            if (!active) return []
            const { data, error } = await getIssues()
            if (error) throw new Error(error)
            return data || []
        },
        staleTime: 0,
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
        return <BacklogFallback />
    }

    return children;
}

export function IssueChildHydrator({
    issueId,
    children,
    onLoading,
}: PropsWithChildren<{
    issueId: string,
    onLoading?: (state: boolean) => void
}>) {
    useHydrateAtoms([
        [issueChilds, []],
        [issueItems, []]
    ]);

    const setIssueChilds = useSetAtom(issueChilds);
    const setIssueItems = useSetAtom(issueItems);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                setIssueChilds([]);
                setIssueItems([]);
                if (onLoading) onLoading(true);

                // parallel fetch (better performance)
                const [issuesResponse, itemResponse] = await Promise.allSettled([
                    getIssues(issueId),
                    getIssueItems(issueId)
                ]);

                if (issuesResponse.status === 'fulfilled') {
                    const { error, data } = issuesResponse.value;
                    if (error) {
                        toast.error(`Failed to load issues: ${error}`);
                    }
                    setIssueChilds(data || []);
                } else {
                    toast.error(`Failed to load issues: ${issuesResponse.reason}`);
                }

                if (itemResponse.status === 'fulfilled') {
                    const { error, data } = itemResponse.value;
                    if (error) {
                        toast.error(`Failed to load items: ${error}`);
                    }
                    setIssueItems(data || []);
                } else {
                    toast.error(`Failed to load items: ${itemResponse.reason}`);
                }
            } catch (e: any) {
                toast.error(`An unexpected error occurred: ${e instanceof Error ? e.message : e}`);
            } finally {
                onLoading?.(false);
            }
        };

        fetchIssues();
    }, [issueId]);

    return children;
}