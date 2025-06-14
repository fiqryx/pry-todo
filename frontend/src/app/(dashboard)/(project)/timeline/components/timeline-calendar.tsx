'use client'
import Link from 'next/link'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

import { useAppStore } from '@/stores/app'
import { localeMap } from '@/types/locale'
import { cn, sortByDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { ISSUE_MAPS } from '@/types/internal'
import { useProject } from '@/stores/project'
import { useTranslation } from 'react-i18next'
import { getIssueColorClass } from '@/lib/internal'
import { useCallback, useMemo, useState } from 'react'
import { createOrUpdateIssue } from '@/lib/services/issues'
import { Translate, translateText } from '@/components/translate'

import { Issue } from '@/types/schemas/issue'
import { Tooltip } from '@/components/tooltip'
import { Button } from '@/components/ui/button'
import { Calendar } from "@/components/ui/calendar"
import { IssueFormDialog } from '@/components/issue-dialog'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIssues, useSearch, useSort, useTimelineOptions } from '../use-timeline'
import { addDays, addMonths, endOfWeek, format, isAfter, isBefore, isSameYear, Locale } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCalendarTimeline, CalendarTimelineContent, CalendarTimelineControl, CalendarTimelineHeader, CalendarTimelineProvider, CalendarTimelineRows } from '@/components/ui/calendar-timeline';
import { CheckIcon, ChevronLeft, ChevronRight, ListFilterPlus, ArrowDownNarrowWide, CalendarIcon, Layers2, LayersIcon, UserIcon, RefreshCcw, PlusIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const unitMap = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly',
    quarter: 'quarterly'
} as const;

const PRIORITY_ORDER = {
    highest: 0,
    high: 1,
    medium: 2,
    low: 3,
    lowest: 4,
} as const;

export function TimelineCalendar({ className }: { className?: string }) {
    const app = useAppStore();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { active, getTeams, set: setProject } = useProject();

    const [search] = useSearch();
    const [sort, setSort] = useSort();
    const [issues, setIssues] = useIssues();
    const [options, setOptions] = useTimelineOptions();

    const [issue, setIssue] = useState<Issue>();
    const [startDate, setStartDate] = useState<Date>();
    const [dueDate, setDueDate] = useState<Date>();
    const [openDialog, setOpenDialog] = useState(false);

    const [date, setDate] = useState({
        from: addMonths(new Date(), -3),
        to: addMonths(new Date(), 3),
    });

    const locale = useMemo(() => localeMap[app.locale as 'en'], [app.locale]);

    const sorted = useMemo(() => {
        let data = [...issues];
        if (sort === 'priority') {
            data.sort((a, b) => {
                const priorityA = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.medium;
                const priorityB = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.medium;
                return priorityA - priorityB;
            });
        } else {
            data = sortByDate(data, 'createdAt', 'asc');
        }

        const query = search.toLowerCase();
        return data.filter((v) =>
            ['title', 'type', 'status', 'user.name'].some((field) => {
                const value = v[field as keyof Issue];
                return (
                    typeof value === 'string' &&
                    value.toLowerCase().includes(query)
                );
            })
        );
    }, [sort, issues, search]);

    const clearState = useCallback(() => {
        setIssue(undefined);
        setStartDate(undefined);
        setDueDate(undefined);
    }, []);

    const handleSave = useCallback((issue: Issue) => {
        setIssues((prev) =>
            prev.some(v => v.id === issue.id)
                ? prev.map(t => t.id === issue.id ? issue : t)
                : [...prev, issue]
        );
    }, [setIssues]);

    const timeline = useCalendarTimeline({
        unit: options.timeUnit || 'week',
        dateRange: date,
        data: sorted,
        field: {
            state: {
                header: 'title',
                startDate: 'startDate',
                endDate: (item) => item.dueDate || item.doneDate
            },
            header: (item) => {
                const Icon = ISSUE_MAPS.type[item.type];
                return (
                    <div className="flex flex-shrink-0 items-center gap-1.5 max-w-full">
                        <div className="icon">
                            <Icon className={cn('size-4', getIssueColorClass(item.type))} />
                        </div>
                        <Link href={`/issue/${item.id}`} className="text-xs truncate font-semibold underline-offset-1 hover:underline hover:text-primary">
                            {item.title}
                        </Link>
                    </div>
                )
            },
            cell: (item) => {
                const Status = ISSUE_MAPS.status[item.status];
                const Priority = ISSUE_MAPS.priority[item.priority];
                const assignee = getTeams().find(v => v.id === item.assigneeId);
                const startDate = item.startDate ? format(item.startDate, "EEE, MMM d ", { locale }) : '';
                const endDate = item.dueDate ? format(item.dueDate, "EEE, MMM d", { locale }) : ''

                return (
                    <div className="flex flex-shrink-0 items-center gap-1 max-w-full">
                        <Tooltip label={!assignee?.id ? 'Unassigned' : assignee.id === user?.id ? 'You' : assignee.name}>
                            <Avatar className="size-7 mr-1">
                                <AvatarImage src={assignee?.image} alt={assignee?.name} />
                                <AvatarFallback className="text-muted-foreground">
                                    {assignee?.name.slice(0, 1) || <UserIcon className="size-4" />}
                                </AvatarFallback>
                            </Avatar>
                        </Tooltip>
                        <div className="icon">
                            <Status className={cn('size-4', getIssueColorClass(item.status))} />
                        </div>
                        <div title={item.priority}>
                            <Priority className={cn('size-4', getIssueColorClass(item.priority))} />
                        </div>
                        <span title={`${startDate} - ${endDate}`} className="text-xs truncate font-normal">
                            {`${startDate} - ${endDate}`}
                        </span>
                    </div>
                )
            },
            onClick: ({ item, startDate, endDate }) => {
                setIssue(item || undefined);
                setStartDate(startDate);
                setDueDate(endDate);
                setOpenDialog(true);
            },
            onDrop: async ({ item, startDate, endDate: dueDate }) => {
                const issue = { ...item, startDate, dueDate }
                handleSave(issue);

                try {
                    const { data, error } = await createOrUpdateIssue(issue);
                    if (!data) {
                        toast.error(error);
                        return
                    }
                    clearState();
                    handleSave(data);
                    // toast.success("Update successfully");
                } catch (error) {
                    handleSave(item);
                    logger.error(error);
                    toast.error('An unexpected error occurred');
                }
            }
        },
    });

    return (
        <CalendarTimelineProvider
            context={timeline}
            className={className}
            force={options.showEmptyDate}
            hideRowHeader={!options.showPanel}
        >
            <CalendarTimelineControl className='justify-between'>
                <div className="flex items-center gap-1">
                    <Tooltip label={translateText(t, `${options.showPanel ? 'hide' : 'show'}.panel`)}>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setOptions({ showPanel: !options.showPanel })}
                            className='text-xs rounded-sm size-8'
                        >
                            {options.showPanel ? <PanelLeftClose /> : <PanelLeftOpen />}
                        </Button>
                    </Tooltip>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => timeline.navigate('prev')}
                        className='rounded-sm size-8'
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => timeline.navigate('next')}
                        className='rounded-sm size-8'
                    >
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={timeline.scrollToday}
                        className='text-xs rounded-sm h-8'
                    >
                        {translateText(t, 'today', { capitalize: true })}
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost-primary"
                                className="text-xs rounded-sm h-8 bg-primary/10 hover:bg-primary/30"
                            >
                                <ListFilterPlus className="size-4" />
                                <Translate t={t} capitalize value="show.in">
                                    {translateText(t, unitMap[timeline.unit])}
                                </Translate>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(unitMap).map((key, idx) => (
                                <DropdownMenuItem
                                    key={idx}
                                    onClick={() => setOptions({ timeUnit: key as 'week' })}
                                    className="capitalize text-xs focus:text-primary focus:bg-primary/40"
                                >
                                    {translateText(t, key)}
                                    {key === options.timeUnit && <CheckIcon className='ml-auto' />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost-primary"
                                className="text-xs rounded-sm h-8 bg-primary/10 hover:bg-primary/30"
                            >
                                <ArrowDownNarrowWide className="size-5" />
                                <Translate t={t} capitalize value="sort.by">
                                    {translateText(t, sort)}
                                </Translate>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {["date", "priority"].map((key, idx) => (
                                <DropdownMenuItem
                                    key={idx}
                                    onClick={() => setSort(key as 'date')}
                                    className="capitalize text-xs focus:text-primary focus:bg-primary/40"
                                >
                                    {translateText(t, key)}
                                    {key === sort && <CheckIcon className='ml-auto' />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost-primary"
                                className="text-xs rounded-sm h-8 bg-primary/10 hover:bg-primary/30"
                            >
                                <CalendarIcon className='size-5' />
                                {translateText(t, 'date.fields', { capitalize: true })}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <div className="flex gap-4">
                                <Calendar
                                    autoFocus
                                    mode="single"
                                    locale={locale}
                                    selected={date.from}
                                    defaultMonth={date.from}
                                    className="border-r pr-4"
                                    onSelect={(from) => {
                                        if (!from) return
                                        setDate((prev) => ({
                                            from,
                                            to: prev.to && isAfter(from, prev.to) ? addDays(from, 1) : prev.to
                                        }))
                                    }}
                                />
                                <Calendar
                                    autoFocus
                                    mode="single"
                                    locale={locale}
                                    selected={date.to}
                                    defaultMonth={date.to}
                                    disabled={(value) => isBefore(value, date.from || new Date())}
                                    onSelect={(to) => {
                                        if (!to) return
                                        setDate((prev) => ({ to, from: prev.from || addDays(to, -1) }))
                                    }}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Tooltip label={translateText(t, 'sync', { capitalize: true })}>
                        <Button
                            size="icon"
                            variant="outline"
                            className='size-8 rounded-sm'
                            onClick={() => setProject({ active })}
                        >
                            <RefreshCcw />
                        </Button>
                    </Tooltip>
                    <Tooltip label={translateText(t, 'add', { capitalize: true })}>
                        <Button
                            size="icon"
                            variant="outline"
                            className='size-8 rounded-sm'
                            onClick={() => {
                                clearState();
                                setOpenDialog(true);
                            }}
                        >
                            <PlusIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip label={translateText(t, options.showEmptyDate ? 'show.less' : 'show.more')}>
                        <Button
                            size="icon"
                            variant="outline"
                            className="text-xs rounded-sm size-8"
                            onClick={() => setOptions({ showEmptyDate: !options.showEmptyDate })}
                        >
                            {options.showEmptyDate ? <LayersIcon className='size-5' /> : <Layers2 className='size-5' />}
                        </Button>
                    </Tooltip>
                </div>
            </CalendarTimelineControl>

            <CalendarTimelineContent className='max-h-[40rem]'>
                <CalendarTimelineHeader
                    render={(date) => (
                        <TimelineCalendarHeader
                            date={date}
                            locale={locale}
                            unit={options.timeUnit || 'week'}
                            weekLabel={translateText(t, 'week', { capitalize: true })}
                        />
                    )}
                />
                <CalendarTimelineRows />
            </CalendarTimelineContent>

            <IssueFormDialog
                issue={issue}
                open={openDialog}
                onSave={handleSave}
                defaultDueDate={dueDate}
                defaultStartDate={startDate}
                onOpenChange={setOpenDialog}
                excludeType={[!!issue?.parents ? 'task' : 'subtask']}
            />
        </CalendarTimelineProvider>
    )
}

interface TimelineCalendarHeaderProps {
    date: Date
    locale: Locale
    unit: "day" | "week" | "month" | "quarter"
    weekLabel?: string
}

function TimelineCalendarHeader({ date, locale, unit, weekLabel }: TimelineCalendarHeaderProps) {
    switch (unit) {
        case 'day':
            return (
                <>
                    <div className="text-xs font-semibold capitalize">{format(date, "EEE", { locale })}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {format(date, isSameYear(date, new Date()) ? "MMM d" : "MMM d ''yy", { locale })}
                    </div>
                </>
            );
        case 'week':
            return (
                <>
                    <div className="text-xs font-semibold">
                        {weekLabel ?? 'Week'} {format(date, isSameYear(date, new Date()) ? "w" : "w ''yy", { locale })}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {format(date, "MMM d", { locale })} - {format(endOfWeek(date, { weekStartsOn: 1 }), "MMM d", { locale })}
                    </div>
                </>
            );
        case 'month':
            return (
                <>
                    <div className="text-xs font-semibold capitalize">{format(date, "MMMM", { locale })}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                        {format(date, "yyyy", { locale })}
                    </div>
                </>
            );
        case 'quarter':
            return (
                <>
                    <div className="text-xs font-semibold capitalize">
                        Q{format(date, "q", { locale })} {format(date, "yyyy", { locale })}
                    </div>
                </>
            );
    }
}