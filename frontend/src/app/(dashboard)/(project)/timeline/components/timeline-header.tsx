'use client'
import { cn } from "@/lib/utils"
import { useSearch } from "../use-timeline";
import { useProject } from "@/stores/project"
import { Fragment, useMemo, useEffect } from "react";

import { SearchIcon } from "lucide-react";
import { Input, InputIcon } from "@/components/ui/input"
import { AvatartUsers, InviteUserDialog } from "@/components/invite-user"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { useTranslation } from "react-i18next";
import { Translate, translateText } from "@/components/translate";

export function TimelineHeader({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { t } = useTranslation();
    const [search, setSearch] = useSearch();
    const { active, getTeams, checkPermission } = useProject();

    const teams = useMemo(getTeams, [active?.users]);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const breadcrumb = useMemo(() => [
        { label: 'project', url: '#' },
        { label: active?.name, url: '#' }
    ], [active]);

    useEffect(() => {
        if (!active) return
        document.title = `Timeline - ${active.name}`;
    }, [active]);

    return (
        <div
            {...props}
            className={cn(
                'flex flex-col gap-4',
                className
            )}
        >
            <div className="flex flex-col gap-1">
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumb?.map((item, idx) => (
                            <Fragment key={idx}>
                                <BreadcrumbItem className="hidden md:block hover:underline">
                                    <BreadcrumbLink href={item.url}>
                                        {translateText(t, item.label || '', { capitalize: true })}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {idx < breadcrumb.length - 1 && (
                                    <BreadcrumbSeparator className='hidden md:block'>
                                        /
                                    </BreadcrumbSeparator>
                                )}
                            </Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <Translate t={t} as="h1" value="timeline" className="capitalize text-2xl font-bold tracking-tight" />
                <div className="flex flex-wrap lg:flex-nowrap justify-between w-full items-end gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-30 focus:w-48 duration-200 ease-in-out"
                            placeholder={translateText(t, 'search', { capitalize: true })}
                        >
                            <InputIcon position="left">
                                <SearchIcon className="size-5" />
                            </InputIcon>
                        </Input>
                        <InviteUserDialog
                            users={teams}
                            allowInvite={levelAdmin}
                            title={translateText(t, 'your.teams', { capitalize: true })}
                            description={translateText(t,
                                levelAdmin ? 'invite.collaborators'
                                    : 'project.worker'
                            )}
                        >
                            <AvatartUsers users={teams} />
                        </InviteUserDialog>
                    </div>
                </div>
            </div>
        </div>
    )
}