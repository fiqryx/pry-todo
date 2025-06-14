'use client'
import { cn } from "@/lib/utils"
import { useProject } from "@/stores/project"

import { Tooltip } from "@/components/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SwitchField } from "@/components/switch-field"

import { useSort, useTimelineOptions } from "../../use-timeline"
import { Button, buttonVariants } from "@/components/ui/button"
import { addDays, isBefore, isAfter } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusIcon, RefreshCcw, Settings2Icon, CalendarIcon, ClockFading, FlagIcon, ArrowDownNarrowWide, CheckIcon } from "lucide-react"

const sortMap = {
    date: ClockFading,
    priority: FlagIcon
} as const

type DateRange = { from: Date, to: Date }

interface TimelineActionsProps extends
    React.ComponentProps<'div'> {
    date: DateRange
    setDate: React.Dispatch<React.SetStateAction<DateRange>>
    onCreateNew?: () => void
}

export function TimelineActions({
    date,
    className,
    setDate,
    onCreateNew,
    ...props
}: TimelineActionsProps) {
    const [sort, setSort] = useSort();
    const [options, setOptions] = useTimelineOptions();
    const { active, set: setProject } = useProject();

    return (
        <div {...props} className={cn('flex flex-wrap gap-1', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost-primary"
                        className="bg-primary/20 font-semibold h-8"
                    >
                        <ArrowDownNarrowWide className="size-5" />
                        Sort by {sort}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {Object.entries(sortMap).map(([key, Icon], idx) => (
                        <DropdownMenuItem
                            key={idx}
                            onClick={() => setSort(key as 'date')}
                            className="capitalize text-xs focus:text-primary focus:bg-primary/40"
                        >
                            <Icon className="size-5" />
                            {key}
                            {key === sort && <CheckIcon className='ml-auto' />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
                <PopoverTrigger>
                    <Tooltip label="Date fields">
                        <div
                            className={cn(
                                buttonVariants({ size: 'sm', variant: 'outline' }),
                                'rounded-md h-8'
                            )}
                        >
                            <CalendarIcon />
                            Date fields
                        </div>
                    </Tooltip>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <div className="flex gap-4">
                        <Calendar
                            autoFocus
                            mode="single"
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
            <Tooltip label="Sync">
                <Button
                    size="icon"
                    variant="outline"
                    className='size-8 rounded-sm'
                    onClick={() => setProject({ active })}
                >
                    <RefreshCcw />
                </Button>
            </Tooltip>
            <Tooltip label="Add">
                <Button
                    size="icon"
                    variant="outline"
                    className='size-8 rounded-sm'
                    onClick={onCreateNew}
                >
                    <PlusIcon />
                </Button>
            </Tooltip>
            <Popover>
                <PopoverTrigger>
                    <Tooltip label="Options">
                        <div
                            className={cn(
                                buttonVariants({ size: 'icon', variant: 'outline' }),
                                'rounded-md size-8'
                            )}
                        >
                            <Settings2Icon />
                        </div>
                    </Tooltip>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[22rem] p-0">
                    <ScrollArea className="p-4">
                        <div className="grid h-full max-h-90 gap-4">
                            <div className="gird">
                                <h6 className="text-[13px] font-semibold">Options</h6>
                                <div className="grid gap-2">
                                    <SwitchField
                                        label="Focus mode"
                                        description="Display only dates that have assigned"
                                        checked={options.showEmptyDate}
                                        onChange={(showEmptyDate) => setOptions({ showEmptyDate })}
                                    />
                                    <SwitchField
                                        label="Day interval"
                                        description="Show day-level intervals on the timeline"
                                        checked={options.showDayOnTimeline}
                                        onChange={(showDayOnTimeline) => setOptions({ showDayOnTimeline })}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </div>
    )
}