import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata"
import { getIssuesWithFilter } from "@/lib/services/issues";
import { dehydrate, QueryClient } from '@tanstack/react-query'

import { HydrationBoundary } from '@tanstack/react-query'
import { Dashboard } from "@/components/app-dashboard";
import { TimelineHeader } from "./components/timeline-header";
import { TimelineFallback } from "./components/timeline-fallback";
import { TimelineHydrator } from "./components/timeline-hydrator";
import { TimelineCalendar } from "./components/timeline-calendar";

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Timeline' });

async function Content() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['timeline-issues'],
        queryFn: () => getIssuesWithFilter()
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <TimelineHydrator>
                <TimelineHeader className="mb-2 gap-2 lg:gap-4" />
                <TimelineCalendar />
            </TimelineHydrator>
        </HydrationBoundary>
    )
}

export default function Page() {
    return (
        <Dashboard className="xlg:max-w-[100rem]">
            <Suspense fallback={<TimelineFallback />}>
                <Content />
            </Suspense>
        </Dashboard>
    )
}