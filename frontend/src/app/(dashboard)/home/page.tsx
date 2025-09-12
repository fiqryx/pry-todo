import { FilterHydrator } from "./use-filter"
import { createMetadata } from "@/lib/metadata"
import { Dashboard } from "@/components/app-dashboard"
import { ProjectActions } from "./components/project-actions"
import { ProjectViews } from "./components/project-views"

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({ title: 'Projects' });

export default function Page() {
    return (
        <Dashboard className="lg:pt-12">
            <FilterHydrator>
                <ProjectActions className="gap-2 lg:gap-4" />
                <div className="flex flex-col gap-5">
                    <ProjectViews className="auto-rows-min" />
                </div>
            </FilterHydrator>
        </Dashboard>
    )
}