"use client"

import * as React from "react"
import { DayPicker, DayPickerSingleProps, Matcher } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "../scroll-area"
import { getHours, getMinutes } from "date-fns"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                    props.mode === "range"
                        ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                        : "[&:has([aria-selected])]:rounded-md"
                ),
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
                ),
                day_range_start: "day-range-start",
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside:
                    "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                // IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                // IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

type TimePickerType = '24-hour' | '12-hour' | 'minute'

export interface TimePickerProps extends
    Omit<React.ComponentProps<typeof ScrollArea>, 'onSelect' | 'children' | 'type'> {
    selected?: Date
    onSelect?: (date: Date | undefined) => void;
    type: TimePickerType
}

const TIME_MAP = {
    '12-hour': Array.from({ length: 12 }, (_, i) => i + 1).reverse(),
    '24-hour': Array.from({ length: 24 }, (_, i) => i).reverse(),
    'minute': Array.from({ length: 12 }, (_, i) => i * 5)
} as const;

function getButtonVariant(
    selected: Date | null | undefined,
    type: 'minute' | '12-hour' | '24-hour',
    item: number
) {
    if (!selected) return 'ghost';

    const currentValue = type === 'minute'
        ? getMinutes(selected)
        : getHours(selected);

    return currentValue === item ? 'default' : 'ghost';
}

function TimePicker({
    selected,
    className,
    onSelect,
    type,
    ...props
}: TimePickerProps) {
    return (
        <ScrollArea
            {...props}
            className={cn(
                'w-64 sm:w-auto h-full',
                "[&_[data-radix-scroll-area-viewport]]:touch-auto",
                className
            )}
        >
            <div className="flex sm:flex-col p-2">
                {TIME_MAP[type].map((item) => (
                    <Button
                        key={item}
                        size="icon"
                        variant={getButtonVariant(selected, type, item)}
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() => {
                            const date = new Date(selected ?? new Date());
                            const pm = date.getHours() >= 12;

                            switch (type) {
                                case '12-hour':
                                    date.setHours((item % 12 || 12) + (pm ? 12 : 0));
                                    break;
                                case '24-hour':
                                    date.setHours(item);
                                    break;
                                case 'minute':
                                    date.setMinutes(item);
                                    break;
                            }

                            date.setSeconds(0, 0); // reset seconds/milliseconds
                            onSelect?.(date);
                        }}
                    >
                        {item.toString().padStart(2, "0")}
                    </Button>
                ))}
            </div>
            <ScrollBar forceMount orientation="horizontal" className="sm:hidden h-2" />
        </ScrollArea>
    )
}
TimePicker.displayName = "TimePicker"

export interface CalendarWithTimeProps extends
    Omit<DayPickerSingleProps, 'mode'> {
    time?: Exclude<TimePickerType, 'minute' | '12-hour'>
    onSelect?: (date: Date | undefined) => void;
    disabled?: Matcher | Matcher[] | undefined
}

function CalendarWithTime({
    selected,
    disabled,
    onSelect,
    time = '24-hour',
    ...props
}: CalendarWithTimeProps) {
    return (
        <div className="sm:flex">
            <Calendar
                mode="single"
                selected={selected}
                onSelect={onSelect}
                disabled={disabled}
                {...props}
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                {/* hours */}
                <TimePicker type={time} selected={selected} onSelect={onSelect} />
                {/* minutes */}
                <TimePicker type='minute' selected={selected} onSelect={onSelect} />
            </div>
        </div>
    )
}
CalendarWithTime.displayName = "CalendarWithTime"

export {
    Calendar,
    CalendarWithTime,
    TimePicker
}
