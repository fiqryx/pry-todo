'use client'
import { cn } from '@/lib/utils';
import { ScrollArea } from '../scroll-area';
import { useRef, useState, useEffect, useMemo } from 'react'
import { addDays, endOfDay, format, startOfDay } from 'date-fns';

export type BaseRecord = { id: string, [key: string]: any }
export type TimeUnit = 'day' | 'week' | 'month' | 'quarter';
type KValue<T, V = string> = keyof {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};
export type TFunc<T, K = string> = (item: T) => K;

export interface TConfig<T extends BaseRecord> {
    values: {
        label: KValue<T> | TFunc<T>
        startDate: KValue<T, Date | undefined> | TFunc<T, Date>
        endDate: KValue<T, Date | undefined> | TFunc<T, Date>
    }
    header?: (value: T) => React.ReactNode;
    cell?: (value: T) => React.ReactNode;
}

export interface TimelineV2Props<T extends BaseRecord> extends React.ComponentProps<'div'> {
    data: T[]
    config: TConfig<T>
    unit?: TimeUnit
    dateRange?: {
        start?: Date
        end?: Date
    }
}

function TimelineV2<T extends BaseRecord>({
    data,
    config,
    unit = 'day',
    dateRange,
    className,
    ...props
}: TimelineV2Props<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>();

    // Calculate default date range if not provided
    useEffect(() => {
        if (dateRange) {
            setVisibleRange({
                start: dateRange.start || new Date(),
                end: dateRange.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
            });
        } else if (data.length > 0) {
            // Calculate range from data
            const startDates = data.map(item => {
                const startDate = typeof config.values.startDate === 'function'
                    ? config.values.startDate(item)
                    : item[config.values.startDate];
                return startDate ? new Date(startDate) : new Date();
            });

            const endDates = data.map(item => {
                const endDate = typeof config.values.endDate === 'function'
                    ? config.values.endDate(item)
                    : item[config.values.endDate];
                return endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            });

            const minDate = new Date(Math.min(...startDates.map(date => date.getTime())));
            const maxDate = new Date(Math.max(...endDates.map(date => date.getTime())));

            setVisibleRange({
                start: minDate,
                end: maxDate
            });
        } else {
            // Default to current month if no data
            const now = new Date();
            setVisibleRange({
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
            });
        }
    }, [data, config.values, dateRange]);

    // Generate timeline headers based on unit
    const timelineHeaders = useMemo(() => {
        if (!visibleRange) return [];

        const headers = [];
        const current = new Date(visibleRange.start);
        const end = new Date(visibleRange.end);

        while (current <= end) {
            headers.push(new Date(current));

            switch (unit) {
                case 'day':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'quarter':
                    current.setMonth(current.getMonth() + 3);
                    break;
            }
        }

        return headers;
    }, [visibleRange, unit]);

    // Handle scroll events
    const handleScroll = () => {
        if (containerRef.current) {
            // setScrollPosition(containerRef.current.scrollLeft);
        }
    };

    const getItemPosition = (item: T) => {
        if (!visibleRange) return { left: 0, width: 0 };

        const startDate = typeof config.values.startDate === 'function'
            ? config.values.startDate(item)
            : item[config.values.startDate];
        const endDate = typeof config.values.endDate === 'function'
            ? config.values.endDate(item)
            : item[config.values.endDate];

        if (!startDate || !endDate) return { left: 0, width: 0 };

        const start = startOfDay(new Date(startDate)).getTime();
        const end = endOfDay(new Date(endDate)).getTime();
        const rangeStart = visibleRange.start.getTime();
        const rangeEnd = visibleRange.end.getTime();
        const totalRange = rangeEnd - rangeStart;

        // Calculate position as percentage
        const left = Math.max(0, ((start - rangeStart) / totalRange) * 100);
        const width = Math.min(100, ((end - start) / totalRange) * 100);

        return { left, width };
    };

    // Get item label
    const getItemLabel = (item: T) => {
        return typeof config.values.label === 'function'
            ? config.values.label(item)
            : item[config.values.label];
    };

    const formatHeaderDate = (date: Date) => {
        switch (unit) {
            case 'day':
                return format(date, 'EEE d');
            case 'week':
                return `${format(date, 'MMM d')} - ${format(addDays(date, 6), 'MMM d')}`;
            case 'month':
                return format(date, 'MMM yyyy');
            case 'quarter':
                return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, 'yyyy')}`;
            default:
                return format(date, 'EEE d');
        }
    };


    return (
        <div
            {...props}
            className={cn(
                'flex flex-col relative overflow-hidden bg-sidebar',
                className
            )}
        >
            <ul className="flex items-center p-2 border-b gap-2">
                {/* Timeline actions */}
                <li>
                    <button className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                        Today
                    </button>
                </li>
                <li>
                    <button className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                        Zoom In
                    </button>
                </li>
                <li>
                    <button className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                        Zoom Out
                    </button>
                </li>
            </ul>

            <div className="flex h-full max-h-60">
                {/* Sidebar with items */}
                <ScrollArea>
                    <div className="flex flex-col h-full border-r w-72 xoverflow-y-auto">
                        <div className="flex items-center gap-2 p-2 h-10 bg-accent border-b sticky top-0 z-10" />
                        {data.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 h-8">
                                <svg className="size-4 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M14.307 11.655a.75.75 0 0 1 .165 1.048 8.05 8.05 0 0 1-1.769 1.77.75.75 0 0 1-.883-1.214 6.552 6.552 0 0 0 1.44-1.439.75.75 0 0 1 1.047-.165Zm-2.652-9.962a.75.75 0 0 1 1.048-.165 8.05 8.05 0 0 1 1.77 1.769.75.75 0 0 1-1.214.883 6.552 6.552 0 0 0-1.439-1.44.75.75 0 0 1-.165-1.047ZM6.749.097a8.074 8.074 0 0 1 2.502 0 .75.75 0 1 1-.233 1.482 6.558 6.558 0 0 0-2.036 0A.751.751 0 0 1 6.749.097ZM.955 6.125a.75.75 0 0 1 .624.857 6.558 6.558 0 0 0 0 2.036.75.75 0 1 1-1.482.233 8.074 8.074 0 0 1 0-2.502.75.75 0 0 1 .858-.624Zm14.09 0a.75.75 0 0 1 .858.624c.13.829.13 1.673 0 2.502a.75.75 0 1 1-1.482-.233 6.558 6.558 0 0 0 0-2.036.75.75 0 0 1 .624-.857Zm-8.92 8.92a.75.75 0 0 1 .857-.624 6.558 6.558 0 0 0 2.036 0 .75.75 0 1 1 .233 1.482c-.829.13-1.673.13-2.502 0a.75.75 0 0 1-.624-.858Zm-4.432-3.39a.75.75 0 0 1 1.048.165 6.552 6.552 0 0 0 1.439 1.44.751.751 0 0 1-.883 1.212 8.05 8.05 0 0 1-1.77-1.769.75.75 0 0 1 .166-1.048Zm2.652-9.962A.75.75 0 0 1 4.18 2.74a6.556 6.556 0 0 0-1.44 1.44.751.751 0 0 1-1.212-.883 8.05 8.05 0 0 1 1.769-1.77.75.75 0 0 1 1.048.166Z"></path>
                                </svg>
                                <span className="text-sm font-semibold truncate">
                                    {getItemLabel(item)}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Timeline area */}
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="flex-1 h-full overflow-auto relative"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {/* Timeline headers */}
                    <div className="flex items-center w-full min-w-max border-b sticky top-0 z-10 bg-accent h-10">
                        {timelineHeaders.map((date) => (
                            <div
                                key={date.toString()}
                                className="flex items-center p-2 min-w-24 border-r"
                            >
                                <span className="text-xs font-semibold">
                                    {formatHeaderDate(date)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Timeline items */}
                    <div className="relative" style={{ height: `${data.length * 32}px` }}>
                        {data.map((item, idx) => {
                            const { left, width } = getItemPosition(item);
                            return (
                                <div
                                    key={item.id}
                                    className="absolute top-0 h-8 flex items-center"
                                    style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                        top: `${idx * 32}px`
                                    }}
                                >
                                    <div className="bg-blue-500 h-6 rounded flex items-center px-2 w-full">
                                        <svg className="w-4 h-4 mr-1 text-white" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M14.307 11.655a.75.75 0 0 1 .165 1.048 8.05 8.05 0 0 1-1.769 1.77.75.75 0 0 1-.883-1.214 6.552 6.552 0 0 0 1.44-1.439.75.75 0 0 1 1.047-.165Zm-2.652-9.962a.75.75 0 0 1 1.048-.165 8.05 8.05 0 0 1 1.77 1.769.75.75 0 0 1-1.214.883 6.552 6.552 0 0 0-1.439-1.44.75.75 0 0 1-.165-1.047ZM6.749.097a8.074 8.074 0 0 1 2.502 0 .75.75 0 1 1-.233 1.482 6.558 6.558 0 0 0-2.036 0A.751.751 0 0 1 6.749.097ZM.955 6.125a.75.75 0 0 1 .624.857 6.558 6.558 0 0 0 0 2.036.75.75 0 1 1-1.482.233 8.074 8.074 0 0 1 0-2.502.75.75 0 0 1 .858-.624Zm14.09 0a.75.75 0 0 1 .858.624c.13.829.13 1.673 0 2.502a.75.75 0 1 1-1.482-.233 6.558 6.558 0 0 0 0-2.036.75.75 0 0 1 .624-.857Zm-8.92 8.92a.75.75 0 0 1 .857-.624 6.558 6.558 0 0 0 2.036 0 .75.75 0 1 1 .233 1.482c-.829.13-1.673.13-2.502 0a.75.75 0 0 1-.624-.858Zm-4.432-3.39a.75.75 0 0 1 1.048.165 6.552 6.552 0 0 0 1.439 1.44.751.751 0 0 1-.883 1.212 8.05 8.05 0 0 1-1.77-1.769.75.75 0 0 1 .166-1.048Zm2.652-9.962A.75.75 0 0 1 4.18 2.74a6.556 6.556 0 0 0-1.44 1.44.751.751 0 0 1-1.212-.883 8.05 8.05 0 0 1 1.769-1.77.75.75 0 0 1 1.048.166Z"></path>
                                        </svg>
                                        <span className="text-sm text-white truncate">
                                            {getItemLabel(item)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}


function ExampleTimelineV2() {
    return (
        <div className="flex flex-col flex-1 relative overflow-hidden bg-gray-800 text-white">
            <div className="flex items-center p-2 border-b border-gray-700">
                <ul className="flex space-x-2">
                    <li>
                        <button
                            className="flex items-center px-2 py-1 text-gray-400 hover:text-gray-300 rounded"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132v-.001a5 5 0 1 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z"></path>
                            </svg>
                            <span>Markers</span>
                        </button>
                    </li>
                    <li>
                        <button
                            className="flex items-center px-2 py-1 text-gray-400 hover:text-gray-300 rounded"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3.72 3.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.56 7h10.88l-2.22-2.22a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l2.22-2.22H2.56l2.22 2.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-3.5-3.5a.75.75 0 0 1 0-1.06Z"></path>
                            </svg>
                            <span>Sort</span>
                        </button>
                    </li>
                    <li>
                        <button
                            className="flex items-center px-2 py-1 text-gray-400 hover:text-gray-300 rounded"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"></path>
                            </svg>
                            <span>Date fields</span>
                        </button>
                    </li>
                    <li>
                        <button
                            className="flex items-center px-2 py-1 text-gray-400 hover:text-gray-300 rounded"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3.75 7.5a.75.75 0 0 1 .75-.75h2.25V4.5a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5H8.25v2.25a.75.75 0 0 1-1.5 0V8.25H4.5a.75.75 0 0 1-.75-.75Z"></path>
                                <path d="M7.5 0a7.5 7.5 0 0 1 5.807 12.247l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 1 1 7.5 0Zm-6 7.5a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"></path>
                            </svg>
                            <span>Quarter</span>
                        </button>
                    </li>
                    <li>
                        <button className="px-2 py-1 text-gray-400 hover:text-gray-300 rounded">
                            Today
                        </button>
                    </li>
                    <li>
                        <button className="p-1 text-gray-400 hover:text-gray-300 rounded">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path>
                            </svg>
                        </button>
                    </li>
                    <li>
                        <button className="p-1 text-gray-400 hover:text-gray-300 rounded">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                            </svg>
                        </button>
                    </li>
                </ul>
            </div>

            {/* this loop timeunits | 'week' | 'month' | 'quarter' by condition props */}
            <div className="overflow-x-auto">
                <div className="min-w-max">
                    <div className="flex border-b border-gray-700">
                        <div className="w-[164px] px-4 py-2 font-medium">November 2023</div>
                        <div className="w-[496px] px-3 py-2 font-medium">December 2023</div>
                        <div className="w-[496px] px-3 py-2 font-medium">January 2024</div>
                        {/* Add more months as needed */}
                    </div>

                    <div className="flex border-b border-gray-700">
                        <div className="w-[16px] py-1 text-center">20</div>
                        <div className="w-[16px] py-1 text-center">27</div>
                        <div className="w-[16px] py-1 text-center">4</div>
                        {/* Add more dates as needed */}
                    </div>
                </div>
            </div>

            <div className="flex-1 xoverflow-auto">
                <div className="flex items-center border-b border-gray-700 bg-gray-900 sticky top-0 z-10 px-2">
                    <button className="p-1 text-gray-400 hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
                        </svg>
                    </button>
                    <div className="flex items-center px-2 py-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium">Squad 1</span>
                        <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded-full">1</span>
                    </div>
                    <button className="p-1 ml-auto text-gray-400 hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
                        </svg>
                    </button>
                </div>

                <div className="flex xitems-center border-b border-gray-700 hover:bg-gray-800">
                    <div className="flex flex-col">
                        {/* loop label project */}
                        {new Array(5).fill(0).map((item, idx) => (
                            <div key={idx} className="flex">
                                <div className="w-[60px] px-2 py-2 text-center text-gray-400">1</div>
                                <div className="w-[350px] px-2 py-2 flex items-center border-r">
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M14.307 11.655a.75.75 0 0 1 .165 1.048 8.05 8.05 0 0 1-1.769 1.77.75.75 0 0 1-.883-1.214 6.552 6.552 0 0 0 1.44-1.439.75.75 0 0 1 1.047-.165Zm-2.652-9.962a.75.75 0 0 1 1.048-.165 8.05 8.05 0 0 1 1.77 1.769.75.75 0 0 1-1.214.883 6.552 6.552 0 0 0-1.439-1.44.75.75 0 0 1-.165-1.047ZM6.749.097a8.074 8.074 0 0 1 2.502 0 .75.75 0 1 1-.233 1.482 6.558 6.558 0 0 0-2.036 0A.751.751 0 0 1 6.749.097ZM.955 6.125a.75.75 0 0 1 .624.857 6.558 6.558 0 0 0 0 2.036.75.75 0 1 1-1.482.233 8.074 8.074 0 0 1 0-2.502.75.75 0 0 1 .858-.624Zm14.09 0a.75.75 0 0 1 .858.624c.13.829.13 1.673 0 2.502a.75.75 0 1 1-1.482-.233 6.558 6.558 0 0 0 0-2.036.75.75 0 0 1 .624-.857Zm-8.92 8.92a.75.75 0 0 1 .857-.624 6.558 6.558 0 0 0 2.036 0 .75.75 0 1 1 .233 1.482c-.829.13-1.673.13-2.502 0a.75.75 0 0 1-.624-.858Zm-4.432-3.39a.75.75 0 0 1 1.048.165 6.552 6.552 0 0 0 1.439 1.44.751.751 0 0 1-.883 1.212 8.05 8.05 0 0 1-1.77-1.769.75.75 0 0 1 .166-1.048Zm2.652-9.962A.75.75 0 0 1 4.18 2.74a6.556 6.556 0 0 0-1.44 1.44.751.751 0 0 1-1.212-.883 8.05 8.05 0 0 1 1.769-1.77.75.75 0 0 1 1.048.166Z"></path>
                                    </svg>
                                    <span>Test</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto">
                        {/* this for loop project start - end date */}
                        {/* i want this support drag n drop with timeunits */}
                        {new Array(5).fill(0).map((item, idx) => (
                            <div key={idx} className="flex items-center relative h-8">
                                <div className="absolute left-[8608px] w-[1440px] h-6 bg-blue-500 rounded-full mt-1"></div>
                                <div className="absolute left-[8616px] flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M14.307 11.655a.75.75 0 0 1 .165 1.048 8.05 8.05 0 0 1-1.769 1.77.75.75 0 0 1-.883-1.214 6.552 6.552 0 0 0 1.44-1.439.75.75 0 0 1 1.047-.165Zm-2.652-9.962a.75.75 0 0 1 1.048-.165 8.05 8.05 0 0 1 1.77 1.769.75.75 0 0 1-1.214.883 6.552 6.552 0 0 0-1.439-1.44.75.75 0 0 1-.165-1.047ZM6.749.097a8.074 8.074 0 0 1 2.502 0 .75.75 0 1 1-.233 1.482 6.558 6.558 0 0 0-2.036 0A.751.751 0 0 1 6.749.097ZM.955 6.125a.75.75 0 0 1 .624.857 6.558 6.558 0 0 0 0 2.036.75.75 0 1 1-1.482.233 8.074 8.074 0 0 1 0-2.502.75.75 0 0 1 .858-.624Zm14.09 0a.75.75 0 0 1 .858.624c.13.829.13 1.673 0 2.502a.75.75 0 1 1-1.482-.233 6.558 6.558 0 0 0 0-2.036.75.75 0 0 1 .624-.857Zm-8.92 8.92a.75.75 0 0 1 .857-.624 6.558 6.558 0 0 0 2.036 0 .75.75 0 1 1 .233 1.482c-.829.13-1.673.13-2.502 0a.75.75 0 0 1-.624-.858Zm-4.432-3.39a.75.75 0 0 1 1.048.165 6.552 6.552 0 0 0 1.439 1.44.751.751 0 0 1-.883 1.212 8.05 8.05 0 0 1-1.77-1.769.75.75 0 0 1 .166-1.048Zm2.652-9.962A.75.75 0 0 1 4.18 2.74a6.556 6.556 0 0 0-1.44 1.44.751.751 0 0 1-1.212-.883 8.05 8.05 0 0 1 1.769-1.77.75.75 0 0 1 1.048.166Z"></path>
                                    </svg>
                                    <span className="text-sm">Test</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center border-b border-gray-700">
                    <div className="w-[410px] px-2 py-2 flex items-center">
                        <button className="p-1 text-gray-400 hover:text-gray-300">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
                            </svg>
                        </button>
                        <div className="ml-2 flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Add item"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export {
    TimelineV2,
    ExampleTimelineV2
}