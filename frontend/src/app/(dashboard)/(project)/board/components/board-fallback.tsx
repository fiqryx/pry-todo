import { Skeleton } from "@/components/ui/skeleton";

export function BoardFallback() {
    return (
        <div className="flex flex-col h-full gap-4">
            <Skeleton className="h-16 w-60" />
            <div className="flex flex-col lg:flex-row justify-between w-full lg:items-center gap-2">
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                    <Skeleton className="h-10 w-38" />
                    <div className="animate-pulse inline-flex mx-4">
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    </div>
                </div>
                <div className="flex w-full lg:w-fit flex-wrap gap-1">
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                </div>
            </div>
            <div className="flex flex-wrap h-full gap-3">
                <Skeleton className="h-full w-[260px] max-w-[260px]" />
                <Skeleton className="h-full w-[260px] max-w-[260px]" />
                <Skeleton className="h-full w-[260px] max-w-[260px]" />
            </div>
        </div>
    )
}