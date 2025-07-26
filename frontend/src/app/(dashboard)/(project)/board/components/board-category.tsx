'use client'
import Link from "next/link";
import { cn } from "@/lib/utils"
import { toast } from "sonner";
import { logger } from "@/lib/logger";

import { Kbd } from "@/components/kbd"
import { Issue } from "@/types/schemas/issue"
import { useProject } from "@/stores/project";
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/ui/button"
import { BanIcon, PlusIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Translate } from "@/components/translate";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ScrollArea } from "@/components/ui/scroll-area"
import { createOrUpdateIssue } from "@/lib/services/issues";
import { IssueFormDialog } from "@/components/issue-dialog";

import { DndProvider, useDrag, useDrop } from "react-dnd";
import { AvatarWithPreview } from "@/components/image-preview";
import { useRef, useMemo, useState, useEffect, useCallback } from "react"
import { IssueStatus, PRIORITY_MAP, ISSUE_TYPE_MAP, STATUS_MAP } from "@/types/misc"
import { useBoardIssues, useBoardOptions, useQueue, useSearch, useSort } from "../use-board"

const DROP_TAGET = "ISSUE_CARD";
type CollectDrop = { isOver: boolean }
type CollectDrag = { isDragging: boolean }

const PRIORITY_ORDER = {
    highest: 0,
    high: 1,
    medium: 2,
    low: 3,
    lowest: 4,
} as const;

export function BoardCategory({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [sort] = useSort();
    const isMobile = useIsMobile();
    const [data] = useBoardIssues();
    const { options } = useBoardOptions();
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const issues = useMemo(() => {
        const groups = Object.fromEntries(
            Object.keys(STATUS_MAP).filter(
                (status) => !options.filterStatus?.includes(status as keyof typeof STATUS_MAP)
            ).map(type => [type, [] as Issue[]])
        ) as Record<IssueStatus, Issue[]>;

        data.forEach(issue => {
            if (options.filterStatus?.includes(issue.status)) return;

            if (!options.showTask && (!issue.parents || issue.type === 'task')) return;
            if (!options.showSubtask && (!!issue.parents || issue.type === 'subtask')) return;
            if (options.hideBug && issue.type === 'bug') return;
            if (options.hideStory && issue.type === 'story') return;
            if (options.hideEpic && issue.type === 'epic') return;

            groups[issue.status].push(issue);
        });

        Object.values(groups).forEach(group => {
            if (sort === 'date') {
                group.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            } else {
                group.sort((a, b) => {
                    const priorityA = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.medium;
                    const priorityB = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.medium;
                    return priorityA - priorityB;
                });
            }
        });

        return groups
    }, [data, sort, options]);

    return (
        <DndProvider
            options={{ enableMouseEvents: true }}
            backend={isMobile ? TouchBackend : HTML5Backend}
        >
            <div
                {...props}
                className={cn('flex flex-col h-full py-4', className)}
            >
                <Translate value="board.shortcut.create" className="mb-2 block justify-self-end text-xs">
                    <Kbd>Shift</Kbd> + <Kbd>N</Kbd>
                </Translate>
                <div className="grid xl:flex flex-wrap h-full gap-3">
                    {Object.entries(issues).map(([key, values], idx) => (
                        <Category
                            key={idx}
                            data={values}
                            isDragging={isDragging}
                            onDrag={setIsDragging}
                            category={key as IssueStatus}
                        />
                    ))}
                </div>
            </div>
        </DndProvider>
    )
}

interface CategoryProps {
    category: IssueStatus
    data: Issue[]
    isDragging?: boolean
    onDrag?: (state: boolean) => void
    className?: string
}

function Category({
    category,
    data,
    isDragging,
    onDrag,
    className
}: CategoryProps) {
    const [search] = useSearch();
    const [queue, setQueue] = useQueue();
    const [issues, setIssues] = useBoardIssues();

    const { active, checkPermission } = useProject();
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);
    const levelEditor = useMemo(() => checkPermission('editor'), [active]);

    const columnRef = useRef<HTMLDivElement>(null);
    const [columnHeight, setColumnHeight] = useState<number>(0);
    const [openDialog, setOpenDialog] = useState(false);

    const handleDrop = useCallback(
        async (item: Issue) => {
            if (item.status === category) {
                return;
            }

            if (!queue.includes(item.id)) {
                setQueue(prev => [...prev, item.id]);
            }

            const updated = {
                ...item,
                status: category,
                // updatedAt: new Date().toString() // for optimistic update
            }

            // enable for optimistic update
            // setIssues(prev => prev.map(v => v.id === item.id ? updated : v));

            try {
                const { data, error } = await createOrUpdateIssue(updated);

                if (!data) {
                    toast.error(error);
                    setIssues(issues);
                    return
                }

                setIssues(prev => prev.map(v => v.id === data.id ? data : v));
            } catch (error) {
                logger.warn(error);
                setIssues(issues);
            } finally {
                setQueue(prev => prev.filter(id => id != item.id))
            }
        },
        [category, queue, issues]
    );

    const [{ isOver }, dropRef] = useDrop<Issue, any, CollectDrop>(
        () => ({
            accept: DROP_TAGET,
            canDrop: () => levelEditor,
            drop: handleDrop,
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            })
        }),
        [category]
    );

    const filterIssues = useMemo(() => {
        const query = search.toLowerCase();
        return data.filter((v) =>
            ['title', 'type', 'status', 'user.name'].some((field) => {
                const value = v[field as keyof Issue];
                return (
                    typeof value === 'string' &&
                    value.toLowerCase().includes(query)
                );
            })
        )
    }, [data, search]);

    useEffect(() => {
        if (columnRef.current) {
            setColumnHeight(columnRef.current.offsetHeight);
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key.toLowerCase() === 'n') {
                if (!document.activeElement || document.activeElement === document.body) {
                    e.preventDefault();
                    setOpenDialog(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setOpenDialog]);

    return (
        <>
            <div
                ref={dropRef as unknown as React.Ref<HTMLDivElement>}
                className={cn(
                    'relative flex h-full w-full xl:w-[260px] xl:max-w-[260px] flex-col rounded-md bg-sidebar',
                    className
                )}
            >
                {/* drop area */}
                <div
                    className={cn(
                        "absolute z-50 box-border h-[100%] w-[100%] rounded p-1.5 duration-200",
                        isDragging ? "visible" : "hidden",
                        isOver || "bg-muted/70"
                    )}
                >
                    <div
                        className={cn(
                            "relative h-full w-full rounded border-2",
                            isDragging ? "visible" : "hidden",
                            isOver
                                ? "border-solid border-success"
                                : "flex items-center justify-center border-dashed border-primary"
                        )}
                    >
                        {!isOver && <Translate value="drop.here" className="rounded bg-accent px-1" />}
                    </div>
                </div>
                {/* header */}
                <div className="sticky left-0 top-0 flex justify-between items-center px-3 py-2.5 xtext-primary text-xs uppercase duration-200 ease-in-out">
                    <div className="flex items-center max-w-40 gap-2">
                        <span className="uppercase">{category.replace('_', ' ')}</span>
                        <Kbd className="py-0.5 px-2">{filterIssues.length}</Kbd>
                    </div>
                    {levelAdmin && (
                        <Tooltip label="Create new" side="top">
                            <Button
                                size="icon"
                                variant="outline"
                                className="size-6 rounded-md"
                                onClick={() => setOpenDialog(!openDialog)}
                            >
                                <PlusIcon />
                            </Button>
                        </Tooltip>
                    )}
                </div>
                <div ref={columnRef} className="h-full min-h-96">
                    <ScrollArea>
                        <div style={{ height: `${columnHeight}px` }}>
                            <ul className="mt-1 xl:max-w-[260px] px-3 pb-1">
                                {!filterIssues.length ? (
                                    <li className="mt-4 flex flex-col items-center text-center text-muted-foreground">
                                        <BanIcon className="size-10" />
                                        <Translate as="p" value="no.issue.found" className="mt-4 text-xs uppercase max-w-40" />
                                    </li>
                                ) : filterIssues.map((item, idx) => (
                                    <li key={idx} className="mb-2">
                                        <IssueCard issue={item} onDrag={onDrag} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <IssueFormDialog
                open={openDialog}
                defaultStatus={category}
                onOpenChange={setOpenDialog}
                onSave={(value) => {
                    setIssues((prev) =>
                        prev.some(v => v.id === value.id)
                            ? prev.map(t => t.id === value.id ? value : t)
                            : [...prev, value]
                    );
                }}
            />
        </>
    )
}

interface IssueCardProps {
    issue: Issue
    onDrag?: (state: boolean) => void
}

function IssueCard({
    issue,
    onDrag,
}: IssueCardProps) {
    const [queue] = useQueue();
    const { options } = useBoardOptions();

    const { active, checkPermission } = useProject();
    const user = useMemo(() =>
        active?.users?.find(v => v.id === issue.assigneeId),
        [active]
    );

    const levelEditor = useMemo(() => checkPermission('editor'), [active]);
    const isWaiting = useMemo(() => queue.includes(issue.id), [queue]);
    const TypeIcon = useMemo(() => ISSUE_TYPE_MAP[issue.type], [issue.type]);
    const PriorityIcon = useMemo(() => PRIORITY_MAP[issue.priority], [issue.priority]);

    const [{ isDragging }, dragRef] = useDrag<Issue, unknown, CollectDrag>(
        () => ({
            type: DROP_TAGET,
            canDrag: () => levelEditor,
            item: issue,
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging()
            })
        }),
        [issue]
    );

    useEffect(() => {
        onDrag?.(isDragging);
    }, [isDragging, onDrag]);

    return (
        <div ref={isWaiting ? undefined : dragRef as unknown as React.Ref<HTMLDivElement>}>
            <div
                className={cn(
                    'group border shadow-sm text-card-foreground bg-card dark:bg-sidebar-accent hover:bg-accent/70 dark:hover:bg-sidebar-accent/70',
                    'flex flex-col cursor-pointer min-w-50 p-3 rounded-md duration-200 ease-in-out',
                    isWaiting && "opacity-50"
                )}
            >
                <Link
                    href={`/issue/${issue.id}`}
                    className="line-clamp-2 min-h-8 w-fit text-sm group-hover:text-primary hover:underline"
                >
                    {issue.title}
                </Link>
                <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-1">
                        <TypeIcon
                            className={cn(
                                'size-4',
                                issue.type === 'task' && 'text-primary',
                                issue.type === 'subtask' && 'text-primary',
                                issue.type === 'bug' && 'text-destructive',
                                issue.type === 'story' && 'text-success',
                                issue.type === 'epic' && 'text-purple-500',
                            )}
                        />
                        <span className="text-[11px] text-muted-foreground truncate">
                            {issue.type
                                .replace('_', ' ')
                                .replace(/^./, char => char.toUpperCase())
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {options.showAssignee && (
                            <AvatarWithPreview
                                src={user?.image}
                                tooltipSide="top"
                                tooltip={user?.name || "Unassigned"}
                                className="size-6 border cursor-pointer"
                                fallback={user?.name.slice(0, 1)}
                                classNames={{ fallback: 'bg-sidebar' }}
                            />
                        )}
                        <PriorityIcon
                            className={cn(
                                'size-4',
                                issue.priority === 'lowest' && 'text-success',
                                issue.priority === 'low' && 'text-success',
                                issue.priority === 'medium' && 'text-warning',
                                issue.priority === 'high' && 'text-destructive',
                                issue.priority === 'highest' && 'text-destructive',
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}