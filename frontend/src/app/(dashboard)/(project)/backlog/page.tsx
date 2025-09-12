import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata"
import { getIssues } from "@/lib/services/issues"

import { Dashboard } from "@/components/app-dashboard"
import { IssueHydrator } from "./components/backlog-hydrator";
import { BacklogActions } from "./components/backlog-action";
import { BacklogTable } from "./components/backlog-table";
import { BacklogFallback } from "./components/backlog-fallback";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Backlog' });

async function BacklogLoader() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['backlog-issues'],
        queryFn: () => getIssues()
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <IssueHydrator>
                <BacklogActions className="gap-2 lg:gap-4" />
                <BacklogTable />
            </IssueHydrator>
        </HydrationBoundary>
    )
}

export default function Page() {
    return (
        <Dashboard className="lg:pt-12">
            <Suspense fallback={<BacklogFallback />}>
                <BacklogLoader />
            </Suspense>
        </Dashboard>
    )
}