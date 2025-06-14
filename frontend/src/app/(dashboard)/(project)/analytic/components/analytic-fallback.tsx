import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticFallback() {
    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-5">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
            </div>
            <div className="h-full grid lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-full w-full rounded-lg" />
                ))}
            </div>
        </div>
    )
}