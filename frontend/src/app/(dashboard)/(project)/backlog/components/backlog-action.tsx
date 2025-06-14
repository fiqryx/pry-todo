'use client'
import { cn } from "@/lib/utils"
import { useProject } from "@/stores/project"
import { useIssues } from "../use-issue"
import { Issue } from "@/types/schemas/issue"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/tooltip"
import { useTranslation } from "react-i18next"
import { useGroup, useLayout } from "../use-layout"
import { IssueFormDialog } from "@/components/issue-dialog"
import { Translate, translateText } from "@/components/translate"
import { useEffect, useMemo, Fragment, useCallback } from "react"
import { AvatartUsers, InviteUserDialog } from "@/components/invite-user"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, ListIcon, RefreshCcw, LayoutList, EllipsisVertical, FileInput, FileOutput, FlagIcon, ArrowDownNarrowWide, TagIcon, CircleDotIcon, CheckIcon } from "lucide-react"

const groupMap = {
    type: TagIcon,
    priority: FlagIcon,
    status: CircleDotIcon
} as const

export function BacklogActions({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const { t } = useTranslation();
    const setIssues = useIssues()[1];
    const [group, setGroup] = useGroup();
    const [layout, setLayout] = useLayout();

    const {
        set,
        active,
        checkPermission,
        getTeams,
    } = useProject();

    const teams = useMemo(getTeams, [active?.users]);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const handleSave = useCallback((issue: Issue) => {
        setIssues((prev) =>
            prev.some(v => v.id === issue.id)
                ? prev.map(t => t.id === issue.id ? issue : t)
                : [...prev, issue]
        );
    }, [setIssues]);

    const breadcrumb = useMemo(() => [
        { label: 'project', url: '#' },
        { label: active?.name, url: '#' }
    ], [active]);

    useEffect(() => {
        if (!active) return
        document.title = `Backlog - ${active.name}`;
    }, [active]);

    return (
        <div
            {...props}
            className={cn(
                'flex flex-col lg:flex-row justify-between w-full lg:items-end gap-4',
                className
            )}
        >
            <div className="flex flex-col xw-full gap-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumb?.map((item, idx) => (
                            <Fragment key={idx}>
                                <BreadcrumbItem className="hidden md:block hover:underline">
                                    <BreadcrumbLink href={item.url}>
                                        <Translate t={t} capitalize value={item.label || ''} />
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
                <Translate t={t} capitalize as='h1' value="backlog" className="text-2xl font-bold tracking-tight" />
            </div>
            <div className="flex flex-wrap items-center lg:justify-end xw-full gap-2.5">
                {layout === 'group' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge
                                variant="primary"
                                className="font-semibold py-1 px-1.5 gap-2 w-full max-w-40 hover:cursor-pointer"
                            >
                                <ArrowDownNarrowWide className="size-5" />
                                <Translate t={t} capitalize value="group.by" className="truncate">
                                    {translateText(t, group)}
                                </Translate>
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40">
                            {Object.entries(groupMap).map(([key, Icon], idx) => (
                                <DropdownMenuItem
                                    key={idx}
                                    onClick={() => setGroup(key as keyof typeof groupMap)}
                                    className="capitalize text-xs focus:text-primary focus:bg-primary/40"
                                >
                                    {typeof Icon !== 'string' && <Icon className="size-5" />}
                                    <Translate t={t} value={key} />
                                    {group === key && <CheckIcon className="ml-auto" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <InviteUserDialog
                    users={teams}
                    allowInvite={levelAdmin}
                    title={translateText(t, 'your.teams', { capitalize: true })}
                    description={translateText(t,
                        levelAdmin ? 'invite.collaborators'
                            : 'project.worker'
                    )}
                >
                    <AvatartUsers
                        users={teams}
                        placeholder={levelAdmin ? translateText(t, "invite.user", { capitalize: true }) : ""}
                    />
                </InviteUserDialog>
                <div className="flex flex-wrap items-center gap-1">
                    <Tooltip label={translateText(t, "sync", { capitalize: true })}>
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-md size-8"
                            onClick={() => set({ active })}
                        >
                            <RefreshCcw />
                        </Button>
                    </Tooltip>
                    {levelAdmin && (
                        <IssueFormDialog
                            onSave={handleSave}
                            disabled={!levelAdmin}
                            excludeType={['subtask']}
                        >
                            <Button size="icon" variant="outline" className="rounded-md size-8">
                                <Plus />
                            </Button>
                        </IssueFormDialog>
                    )}
                    <ToggleGroup
                        size="sm"
                        type="single"
                        value={layout}
                        onValueChange={(v) => setLayout(v as 'list')}
                        className="border rounded-md h-8 gap-[1px]"
                    >
                        <Tooltip label={translateText(t, 'group', { capitalize: true })}>
                            <ToggleGroupItem
                                value="group"
                                className={cn(
                                    'hover:cursor-pointer',
                                    layout === 'group' && 'bg-accent'
                                )}
                            >
                                <LayoutList className="size-4" />
                            </ToggleGroupItem>
                        </Tooltip>
                        <Tooltip label={translateText(t, 'list', { capitalize: true })}>
                            <ToggleGroupItem
                                value="list"
                                className={cn(
                                    'hover:cursor-pointer',
                                    layout === 'list' && 'bg-accent'
                                )}
                            >
                                <ListIcon className="size-4" />
                            </ToggleGroupItem>
                        </Tooltip>
                    </ToggleGroup>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="outline" className="rounded-md size-8">
                                <EllipsisVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => set({ active })}>
                                <div className="flex items-center gap-2">
                                    <RefreshCcw className="size-4" />
                                    <Translate t={t} capitalize value="refresh" className="text-xs truncate" />
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {levelAdmin && (
                                <DropdownMenuItem disabled>
                                    <div className="flex items-center gap-2">
                                        <FileInput className="size-4" />
                                        <Translate t={t} capitalize value="import" className="text-xs truncate" />
                                    </div>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>
                                <div className="flex items-center gap-2">
                                    <FileOutput className="size-4" />
                                    <Translate t={t} capitalize value="export" className="text-xs truncate" />
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}