'use client'
import { cn } from "@/lib/utils"
import { useProject } from "@/stores/project"
import { useTranslation } from "react-i18next"
import { Translate, translateText } from "@/components/translate"

import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/tooltip"
import { SwitchField } from "@/components/switch-field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input, InputIcon } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { useBoardOptions, useSearch, useSort } from "../use-board"
import { AvatartUsers, InviteUserDialog } from "@/components/invite-user"

import { useMemo, useEffect, Fragment } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SearchIcon, Settings2, EllipsisVertical, RefreshCcw, ArrowDownNarrowWide, ClockFading, FlagIcon, CheckIcon } from "lucide-react"

const sortMap = {
    date: ClockFading,
    priority: FlagIcon
} as const

export function BoardAction({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [sort, setSort] = useSort();
    const [search, setSearch] = useSearch();

    const { t } = useTranslation();
    const { options, setOptions, setFilterStatus } = useBoardOptions();
    const { active, getTeams, checkPermission, set } = useProject();

    const teams = useMemo(getTeams, [active?.users]);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const breadcrumb = useMemo(() => [
        { label: 'project', url: '#' },
        { label: active?.name, url: '#' }
    ], [active]);

    useEffect(() => {
        if (!active) return
        document.title = `Board - ${active.name}`;
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
                                        <Translate t={t} capitalize value={item.label ?? ''} />
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
                <Translate t={t} capitalize as="h1" value="board" className="text-2xl font-bold tracking-tight" />
            </div>
            <div className="flex flex-col lg:flex-row justify-between w-full lg:items-center gap-2">
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                    <Input
                        type="search"
                        value={search}
                        wrapperClassName="w-fit"
                        className="w-30 focus:w-48 duration-200 ease-in-out"
                        placeholder={translateText(t, 'search.board', { capitalize: true })}
                        onChange={(e) => setSearch(e.target.value)}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge
                                variant="primary"
                                className="font-semibold py-1 px-1.5 gap-2 w-full max-w-40 cursor-pointer"
                            >
                                <ArrowDownNarrowWide className="size-5" />
                                <Translate t={t} capitalize value="sort.by" className="truncate">
                                    {translateText(t, sort)}
                                </Translate>
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40">
                            {Object.entries(sortMap).map(([key, Icon], idx) => (
                                <DropdownMenuItem
                                    key={idx}
                                    onClick={() => setSort(key as keyof typeof sortMap)}
                                    className="text-xs focus:text-primary focus:bg-primary/40"
                                >
                                    <Icon className="size-5" />
                                    <Translate t={t} capitalize value={key} />
                                    {sort === key && <CheckIcon className="size-5 ml-auto" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex w-full lg:w-fit flex-wrap gap-1">
                    <Tooltip label={translateText(t, 'sync')}>
                        <Button
                            size="icon"
                            variant="outline"
                            className="rounded-md size-8"
                            onClick={() => set({ active })}
                        >
                            <RefreshCcw />
                        </Button>
                    </Tooltip>
                    <Popover>
                        <PopoverTrigger>
                            <Tooltip label={translateText(t, 'options', { capitalize: true })}>
                                <div
                                    className={cn(
                                        buttonVariants({ size: 'icon', variant: 'outline' }),
                                        'rounded-md size-8'
                                    )}
                                >
                                    <Settings2 />
                                </div>
                            </Tooltip>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[22rem] p-0">
                            <ScrollArea className="p-4">
                                <div className="grid h-full max-h-90 gap-4">
                                    <div className="gird">
                                        <Translate t={t} as="h6" capitalize value="visible.columns" className="text-sm font-semibold" />
                                        <div className="grid gap-2">
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                onChange={() => setFilterStatus('draft')}
                                                checked={!options.filterStatus?.includes('draft')}
                                                label="Draft"
                                                description={translateText(t, 'display.board.description', {
                                                    name: "draft",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                onChange={() => setFilterStatus('todo')}
                                                checked={!options.filterStatus?.includes('todo')}
                                                label="Todo"
                                                description={translateText(t, 'display.board.description', {
                                                    name: "todo",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                onChange={() => setFilterStatus('on_progress')}
                                                checked={!options.filterStatus?.includes('on_progress')}
                                                label="On progress"
                                                description={translateText(t, 'display.board.description', {
                                                    name: "on progress",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                onChange={() => setFilterStatus('done')}
                                                checked={!options.filterStatus?.includes('done')}
                                                label="Done"
                                                description={translateText(t, 'display.board.description', {
                                                    name: "done",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid">
                                        <Translate t={t} as="h6" capitalize value="board.options" className="text-sm font-semibold" />
                                        <div className="grid gap-2">
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.showAssignee}
                                                onChange={(showAssignee) => setOptions({ showAssignee })}
                                                label={translateText(t, 'show.assignees')}
                                                description={translateText(t, 'show.assignees.description', {
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.showTask}
                                                onChange={(showTask) => setOptions({ showTask })}
                                                label={translateText(t, 'show.parent.task')}
                                                description={translateText(t, 'show.parent.task.description', {
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.showSubtask}
                                                onChange={(showSubtask) => setOptions({ showSubtask })}
                                                label={translateText(t, 'show.child.task')}
                                                description={translateText(t, 'show.child.task.description', {
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.hideBug}
                                                onChange={(hideBug) => setOptions({ hideBug })}
                                                label={translateText(t, 'hide.type', { type: "bugs" })}
                                                description={translateText(t, 'hide.type.description', {
                                                    type: "bugs",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.hideStory}
                                                onChange={(hideStory) => setOptions({ hideStory })}
                                                label={translateText(t, 'hide.type', { type: "stories" })}
                                                description={translateText(t, 'hide.type.description', {
                                                    type: "stories",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                            <SwitchField
                                                className="max-w-60 truncate"
                                                checked={options.hideEpic}
                                                onChange={(hideEpic) => setOptions({ hideEpic })}
                                                label={translateText(t, 'hide.type', { type: "epics" })}
                                                description={translateText(t, 'hide.type.description', {
                                                    type: "epics",
                                                    on: translateText(t, 'board')
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Button
                        size="icon"
                        variant="outline"
                        className="hidden rounded-md size-8"
                    >
                        <EllipsisVertical />
                    </Button>
                </div>
            </div>
        </div>
    )
}