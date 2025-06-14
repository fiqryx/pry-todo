'use client'
import { cn } from '@/lib/utils';
import { useDrag, useDrop } from 'react-dnd';
import { Property } from 'csstype';
import { DndProvider } from 'react-dnd';
import { Tooltip } from '@/components/tooltip'
import { Button } from '@/components/ui/button';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckIcon, ChevronLeft, ChevronRight, ListFilterPlus } from 'lucide-react';
import { memo, useRef, useMemo, useState, useCallback, useEffect, forwardRef } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    format,
    addDays,
    addWeeks,
    addMonths,
    addQuarters,
    endOfWeek,
    endOfMonth,
    endOfQuarter,
    isSameDay,
    isSameWeek,
    isSameMonth,
    isSameQuarter,
    parseISO,
    isSameYear,
    subYears,
    addYears,
    differenceInDays,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    eachQuarterOfInterval,
} from "date-fns";

export type TRecord = { id: string, [key: string]: any }
export type TimeUnit = 'day' | 'week' | 'month' | 'quarter';
export type TStr<T, K = string> = (item: T) => K;
export type TEvent<T> = (item: T, startDate: Date, endDate: Date) => void;
export type TClick<T> = (startDate: Date, endDate: Date, item?: T,) => void;
export type UnitPosition = { left: string; width: string }
type KeyofValue<T, V = string> = keyof {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type TRecordWithPosition = TRecord & { position: UnitPosition | null }

const UnitMap: Record<TimeUnit, string> = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly',
    quarter: 'quarterly'
} as const;

const isInTimeUnit = (unit: TimeUnit, itemDate: Date, timeUnitDate: Date) => {
    switch (unit) {
        case 'day':
            return isSameDay(itemDate, timeUnitDate);
        case 'week':
            return isSameWeek(itemDate, timeUnitDate, { weekStartsOn: 1 });
        case 'month':
            return isSameMonth(itemDate, timeUnitDate);
        case 'quarter':
            return isSameQuarter(itemDate, timeUnitDate);
    }
};

const getValue = (item: TRecord, dateField: string | TStr<TRecord>) => {
    return typeof dateField === 'function'
        ? dateField(item)
        : item[dateField];
};

const getStringDateValue = (item: TRecord, dateField: string | TStr<TRecord>): string => {
    const value = typeof dateField === 'function'
        ? dateField(item)
        : item[dateField];
    return value instanceof Date ? format(value, 'yyyy-MM-dd') : value;
};

const getMinWidth = (unit: TimeUnit) => {
    switch (unit) {
        case 'day': return 'min-w-24';
        case 'week': return 'min-w-32';
        case 'month': return 'min-w-40';
        case 'quarter': return 'min-w-48';
        default: return 'min-w-24';
    }
};

export interface TConfig<T extends TRecord> {
    label: KeyofValue<T> | TStr<T>
    startDate: KeyofValue<T, Date | undefined> | TStr<T, Date>
    endDate: KeyofValue<T, Date | undefined> | TStr<T, Date>
    color?: string | ((value: T) => string);
    header?: (value: T) => React.ReactNode;
    render?: (value: T) => React.ReactNode;
}

export interface DateTimelineProps<T extends TRecord> extends
    Omit<React.ComponentProps<'div'>, 'onClick'> {
    data: T[]
    config: TConfig<T>
    timeUnit?: TimeUnit
    fromDate?: string
    toDate?: string
    onClick?: TClick<T>
    onMove?: TEvent<T>
    control?: boolean
    scrollToday?: boolean
    defaultDateRange?: 'year' | 'month' | 'custom'
    fallback?: React.ReactNode
    customActions?: React.ReactNode
    renderEmptyDate?: boolean
    height?: Property.Height<string | number>
    width?: Property.Width<string | number>
    showDay?: boolean
    onTimeUnitChange?: (unit: TimeUnit) => void
}

const DateTimeline = forwardRef<HTMLDivElement, DateTimelineProps<any>>(
    ({
        data = [],
        config,
        control,
        timeUnit = 'week',
        fromDate,
        toDate,
        onClick,
        onMove,
        className,
        style,
        scrollToday,
        defaultDateRange = 'year',
        customActions,
        fallback,
        renderEmptyDate,
        height,
        width,
        showDay,
        onTimeUnitChange,
        ...props
    }, ref) => {
        const timelineRef = useRef<HTMLDivElement>(null);
        const [currentTimeUnit, setCurrentTimeUnit] = useState(timeUnit);
        const [currentFromDate, setCurrentFromDate] = useState(() => {
            if (fromDate) return fromDate;
            const today = new Date();
            return defaultDateRange === 'year'
                ? format(subYears(today, 1), 'yyyy-MM-dd')
                : format(subYears(today, 0.5), 'yyyy-MM-dd');
        });
        const [currentToDate, setCurrentToDate] = useState(() => {
            if (toDate) return toDate;
            const today = new Date();
            return defaultDateRange === 'year'
                ? format(addYears(today, 1), 'yyyy-MM-dd')
                : format(addYears(today, 0.5), 'yyyy-MM-dd');
        });

        const unitList = useMemo(() => {
            const untis: TimeUnit[] = ['day', 'week', 'month', 'quarter'];
            return showDay ? untis : untis.filter(unit => unit !== 'day');
        }, [showDay]);

        const timeUnits = useMemo(() => {
            const start = parseISO(currentFromDate);
            const end = parseISO(currentToDate);

            switch (currentTimeUnit) {
                case 'day':
                    return eachDayOfInterval({ start, end });
                case 'week':
                    return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
                case 'month':
                    return eachMonthOfInterval({ start, end });
                case 'quarter':
                    return eachQuarterOfInterval({ start, end });
                default:
                    return eachDayOfInterval({ start, end });
            }
        }, [currentFromDate, currentToDate, currentTimeUnit]);

        const navigateTimeline = useCallback((direction: 'prev' | 'next') => {
            const amount = direction === 'prev' ? -1 : 1;
            let newFromDate: Date;
            let newToDate: Date;

            const fromDate = parseISO(currentFromDate);
            const toDate = parseISO(currentToDate);

            switch (currentTimeUnit) {
                case 'day':
                    newFromDate = addDays(fromDate, amount * 7);
                    newToDate = addDays(toDate, amount * 7);
                    break;
                case 'week':
                    newFromDate = addWeeks(fromDate, amount * 4);
                    newToDate = addWeeks(toDate, amount * 4);
                    break;
                case 'month':
                    newFromDate = addMonths(fromDate, amount * 3);
                    newToDate = addMonths(toDate, amount * 3);
                    break;
                case 'quarter':
                    newFromDate = addQuarters(fromDate, amount * 2);
                    newToDate = addQuarters(toDate, amount * 2);
                    break;
                default:
                    return;
            }

            setCurrentFromDate(format(newFromDate, 'yyyy-MM-dd'));
            setCurrentToDate(format(newToDate, 'yyyy-MM-dd'));
        }, [currentFromDate, currentToDate, currentTimeUnit]);

        const onScrollToToday = useCallback(() => {
            if (!timelineRef.current) return;

            const todayIndex = timeUnits.findIndex(unitDate => {
                const today = new Date();
                switch (currentTimeUnit) {
                    case 'day': return isSameDay(today, unitDate);
                    case 'week': return isSameWeek(today, unitDate);
                    case 'month': return isSameMonth(today, unitDate);
                    case 'quarter': return isSameQuarter(today, unitDate);
                }
            });

            if (todayIndex > -1) {
                const containerWidth = timelineRef.current.clientWidth;
                const scrollWidth = timelineRef.current.scrollWidth;
                const scrollPosition = (todayIndex / timeUnits.length) * scrollWidth - containerWidth / 3;
                timelineRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            }
        }, [timeUnits, currentTimeUnit]);

        const calculatePosition = useCallback((item: TRecord) => {
            const { startDate, endDate } = config;
            const startValue = getStringDateValue(item, startDate as string);
            const endValue = getStringDateValue(item, endDate as string);

            if (!startValue || !endValue) return null;

            const itemStart = parseISO(startValue);
            const itemEnd = parseISO(endValue);

            let startIndex = -1;
            let endIndex = -1;

            timeUnits.forEach((unitDate, index) => {
                if (isInTimeUnit(currentTimeUnit, itemStart, unitDate) && startIndex === -1) {
                    startIndex = index;
                }
                if (isInTimeUnit(currentTimeUnit, itemEnd, unitDate)) {
                    endIndex = index;
                }
            });

            if (startIndex === -1 || endIndex === -1) return null;

            const span = endIndex - startIndex + 1;
            return {
                left: `${(startIndex / timeUnits.length) * 100}%`,
                width: `${(span / timeUnits.length) * 100}%`
            };
        }, [config, timeUnits, currentTimeUnit]);

        const filterData = useMemo<TRecordWithPosition[]>(() => {
            return data
                .map((item) => {
                    const position = calculatePosition(item);
                    if (!position && !renderEmptyDate) return null;
                    return { ...item, position };
                }).filter(Boolean);
        }, [data, renderEmptyDate, calculatePosition]);

        const isNotEmpty = useMemo(() => {
            return filterData.find(v => v.position !== null) && filterData.length > 0
        }, [filterData])

        useEffect(() => {
            const id = requestIdleCallback(() => onScrollToToday());
            return () => cancelIdleCallback(id);
        }, []);

        useEffect(() => {
            if (scrollToday) onScrollToToday();
        }, [scrollToday, currentTimeUnit]);

        useEffect(() => {
            if (fromDate) setCurrentFromDate(fromDate);
            if (toDate) setCurrentToDate(toDate);
        }, [fromDate, toDate]);

        useEffect(() => {
            if (showDay === false && currentTimeUnit === 'day') {
                setCurrentTimeUnit('week')
            }
        }, [showDay, currentTimeUnit]);

        return (
            <DndProvider backend={HTML5Backend}>
                <div ref={ref} {...props} className="flex flex-col rounded-sm border">
                    {control && (
                        <div className="flex justify-between items-center bg-sidebar p-2">
                            <div className="flex flex-wrap items-center gap-1">
                                <Tooltip label="Previous">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => navigateTimeline('prev')}
                                        className='rounded-sm size-8'
                                    >
                                        <ChevronLeft />
                                    </Button>
                                </Tooltip>
                                <Tooltip label="Next">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => navigateTimeline('next')}
                                        className='rounded-sm size-8'
                                    >
                                        <ChevronRight />
                                    </Button>
                                </Tooltip>
                                <Button
                                    variant="outline"
                                    onClick={onScrollToToday}
                                    className='text-xs rounded-sm h-8'
                                >
                                    Today
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost-primary"
                                            className="bg-primary/20 font-semibold h-8"
                                        >
                                            <ListFilterPlus className="size-4" />
                                            Show in {UnitMap[currentTimeUnit]}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {unitList.map((key, idx) => (
                                            <DropdownMenuItem
                                                key={idx}
                                                onClick={() => {
                                                    setCurrentTimeUnit(key);
                                                    onTimeUnitChange?.(key);
                                                }}
                                                className="capitalize text-xs focus:text-primary focus:bg-primary/40"
                                            >
                                                {key}
                                                {key === currentTimeUnit && <CheckIcon className='ml-auto' />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {customActions}
                        </div>
                    )}

                    <ScrollArea viewportRef={timelineRef}>
                        <div
                            // ref={timelineRef}
                            style={{ scrollbarWidth: 'thin', maxHeight: height, maxWidth: width, ...style }}
                            className={cn('xoverflow-x-auto scroll-smooth flex-grow border-t', className)}
                        >
                            {/* need responsive here... */}
                            <div className="min-w-max relative">
                                <div className="sticky top-0 z-2 flex border-b border-input bg-sidebar">
                                    {isNotEmpty && <div className="w-52 flex-shrink-0" />}
                                    {timeUnits.map((unitDate) => (
                                        <div
                                            key={unitDate.toString()}
                                            className={cn(
                                                'flex-1 text-center py-2 border-x border-input',
                                                getMinWidth(currentTimeUnit),
                                                isInTimeUnit(currentTimeUnit, new Date(), unitDate) && 'bg-primary/10',
                                            )}
                                        >
                                            <DateTimelineHeader timeUnit={currentTimeUnit} date={unitDate} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex-1 border-b">
                                    {isNotEmpty ? filterData.map((item, idx) => {
                                        return <DateTimelineRow
                                            key={item.id || idx}
                                            item={item}
                                            onMove={onMove}
                                            config={config}
                                            onClick={onClick}
                                            timeUnits={timeUnits}
                                            position={item.position}
                                            currentTimeUnit={currentTimeUnit}
                                        />;
                                    }) : (
                                        <div className="flex flex-col w-full text-sm text-center text-muted-foreground border-x p-2">
                                            {fallback || 'No result'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ScrollBar orientation='horizontal' />
                    </ScrollArea>
                </div>
            </DndProvider>
        )
    }
) as <T extends TRecord>(
    props: DateTimelineProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;
(DateTimeline as React.FC).displayName = "DateTimeline";

interface DateTimelineRowProps extends
    Omit<React.ComponentProps<'div'>, 'onClick'> {
    item: TRecord
    currentTimeUnit: TimeUnit
    timeUnits: Date[]
    config: TConfig<any>
    onClick?: TClick<any>
    onMove?: TEvent<any>
    position: UnitPosition | null
}

const DateTimelineRow = memo(forwardRef<HTMLDivElement, DateTimelineRowProps>(
    ({ className, item, config, currentTimeUnit, timeUnits, position, onClick, onMove, ...props }, ref) => {
        const { label, color, startDate, endDate, render } = config;
        const getText = () => typeof label === 'function' ? label(item) : item[label as string];

        const getDates = useCallback((unitIndex: number, skipCalculate?: boolean) => {
            const newStartDate = timeUnits[unitIndex];
            const startValue = getStringDateValue(item, startDate as string);
            const endValue = getStringDateValue(item, endDate as string);

            if (!startValue || !endValue || skipCalculate) {
                return {
                    start: newStartDate,
                    end: getUnitEndDate(newStartDate, currentTimeUnit)
                };
            }

            const duration = differenceInDays(parseISO(endValue), parseISO(startValue));
            return {
                start: newStartDate,
                end: addDays(newStartDate, duration)
            };
        }, [item, startDate, endDate, currentTimeUnit, timeUnits]);

        const getUnitEndDate = useCallback((date: Date, unit: TimeUnit) => {
            switch (unit) {
                case 'week': return endOfWeek(date, { weekStartsOn: 1 });
                case 'month': return endOfMonth(date);
                case 'quarter': return endOfQuarter(date);
                default: return addDays(date, 1);
            }
        }, []);

        // eslint-disable-next-line
        const calculateEndDate = useCallback((start: Date, duration: number, unit: TimeUnit) => {
            if (unit === 'day') {
                return addDays(start, duration);
            }

            const originalEnd = addDays(start, duration);
            switch (unit) {
                case 'week':
                    return endOfWeek(originalEnd);
                case 'month':
                    return endOfMonth(originalEnd);
                case 'quarter':
                    return endOfQuarter(originalEnd);
                default:
                    return originalEnd;
            }
        }, []);

        return (
            <div
                ref={ref}
                className={cn('flex relative', className)}
                {...props}
            >
                <DateTimelineLabel item={item} config={config} />

                <div className="flex flex-1 relative overflow-auto xborder-b border-input">
                    {timeUnits.map((unit, idx) => (
                        <DateTimelineDropCell
                            key={unit.toString()}
                            item={item}
                            index={idx}
                            date={unit}
                            onClick={() => {
                                if (onClick) {
                                    const { start, end } = getDates(idx, true);
                                    onClick(start, end);
                                }
                            }}
                            currentTimeUnit={currentTimeUnit}
                            onDrop={(item, unitIndex) => {
                                if (onMove) {
                                    const { start, end } = getDates(unitIndex);
                                    onMove(item, start, end);
                                }
                            }}
                        />
                    ))}

                    {position && (
                        <DateTimelineDragItem
                            item={item}
                            position={position}
                            color={typeof color === 'function' ? color(item) : color}
                            onClick={() => {
                                if (onClick) {
                                    const start = getValue(item, startDate as string);
                                    const end = getValue(item, endDate as string);
                                    onClick(start, end, item,);
                                }
                            }}
                        >
                            <div
                                title={!render ? getText() : undefined}
                                className="flex items-center h-full text-xs truncate p-1"
                            >
                                {render ? render(item) : getText()}
                            </div>
                        </DateTimelineDragItem>
                    )}
                </div>
            </div>
        )
    }
));
DateTimelineRow.displayName = "DateTimelineRow"

interface DateTimelineHeaderProps {
    timeUnit: TimeUnit
    date: Date
}

const DateTimelineHeader = memo(function ({ timeUnit, date }: DateTimelineHeaderProps) {
    switch (timeUnit) {
        case 'day':
            return (
                <>
                    <div className="text-xs font-semibold">{format(date, "EEE")}</div>
                    <div className="text-xs text-muted-foreground">
                        {format(date, isSameYear(date, new Date()) ? "MMM d" : "MMM d ''yy")}
                    </div>
                </>
            );
        case 'week':
            return (
                <>
                    <div className="text-xs font-semibold">
                        Week {format(date, isSameYear(date, new Date()) ? "w" : "w ''yy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {format(date, "MMM d")} - {format(endOfWeek(date), "MMM d")}
                    </div>
                </>
            );
        case 'month':
            return (
                <>
                    <div className="text-xs font-semibold">{format(date, "MMMM")}</div>
                    <div className="text-xs text-muted-foreground">
                        {format(date, "yyyy")}
                    </div>
                </>
            );
        case 'quarter':
            return (
                <>
                    <div className="text-xs font-semibold">
                        Q{format(date, "q")} {format(date, "yyyy")}
                    </div>
                </>
            );
    }
});

interface DateTimelineLabelProps {
    item: TRecord
    config: TConfig<any>
    width?: number
}

const DateTimelineLabel = memo(function ({ item, config }: DateTimelineLabelProps) {
    const { label, header } = config;
    const getText = () => typeof label === 'function' ? label(item) : item[label as string];

    return (
        <>
            <div
                title={getText()}
                className="w-52 h-fit min-h-11 flex items-center flex-shrink-0 p-2 overflow-hidden bg-sidebar truncate z-1 sticky left-0 border-r"
            >
                {header ? header(item) : (
                    <span className="text-xs font-semibold">
                        {getText()}
                    </span>
                )}
            </div>
        </>
    )
});

interface DateTimelineDragItemProps extends
    React.ComponentProps<'div'> {
    item: TRecord
    color?: string
    position: UnitPosition
    children: React.ReactNode
}

const DateTimelineDragItem = memo(function ({
    item,
    color,
    position,
    children,
    className,
    ...props
}: DateTimelineDragItemProps) {
    const [{ isDragging }, drag] = useDrag({
        type: `timeline_item_${item.id}`,
        item: () => item,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    return (
        <div
            {...props}
            ref={drag as unknown as React.Ref<HTMLDivElement>}
            style={{
                left: position.left,
                width: position.width,
            }}
            className={cn(
                'absolute top-1 bottom-1 rounded-full cursor-move transition-opacity duration-100',
                isDragging ? "opacity-50" : "opacity-100",
                color || 'border bg-sidebar shadow',
                className
            )}
        >
            {children}
        </div>
    )
});

interface DateTimelineDropCellProps extends
    Omit<React.ComponentProps<'div'>, 'onDrop'> {
    item: TRecord
    index: number
    date: Date
    currentTimeUnit: TimeUnit
    onDrop?: (item: any, unitIndex: number) => void
    onClick?: () => void
}

const DateTimelineDropCell = memo(function ({
    item,
    index,
    currentTimeUnit,
    className,
    onDrop,
    ...props
}: DateTimelineDropCellProps) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: `timeline_item_${item?.id}`,
        drop: (item: any) => {
            onDrop?.(item, index);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop as unknown as React.Ref<HTMLDivElement>}
            className={cn(
                'flex-1 border-r border-input',
                getMinWidth(currentTimeUnit),
                isOver ? 'bg-accent' : 'hover:bg-accent',
                className
            )}
            {...props}
        />
    );
})

export {
    DateTimeline,
    DateTimelineHeader,
    DateTimelineRow,
    DateTimelineDragItem,
    DateTimelineDropCell
}