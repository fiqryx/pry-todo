import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata"
import { dehydrate, QueryClient, HydrationBoundary } from '@tanstack/react-query'

import { Dashboard } from "@/components/app-dashboard";
import { BoardAction } from "./components/board-action";
import { BoardCategory } from "./components/board-category";
import { getIssuesWithFilter } from "@/lib/services/issues";
import { BoardFallback } from "./components/board-fallback";
import { BoardHydrator } from "./components/board-hydrator";

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Board' });


async function Children() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ['board-issues'],
        queryFn: () => getIssuesWithFilter()
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <BoardHydrator>
                <BoardAction className="gap-2 lg:gap-4" />
                <BoardCategory />
            </BoardHydrator>
        </HydrationBoundary>
    )
}

export default function Page() {
    return (
        <Dashboard className="container mx-auto lg:pt-6">
            <Suspense fallback={<BoardFallback />}>
                <Children />
            </Suspense>
        </Dashboard>
    )
}