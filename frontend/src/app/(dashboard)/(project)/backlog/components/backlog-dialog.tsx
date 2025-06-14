'use client'
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { addDays, format } from "date-fns"
import { logger } from "@/lib/logger"
import { useIssues } from "../use-issue"
import { useProject } from "@/stores/project"
import { IssueStatus } from "@/types/misc"
import { Issue } from "@/types/schemas/issue"
import { useForm } from "react-hook-form"
import { Icons } from "@/components/icons"
import { IssueSchema, issueSchema } from "@/types/schemas/issue"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarWithTime } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

import { TooltipContent, } from '@/components/ui/tooltip'
import { useCallback, useEffect, useState } from "react"
import { createOrUpdateIssue } from "@/lib/services/issues"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface BacklogDialogProps extends
    Omit<React.ComponentProps<typeof Dialog>, 'children'>,
    Pick<React.ComponentProps<typeof TooltipContent>, 'side' | 'align'> {
    disabled?: boolean
    data?: Issue
    children?: React.ReactNode
    title?: string
    status?: IssueStatus
    onSubmit?: (update: (prev: Issue[]) => Issue[]) => void
}

const startSprintSchema = issueSchema.pick({
    title: true,
    goal: true
}).extend({
    startDate: z.date({ required_error: 'Start date is required' }),
    dueDate: z.date({ required_error: 'End date is required' }),
})

export function BacklogSprintDialog({
    data,
    children,
    disabled,
    onOpenChange,
    ...props
}: BacklogDialogProps) {
    const { active } = useProject();
    const setIssues = useIssues()[1];
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { setError, ...form } = useForm<z.infer<typeof startSprintSchema>>({
        resolver: zodResolver(startSprintSchema),
        defaultValues: {
            title: data?.title,
            startDate: new Date(),
            dueDate: addDays(new Date(), active?.setting?.defaultDueDateOffset ?? 1)
        },
    });

    const handleOpenChange = useCallback((open: boolean) => {
        setOpen(open)
        if (onOpenChange) {
            onOpenChange(open);
        }
    }, [onOpenChange]);

    const onSubmit = useCallback(
        async (values: z.infer<typeof startSprintSchema>) => {
            try {
                if (!data?.id || !!data.startDate) return
                setIsLoading(true);

                const { data: res, error } = await createOrUpdateIssue({
                    ...values,
                    id: data.id
                } as IssueSchema & { id?: string });

                if (!res) throw error;

                setIssues(res);
                handleOpenChange(false);
                toast.success('Your sprint has begun!');
            } catch (e) {
                logger.debug(e);
                toast.error('Failed to start spirnt');
            } finally {
                setIsLoading(false);
            }
        },
        [data, isLoading, handleOpenChange]
    );

    useEffect(() => {
        if (props.open !== undefined) setOpen(props.open);
    }, [props.open]);

    useEffect(() => {
        if (open) {
            form.setValue('startDate', new Date());
        }
    }, [open])

    return (
        <Dialog
            {...props}
            open={open}
            onOpenChange={(open) => {
                if (!open) form.reset();
                handleOpenChange(open)
            }}
        >
            <DialogTrigger asChild disabled={disabled}>
                {children}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Form setError={setError} {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Start sprint</DialogTitle>
                            <DialogDescription>
                                All issue will be included in this sprint.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <FormField
                                name="title"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="name" className="required">
                                            Name
                                        </FormLabel>
                                        <Input
                                            id="name"
                                            autoComplete="off"
                                            placeholder="Enter the name"
                                            {...field}
                                        />
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="startDate"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="required">
                                            Start date
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "xmax-w-xs pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "LLL dd, y HH:mm") : 'Pick a date'}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <CalendarWithTime
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="dueDate"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="required">
                                            End date
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "xmax-w-xs pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "LLL dd, y HH:mm") : 'Pick a date'}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <CalendarWithTime
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => {
                                                        const startDate = form.watch('startDate');
                                                        if (!startDate) return false;
                                                        return date < startDate;
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="goal"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Goal</FormLabel>
                                        <Textarea
                                            className="resize-none h-30"
                                            placeholder="Describe your sprint goal"
                                            {...field}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="sm:justify-center">
                            <Button type="submit" disabled={isLoading} className="rounded-sm">
                                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Starting...' : 'Start'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}