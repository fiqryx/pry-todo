/* eslint-disable */
'use client'
import { DndProvider } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, isSameDay, parseISO } from "date-fns";

interface TimelineItem {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    color?: string;
    [key: string]: any;
}

interface TimelineProps {
    items: TimelineItem[];
    startDate: string;
    endDate: string;
    onItemMove?: (itemId: string, newStartDate: string, newEndDate: string) => void;
    renderItem?: (item: TimelineItem) => React.ReactNode;
    className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
    items,
    startDate,
    endDate,
    onItemMove,
    renderItem,
    className = "",
}) => {
    const parsedStartDate = parseISO(startDate);
    const parsedEndDate = parseISO(endDate);

    const daysCount = Math.ceil(
        (parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const dates = Array.from({ length: daysCount }, (_, i) =>
        addDays(parsedStartDate, i)
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={`overflow-x-auto ${className}`}>
                <div className="min-w-max">
                    {/* Header with dates */}
                    <div className="flex border-b border-gray-200 dark:border-gray-800">
                        <div className="w-32 flex-shrink-0"></div>
                        {dates.map((date) => (
                            <div
                                key={date.toString()}
                                className="flex-1 min-w-16 text-center py-2 border-r border-gray-200 dark:border-gray-800"
                            >
                                <div className="text-sm font-medium">
                                    {format(date, "EEE")}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(date, "MMM d")}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline body */}
                    <div className="flex flex-col">
                        {items.map((item) => (
                            <TimelineRow
                                key={item.id}
                                item={item}
                                dates={dates}
                                onMove={onItemMove}
                                renderItem={renderItem}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

const TimelineRow: React.FC<{
    item: TimelineItem;
    dates: Date[];
    onMove?: (itemId: string, newStartDate: string, newEndDate: string) => void;
    renderItem?: (item: TimelineItem) => React.ReactNode;
}> = ({ item, dates, onMove, renderItem }) => {
    const itemStartDate = parseISO(item.startDate);
    const itemEndDate = parseISO(item.endDate);

    const startIndex = dates.findIndex((date) => isSameDay(date, itemStartDate));
    const endIndex = dates.findIndex((date) => isSameDay(date, itemEndDate));

    return (
        <div className="flex relative h-12 border-b border-gray-200 dark:border-gray-800">
            {/* Item label */}
            <div className="w-32 flex-shrink-0 p-2 overflow-hidden">
                {renderItem ? (
                    renderItem(item)
                ) : (
                    <div className="truncate font-medium">{item.title}</div>
                )}
            </div>

            {/* Timeline cells */}
            <div className="flex flex-1 relative">
                {dates.map((date, index) => (
                    <DayCell
                        key={date.toString()}
                        date={date}
                        index={index}
                        dates={dates}
                        onItemDropped={(itemId, dayIndex) => {
                            if (onMove) {
                                const newStartDate = dates[dayIndex];
                                const duration = endIndex - startIndex;
                                const newEndDate = addDays(newStartDate, duration);
                                onMove(
                                    itemId,
                                    format(newStartDate, 'yyyy-MM-dd'),
                                    format(newEndDate, 'yyyy-MM-dd')
                                );
                            }
                        }}
                    />
                ))}

                {/* Item bar */}
                {startIndex >= 0 && endIndex >= 0 && (
                    <DraggableTimelineItem
                        item={item}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        dates={dates}
                    />
                )}
            </div>
        </div>
    );
};

const ItemTypes = {
    TIMELINE_ITEM: 'timeline_item'
};

const DraggableTimelineItem: React.FC<{
    item: TimelineItem;
    startIndex: number;
    endIndex: number;
    dates: Date[];
}> = ({ item, startIndex, endIndex, dates }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.TIMELINE_ITEM,
        item: { id: item.id, startIndex, endIndex },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const span = endIndex - startIndex + 1;

    return (
        <div
            ref={drag as unknown as React.Ref<HTMLDivElement>}
            className={`absolute top-1 bottom-1 rounded-md ${item.color || "bg-blue-500"
                } ${isDragging ? "opacity-50" : ""}`}
            style={{
                left: `${(startIndex / dates.length) * 100}%`,
                width: `${(span / dates.length) * 100}%`,
                cursor: "move",
            }}
        >
            <div className="p-1 text-white text-xs truncate">{item.title}</div>
        </div>
    );
};

const DayCell: React.FC<{
    date: Date;
    index: number;
    dates: Date[];
    onItemDropped: (itemId: string, dayIndex: number) => void;
}> = ({ date, index, dates, onItemDropped }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TIMELINE_ITEM,
        drop: (item: { id: string; startIndex: number; endIndex: number }) => {
            onItemDropped(item.id, index);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop as unknown as React.Ref<HTMLDivElement>}
            className={`flex-1 min-w-16 border-r border-gray-200 dark:border-gray-800 ${isOver ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
        />
    );
};