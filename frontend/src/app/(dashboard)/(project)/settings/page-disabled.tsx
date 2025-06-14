import { createMetadata } from "@/lib/metadata"

import { Dashboard } from "@/components/app-dashboard"
import { SettingsBasic } from "./components/settings-basic";
import { SettingDeleteProject } from "./components/setting-delete-project";
import { SettingDetails } from "./components/setting-details";

export const dynamic = 'force-dynamic'
export const metadata = createMetadata({ title: 'Settings' });

export default async function Page() {
    return (
        <Dashboard className="container mx-auto lg:pt-12">
            <div className="grid xl:grid-cols-3 gap-8">
                <div className="flex flex-col gap-8">
                    <SettingsBasic />
                    <SettingDeleteProject />
                </div>
                <div className="xl:col-span-2 flex flex-col gap-8">
                    <SettingDetails />
                </div>
            </div>
        </Dashboard>
    )
}