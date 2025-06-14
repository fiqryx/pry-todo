import { Skeleton } from "@/components/ui/skeleton";

export function BacklogFallback() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end gap-2 lg:gap-4">
                <Skeleton className="h-16 w-60" />
                <div className="flex flex-wrap gap-1">
                    <div className="animate-pulse inline-flex mx-4">
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                        <div className="z-10 -ml-1 size-10 border-2 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 col-span-2" />)}
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4">
                        <Skeleton className="h-10 col-span-12" />
                    </div>
                ))}
            </div>
        </div>
    )
}