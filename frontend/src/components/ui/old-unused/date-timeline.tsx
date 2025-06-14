/* eslint-disable */
import { useDrag, useDrop } from 'react-dnd';
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
    differenceInDays,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    eachQuarterOfInterval,
    isSameYear
} from "date-fns";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type TimeUnit = 'day' | 'week' | 'month' | 'quarter';

export interface TimelineItem {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    color?: string;
    [key: string]: any;
}

export interface TimelineProps {
    items: TimelineItem[];
    startDate: string;
    endDate: string;
    timeUnit?: TimeUnit;
    onItemMove?: (itemId: string, newStartDate: string, newEndDate: string) => void;
    renderItem?: (item: TimelineItem) => React.ReactNode;
    className?: string;
}

export const AdvancedTimeline: React.FC<TimelineProps> = ({
    items,
    startDate,
    endDate,
    timeUnit = 'day',
    onItemMove,
    renderItem,
    className = "",
}) => {
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);
    const timelineRef = useRef<HTMLDivElement>(null);
    const [currentTimeUnit, setCurrentTimeUnit] = useState<TimeUnit>(timeUnit);

    // Generate time units based on the current view
    const generateTimeUnits = () => {
        switch (currentTimeUnit) {
            case 'day':
                return eachDayOfInterval({ start: parsedStartDate, end: parsedEndDate });
            case 'week':
                return eachWeekOfInterval(
                    { start: parsedStartDate, end: parsedEndDate },
                    { weekStartsOn: 1 }
                );
            case 'month':
                return eachMonthOfInterval({ start: parsedStartDate, end: parsedEndDate });
            case 'quarter':
                return eachQuarterOfInterval({ start: parsedStartDate, end: parsedEndDate });
            default:
                return eachDayOfInterval({ start: parsedStartDate, end: parsedEndDate });
        }
    };

    const timeUnits = generateTimeUnits();

    // Format header based on time unit
    const formatHeader = (date: Date) => {
        switch (currentTimeUnit) {
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
                            {format(date, isSameYear(date, new Date()) ? "MMMM" : "MMMM ''yy")}
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
    };

    // Check if item is in time unit
    const isItemInTimeUnit = (itemDate: Date, timeUnitDate: Date) => {
        switch (currentTimeUnit) {
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

    // Calculate item position and width
    const calculateItemPosition = (item: TimelineItem) => {
        const itemStart = parseISO(item.startDate);
        const itemEnd = parseISO(item.endDate);

        // Find start and end indices
        let startIndex = -1;
        let endIndex = -1;

        timeUnits.forEach((unitDate, index) => {
            if (isItemInTimeUnit(itemStart, unitDate) && startIndex === -1) {
                startIndex = index;
            }
            if (isItemInTimeUnit(itemEnd, unitDate)) {
                endIndex = index;
            }
        });

        if (startIndex === -1 || endIndex === -1) return null;

        const span = endIndex - startIndex + 1;
        return {
            left: `${(startIndex / timeUnits.length) * 100}%`,
            width: `${(span / timeUnits.length) * 100}%`
        };
    };

    // Handle scroll to today
    const scrollToToday = () => {
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
            const scrollPosition = (todayIndex / timeUnits.length) * scrollWidth - containerWidth / 2;
            timelineRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToToday();
    }, [currentTimeUnit]);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={`flex flex-col ${className}`}>
                {/* Controls */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentTimeUnit('day')}
                            className={cn(
                                'px-3 py-1 text-sm rounded',
                                currentTimeUnit === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            )}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => setCurrentTimeUnit('week')}
                            className={cn(
                                'px-3 py-1 text-sm rounded',
                                currentTimeUnit === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setCurrentTimeUnit('month')}
                            className={cn(
                                'px-3 py-1 text-sm rounded',
                                currentTimeUnit === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            )}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => setCurrentTimeUnit('quarter')}
                            className={cn(
                                'px-3 py-1 text-sm rounded',
                                currentTimeUnit === 'quarter' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                            )}
                        >
                            Quarter
                        </button>
                    </div>
                    <button
                        onClick={scrollToToday}
                        className="px-3 py-1 text-sm bg-gray-200 rounded"
                    >
                        Today
                    </button>
                </div>

                {/* Timeline */}
                <div
                    ref={timelineRef}
                    className="overflow-x-auto scroll-smooth"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    <div className="min-w-max">
                        {/* Header with time units */}
                        <div className="flex border-b border-input">
                            <div className="w-48 flex-shrink-0"></div>
                            {timeUnits.map((unitDate) => (
                                <div
                                    key={unitDate.toString()}
                                    className={cn(
                                        'flex-1 min-w-24 text-center py-2 border-r border-input',
                                        isSameDay(new Date(), unitDate) && 'bg-blue-50 dark:bg-blue-900'
                                    )}
                                >
                                    {formatHeader(unitDate)}
                                </div>
                            ))}
                        </div>

                        {/* Timeline body */}
                        <div className="flex flex-col">
                            {items.map((item, idx) => (
                                <TimelineRow
                                    key={idx}
                                    item={item}
                                    timeUnits={timeUnits}
                                    currentTimeUnit={currentTimeUnit}
                                    onMove={onItemMove}
                                    renderItem={renderItem}
                                    calculatePosition={calculateItemPosition}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

const ItemTypes = {
    TIMELINE_ITEM: 'timeline_item'
};

const TimelineRow: React.FC<{
    item: TimelineItem;
    timeUnits: Date[];
    currentTimeUnit: TimeUnit;
    onMove?: (itemId: string, newStartDate: string, newEndDate: string) => void;
    renderItem?: (item: TimelineItem) => React.ReactNode;
    calculatePosition: (item: TimelineItem) => { left: string; width: string } | null;
}> = ({ item, timeUnits, currentTimeUnit, onMove, renderItem, calculatePosition }) => {
    const position = calculatePosition(item);

    if (!position) return null;

    return (
        <div className="flex relative h-12">
            {/* Item label */}
            <div className="w-48 flex-shrink-0 p-2 overflow-hidden bg-sidebar z-10 sticky left-0">
                {renderItem ? renderItem(item) : <div title={item.title} className="text-sm truncate font-medium">{item.title}</div>}
            </div>

            {/* Timeline cells */}
            <div className="flex flex-1 relative overflow-x-auto border-b border-input">
                {/* <div className="flex absolute top-0 bottom-0 min-w-max"> */}
                {timeUnits.map((unitDate, index) => (
                    <TimeUnitCell
                        key={unitDate.toString()}
                        date={unitDate}
                        index={index}
                        timeUnits={timeUnits}
                        currentTimeUnit={currentTimeUnit}
                        onItemDropped={(itemId, unitIndex) => {
                            if (onMove) {
                                const newStartDate = timeUnits[unitIndex];
                                const duration = differenceInDays(
                                    parseISO(item.endDate),
                                    parseISO(item.startDate)
                                );
                                let newEndDate = addDays(newStartDate, duration);

                                // Adjust for different time units
                                switch (currentTimeUnit) {
                                    case 'week':
                                        newEndDate = endOfWeek(addWeeks(newStartDate, duration / 7));
                                        break;
                                    case 'month':
                                        newEndDate = endOfMonth(addMonths(newStartDate, duration / 30));
                                        break;
                                    case 'quarter':
                                        newEndDate = endOfQuarter(addQuarters(newStartDate, duration / 90));
                                        break;
                                }

                                onMove(
                                    itemId,
                                    format(newStartDate, 'yyyy-MM-dd'),
                                    format(newEndDate, 'yyyy-MM-dd')
                                );
                            }
                        }}
                    />
                ))}
                {/* </div> */}

                {/* Item bar */}
                <DraggableTimelineItem item={item} position={position} />
            </div>
        </div>
    );
};

const DraggableTimelineItem: React.FC<{
    item: TimelineItem;
    position: { left: string; width: string };
}> = ({ item, position }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TIMELINE_ITEM,
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag as unknown as React.Ref<HTMLDivElement>}
            className={cn(
                'absolute top-1 bottom-1 rounded-md',
                item.color || "bg-blue-500",
                isDragging && "opacity-50"
            )}
            style={{
                left: position.left,
                width: position.width,
                cursor: "move",
            }}
        >
            <div className="p-1 text-white text-xs truncate">{item.title}</div>
        </div>
    );
};

const TimeUnitCell: React.FC<{
    date: Date;
    index: number;
    timeUnits: Date[];
    currentTimeUnit: TimeUnit;
    onItemDropped: (itemId: string, unitIndex: number) => void;
}> = ({ date, index, timeUnits, currentTimeUnit, onItemDropped }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TIMELINE_ITEM,
        drop: (item: { id: string }) => {
            onItemDropped(item.id, index);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    // Calculate minimum width based on time unit
    const getMinWidth = () => {
        switch (currentTimeUnit) {
            case 'day': return 'min-w-24';
            case 'week': return 'min-w-32';
            case 'month': return 'min-w-40';
            case 'quarter': return 'min-w-48';
            default: return 'min-w-24';
        }
    };

    return (
        <div
            ref={drop as unknown as React.Ref<HTMLDivElement>}
            className={cn(
                getMinWidth(),
                'flex-1 border-r border-input',
                isOver && 'bg-gray-100 dark:bg-gray-700'
            )}
        />
    );
};