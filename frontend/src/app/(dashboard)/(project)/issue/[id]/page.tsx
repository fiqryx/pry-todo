import { Suspense } from "react";

import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata"
import { getIssueById, getIssues } from "@/lib/services/issues";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { Dashboard } from "@/components/app-dashboard";
import { IssueHydrator } from "./components/issue-hydrator";
import { IssueFallback } from "./components/issue-fallback";
import { IssueContent } from "./components/issue-content";
import { IssueSidebar } from "./components/issue-sidebar";
import { getIssueItems } from "@/lib/services/issue-item";

type PageProps = {
    params: Promise<{
        id: string
    }>
}

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Issue' });

async function fetchIssueData(id: string) {
    try {
        const [issue, childs, items] = await Promise.all([
            getIssueById(id),
            getIssues(id),
            getIssueItems(id)
        ]);

        if (!issue.data) throw new Error();

        return {
            issue: issue.data,
            childs: childs.data ?? [],
            items: items.data ?? []
        };
    } catch (error) {
        console.error('Failed to fetch issue data:', error);
        notFound();
    }
}

async function Comp({ params }: PageProps) {
    const { id } = await params;
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['issue-details'],
        queryFn: () => fetchIssueData(id)
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <IssueHydrator issueId={id}>
                <IssueSidebar>
                    <IssueContent />
                </IssueSidebar>
            </IssueHydrator>
        </HydrationBoundary>
    );
}

export default function Page({ params }: PageProps) {
    return (
        <Dashboard className="p-0 overflow-hidden">
            <Suspense fallback={<IssueFallback />}>
                <Comp params={params} />
            </Suspense>
        </Dashboard>
    );
}
