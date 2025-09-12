import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata"
import { Translate } from '@/components/translate'

import { Dashboard } from "@/components/app-dashboard"
import { SettingsSystem } from "./components/setting-system";
import { SettingsGeneral } from "./components/settings-general";
import { SettingsFallback } from "./components/settings-fallback";
import { SettingsProject } from "./components/settings-project";
import { SettingsAccount } from "./components/settings-account";
import { SettingsNotification } from "./components/settings-notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Path = "general" | "project" | "system" | "notification" | "account"
type Tab = { path: Path, component?: React.ElementType }
type Params = { params: Promise<{ tab: Path }> }

export const dynamic = 'force-dynamic';

const tabs: Tab[] = [
    { path: 'general', component: SettingsGeneral },
    { path: 'project', component: SettingsProject },
    { path: 'notification', component: SettingsNotification },
    { path: 'system', component: SettingsSystem },
    { path: 'account', component: SettingsAccount },
] as const;

export async function generateMetadata({ params }: Params) {
    const { tab: key } = await params;
    const tab = tabs.find(t => t.path === key);

    if (!tab) return {};

    const title = `${tab.path.charAt(0).toUpperCase()}${tab.path.slice(1)} settings`;
    return createMetadata({ title });
}

async function Comp({ params }: Params) {
    const { tab: key } = await params;
    const tab = tabs.find(t => t.path === key);

    if (!tab) notFound();

    return (
        <div className="grid gap-4">
            <Translate as="h1" capitalize value={tab.path} className="text-3xl font-bold tracking-tight" />
            <Tabs value={tab.path} className="w-full">
                <TabsList className="flex flex-wrap w-fit h-fit justify-around">
                    {tabs.map((item, idx) => (
                        <TabsTrigger asChild key={idx} value={item.path}>
                            <Link href={`/settings/${item.path}`}>
                                <Translate capitalize value={item.path} />
                            </Link>
                        </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map((tab, idx) => (
                    <TabsContent key={idx} value={tab.path}>
                        {tab?.component && <tab.component />}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

export default function Page({ params }: Params) {
    return (
        <Dashboard className="lg:pt-12">
            <Suspense fallback={<SettingsFallback />}>
                <Comp params={params} />
            </Suspense>
        </Dashboard>
    );
}