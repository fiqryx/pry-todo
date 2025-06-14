import { Skeleton } from "@/components/ui/skeleton";

export function SettingsFallback() {
    return (
        <div className="flex w-full h-full gap-5">
            <div className="flex flex-col w-full gap-2">
                <Skeleton className="h-12 max-w-40" />
                <Skeleton className="h-8 max-w-90" />
            </div>
        </div>
    )
}