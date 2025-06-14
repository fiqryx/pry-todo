import { Skeleton } from "@/components/ui/skeleton";

const array = (count: number) => [...Array(count)];

export function TimelineFallback() {
    return (
        <div className="flex flex-col h-full gap-4">
            <Skeleton className="h-16 w-60" />
            <div className="flex flex-wrap items-center gap-1">
                <Skeleton className="h-10 w-60" />
                <div className="animate-pulse inline-flex mx-4">
                    {array(3).map((_, i) => (
                        <div key={i} className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-center gap-2 lg:gap-4">
                <div className="flex flex-wrap items-center gap-0.5">
                    {array(3).map((_, i) => <Skeleton key={i} className="h-8 w-16 rounded-md" />)}
                </div>
                <div className="flex flex-wrap items-center gap-0.5">
                    {array(3).map((_, i) => <Skeleton key={i} className="size-8" />)}
                </div>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2">
                    {array(6).map((_, i) => <Skeleton key={i} className="h-10 col-span-2" />)}
                </div>
                {array(5).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4">
                        <Skeleton className="h-10 col-span-12" />
                    </div>
                ))}
            </div>
        </div>
    )
}