'use client'
import { toast } from 'sonner';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useProject } from '@/stores/project';
import { useHydrateAtoms } from 'jotai/utils';
import { IssueFallback } from './issue-fallback';
import { useRouter } from 'next/navigation';
import { getIssueById, getIssues } from '@/lib/services/issues';
import { getIssueItems } from '@/lib/services/issue-item';
import { issueAtom, issueChilds, issueItems, } from '../use-issue';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IssueDetailsResponse } from '@/types/query';

interface Props {
    issueId: string
    children: React.ReactNode
}

const useSafeRedirect = () => {
    const router = useRouter();

    return (path: string) => {
        if (typeof window !== 'undefined') {
            router.push(path);
        }
    };
};

export function IssueHydrator({
    issueId,
    children
}: Props) {
    useHydrateAtoms([[issueItems, []], [issueChilds, []]]);

    const { active } = useProject();
    const redirect = useSafeRedirect();

    const queryClient = useQueryClient();
    const prefetchedData = queryClient.getQueryData<IssueDetailsResponse>(['issue-details']);

    const { data, isLoading, error, isFetching, refetch } = useQuery({
        enabled: false,
        queryKey: ['issue-details'],
        queryFn: async () => {
            const [issue, childs, items] = await Promise.all([
                getIssueById(issueId),
                getIssues(issueId),
                getIssueItems(issueId)
            ]);

            if (!issue.data) {
                throw new Error(issue.error);
            }

            return {
                issue: issue.data,
                childs: childs.data ?? [],
                items: items.data ?? []
            };
        },
        initialData: prefetchedData
    })

    const setIssue = useSetAtom(issueAtom);
    const setItems = useSetAtom(issueItems);
    const setChilds = useSetAtom(issueChilds);

    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        setIssue(data?.issue);
        setItems(data?.items || []);
        setChilds(data?.childs || []);
    }, [data]);

    useEffect(() => {
        if (active && data?.issue && active.id !== data.issue.projectId) {
            setIsRedirecting(true);
            redirect('/home');
        }
    }, [active, refetch]);

    useEffect(() => {
        if (active) refetch();
    }, [active, refetch]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    if (isLoading || isRedirecting || isFetching) {
        return <IssueFallback />
    }

    return children
}