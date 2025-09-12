import { Suspense } from "react"
import { createMetadata } from "@/lib/metadata"

import { Dashboard } from "@/components/app-dashboard"
import { getRecentIssues } from "@/lib/services/issues"
import { AnalyticWidget } from "./components/analytic-widget"
import { RecentIssueHydrator } from "./use-recent-issue"
import { AnalyticLayout } from "./components/analytic-layout"
import { AnalyticFallback } from "./components/analytic-fallback"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Analytic' });

async function RecentIssuesLoader() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['analytic-issues'],
        queryFn: () => getRecentIssues()
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RecentIssueHydrator>
                <AnalyticWidget className="md:grid-cols-2 lg:grid-cols-4 gap-5" />
                <AnalyticLayout className="grid lg:grid-cols-2 auto-rows-min gap-5" />
            </RecentIssueHydrator>
        </HydrationBoundary>
    )
}

export default function Page() {
    return (
        <Dashboard className="lg:pt-12">
            <Suspense fallback={<AnalyticFallback />}>
                <RecentIssuesLoader />
            </Suspense>
        </Dashboard>
    )
}