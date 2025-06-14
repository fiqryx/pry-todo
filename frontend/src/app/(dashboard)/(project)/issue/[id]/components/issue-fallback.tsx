import { Skeleton } from "@/components/ui/skeleton";

export function IssueFallback() {
    return (
        <div className="flex size-full gap-2">
            <div className="flex flex-col w-full h-full gap-4 p-4">
                <div className="flex justify-between gap-2">
                    <Skeleton className="h-16 w-60" />
                </div>
                <div className="flex flex-col gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-1/4 rounded-sm" />
                            <Skeleton className="h-30 w-full rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="hidden lg:flex flex-col border-l w-[24rem] h-full gap-2 p-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-sm" />
                ))}
            </div>
        </div>
    )
}