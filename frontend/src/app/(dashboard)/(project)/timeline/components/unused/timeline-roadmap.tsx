'use client'
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { config } from "./timeline-config"
import { cn, sortByDate } from "@/lib/utils"
import { Issue } from "@/types/schemas/issue"
import { IssueFormDialog } from "@/components/issue-dialog"
import { createOrUpdateIssue } from "@/lib/services/issues"

import { format, addMonths } from "date-fns"
import { TimelineActions } from "./timeline-actions"
import { useCallback, useMemo, useState } from "react"
import { DateTimeline, TClick, TEvent } from "@/components/ui/old-unused/date-timeline-v2"
import { useIssues, useSearch, useSort, useTimelineOptions } from "../../use-timeline"

const PRIORITY_ORDER = {
    highest: 0,
    high: 1,
    medium: 2,
    low: 3,
    lowest: 4,
} as const;

export function TimelineRoadmap({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [sort] = useSort();
    const [search] = useSearch();
    const [issues, setIssues] = useIssues();
    const [options, setOptions] = useTimelineOptions();

    const [issue, setIssue] = useState<Issue>();
    const [startDate, setStartDate] = useState<Date>();
    const [dueDate, setDueDate] = useState<Date>();

    const [openDialog, setOpenDialog] = useState(false);
    const [date, setDate] = useState({
        from: addMonths(new Date(), -6),
        to: addMonths(new Date(), 6),
    });

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

    const handleClick: TClick<Issue> = useCallback((startDate, dueDate, item) => {
        setIssue(item);
        setStartDate(startDate);
        setDueDate(dueDate);
        setOpenDialog(true);
    }, [setOpenDialog]);

    const handleMove: TEvent<Issue> = useCallback(async (item, startDate, dueDate) => {
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
    }, [handleSave]);

    return (
        <div {...props} className={cn('flex flex-col gap-4', className)}>
            <DateTimeline
                control
                scrollToday
                data={sorted}
                config={config}
                className="max-h-[42rem]"
                onMove={handleMove}
                onClick={handleClick}
                timeUnit={options.timeUnit}
                showDay={options.showDayOnTimeline}
                renderEmptyDate={!options.showEmptyDate}
                fromDate={format(date.from, "yyyy-MM-dd")}
                toDate={format(date.to, "yyyy-MM-dd")}
                onTimeUnitChange={(timeUnit) => setOptions({ timeUnit })}
                customActions={(
                    <TimelineActions
                        date={date}
                        setDate={setDate}
                        onCreateNew={() => {
                            clearState();
                            setOpenDialog(true);
                        }}
                    />
                )}
            />

            <IssueFormDialog
                issue={issue}
                open={openDialog}
                onSave={handleSave}
                defaultDueDate={dueDate}
                defaultStartDate={startDate}
                onOpenChange={setOpenDialog}
                excludeType={[!!issue?.parents ? 'task' : 'subtask']}
            />
        </div>
    )
}
