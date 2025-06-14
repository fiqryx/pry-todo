'use client'
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { Editor } from '@tiptap/react'
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { localeMap } from "@/types/locale"
import { useAppStore } from "@/stores/app"
import { useProject } from "@/stores/project"

import { Icons } from "@/components/icons"
import { CalendarIcon } from "lucide-react"
import { useAuthStore } from "@/stores/auth"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { getIssueColorClass } from "@/lib/internal"
import { Calendar } from "@/components/ui/calendar"
import { zodResolver } from "@hookform/resolvers/zod"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Translate, translateText } from "@/components/translate"
import { Input, InputMaxIndicator } from "@/components/ui/input"
import { MinimalTiptapEditor } from "@/components/minimal-tiptap"
import { Issue, IssueSchema, issueSchema } from "@/types/schemas/issue"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IssueDropdown, UserAvatarDropdown } from "@/components/issue-dropdown"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ISSUE_TYPE_MAP, IssuePriority, IssueStatus, IssueType } from "@/types/misc"
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createOrUpdateIssue, deleteIssueById, issueRemoveParents, moveParents } from "@/lib/services/issues"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface IssueDialogProps extends
    React.ComponentProps<typeof Dialog> {
    parentId?: string
    disabled?: boolean
    defaultStatus?: IssueStatus
    defaultType?: IssueType
    excludeType?: IssueType[]
    defaultPriority?: IssuePriority
    defaultStartDate?: Date
    defaultDueDate?: Date
    onSave?: (issue: Issue) => void
    classNames?: string
    issue?: Issue
}

export function IssueFormDialog({
    issue,
    parentId,
    children,
    disabled,
    classNames,
    defaultType,
    excludeType,
    defaultStatus,
    defaultPriority,
    defaultStartDate,
    defaultDueDate,
    onSave,
    ...props
}: IssueDialogProps) {
    const app = useAppStore();
    const { user } = useAuthStore();
    const { active } = useProject();
    const { t } = useTranslation();

    const editorRef = useRef<Editor | null>(null);

    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const locale = useMemo(() => localeMap[app.locale as 'en'], [app.locale]);

    const { setError, ...form } = useForm<IssueSchema>({
        resolver: zodResolver(issueSchema),
        defaultValues: {
            title: issue?.title ?? '',
            description: issue?.description ?? '',
            label: issue?.label ?? '',
            parents: issue?.parents ?? parentId,
            type: issue?.type ?? defaultType ?? 'task',
            priority: issue?.priority ?? defaultPriority ?? active?.setting?.defaultIssuePriority ?? 'medium',
            status: issue?.status ?? defaultStatus ?? active?.setting?.defaultIssueStatus ?? 'todo',
            assigneeId: issue?.assigneeId,
            startDate: defaultStartDate ?? issue?.startDate,
            dueDate: defaultDueDate ?? issue?.dueDate
            // ?? active?.setting?.defaultDueDateOffset
            // ? addDays(new Date(), active?.setting?.defaultDueDateOffset ?? 1)
            // : undefined
        },
    });

    const onOpenChange = useCallback((open: boolean) => {
        if (!open) form.reset();
        setOpen(open)
        props.onOpenChange?.(open);
    }, [props.onOpenChange, form]);

    const onSubmit = useCallback(
        async (values: IssueSchema) => {
            if (disabled) return;
            try {
                setIsLoading(true);
                const { data, error } = await createOrUpdateIssue({ ...values, id: issue?.id });
                if (!data) {
                    toast.error(error);
                    return
                }
                onSave?.(data);
                onOpenChange(false);
                toast.success("Saved successfully");
            } catch (e) {
                logger.debug(e);
                toast.error('An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        },
        [onSave, disabled, issue]
    );

    useEffect(() => {
        if (props.open !== undefined) setOpen(props.open);
    }, [props.open]);

    useEffect(() => {
        if (!open) form.reset()
    }, [open]);

    useEffect(() => {
        form.reset({
            title: issue?.title ?? '',
            description: issue?.description ?? '',
            label: issue?.label ?? '',
            parents: issue?.parents ?? parentId,
            type: issue?.type ?? defaultType ?? 'task',
            priority: issue?.priority ?? defaultPriority ?? active?.setting?.defaultIssuePriority ?? 'medium',
            status: issue?.status ?? defaultStatus ?? active?.setting?.defaultIssueStatus ?? 'todo',
            assigneeId: issue?.assigneeId,
            startDate: issue?.startDate ?? defaultStartDate,
            dueDate: issue?.dueDate ?? defaultDueDate
        });
    }, [
        form.reset, issue, parentId, defaultType, defaultPriority,
        defaultStatus, defaultDueDate, defaultStartDate, active?.setting
    ]);

    return (
        <Dialog {...props} open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild disabled={disabled}>
                {children}
            </DialogTrigger>
            <DialogContent
                aria-describedby="backlog-dialog"
                className={cn('max-w-sm md:max-w-xl lg:max-w-4xl p-0', classNames)}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <Form setError={setError} {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-6">
                        <DialogHeader className="px-6">
                            <Translate t={t} as={DialogTitle} capitalize value={issue ? 'update' : 'create'} />
                            <Translate t={t} as={DialogDescription} value={`issue.${issue ? 'update' : 'create'}.description`} />
                        </DialogHeader>
                        <ScrollArea>
                            <div className="grid h-full max-h-[25rem] sm:max-h-max gap-6 px-6 mt-2">
                                <div className="grid sm:grid-cols-3 gap-4 sm:gap-10">
                                    <div className="sm:col-span-2 flex flex-col gap-4">
                                        <FormField
                                            name="title"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Input
                                                        id="title"
                                                        autoComplete="off"
                                                        placeholder={translateText(t, "enter.name", { capitalize: true })}
                                                        {...field}
                                                    />
                                                    <InputMaxIndicator max={60} value={field.value.length}>
                                                        <FormMessage className="text-xs" />
                                                    </InputMaxIndicator>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <FormField
                                                name="startDate"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "xmax-w-xs pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "LLL dd, y", { locale })
                                                                        : translateText(t, "start.date", { capitalize: true })}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <Calendar
                                                                    mode="single"
                                                                    locale={locale}
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
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "xmax-w-xs pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? format(field.value, "LLL dd, y", { locale })
                                                                        : translateText(t, "due.date", { capitalize: true })}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <Calendar
                                                                    mode="single"
                                                                    locale={locale}
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
                                        </div>

                                        <FormField
                                            name="description"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <MinimalTiptapEditor
                                                        {...field}
                                                        editable
                                                        injectCSS
                                                        output="html"
                                                        throttleDelay={0}
                                                        onCreate={({ editor }) => {
                                                            editorRef.current = editor;
                                                            if (form.getValues('description') && editor.isEmpty) {
                                                                editor.commands.setContent(form.getValues('description') ?? null)
                                                            }
                                                        }}
                                                        editorClassName="focus:outline-hidden p-5"
                                                        placeholder={translateText(t, "add.description")}
                                                        className={cn('w-full focus-within:border-ring', {
                                                            'border-destructive focus-within:border-destructive': form.formState.errors.description
                                                        })}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid gap-4">
                                        <FormField
                                            name="type"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 space-y-0">
                                                    <Translate t={t} as={FormLabel} capitalize value="type" />
                                                    <IssueDropdown
                                                        name="type"
                                                        side="right"
                                                        align="center"
                                                        defaultValue="task"
                                                        className="w-fit h-10"
                                                        issue={form.getValues() as Issue}
                                                        excludes={excludeType ?? ['subtask']}
                                                        onValueChange={(i) => field.onChange(i.type)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="priority"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 space-y-0">
                                                    <Translate t={t} as={FormLabel} capitalize value="priority" />
                                                    <IssueDropdown
                                                        side="right"
                                                        align="center"
                                                        name="priority"
                                                        className="w-fit h-10"
                                                        issue={form.getValues() as Issue}
                                                        onValueChange={(i) => field.onChange(i.priority)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="status"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 space-y-0">
                                                    <Translate t={t} as={FormLabel} capitalize value="status" />
                                                    <IssueDropdown
                                                        side="right"
                                                        align="center"
                                                        name="status"
                                                        excludes={['draft']}
                                                        className="w-fit h-10"
                                                        issue={form.getValues() as Issue}
                                                        onValueChange={(i) => field.onChange(i.status)}
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="assigneeId"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 space-y-0">
                                                    <Translate t={t} as={FormLabel} capitalize value="assignee" />
                                                    <UserAvatarDropdown className="w-40" value={field.value} onValueChange={field.onChange} />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex flex-col gap-2">
                                            <Translate t={t} as={FormLabel} capitalize value="reporter" />
                                            <UserAvatarDropdown disabled className="w-40" value={issue?.reporterId || user?.id} />
                                            <FormMessage />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            disabled={isLoading}
                                            onClick={() => form.reset()}
                                        >
                                            <Translate t={t} capitalize value="cancel" />
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                        {translateText(t, isLoading ? 'saving' : 'save', { capitalize: true })}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </ScrollArea>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export interface IssueDeleteDialogProps extends
    React.ComponentProps<typeof Dialog> {
    actions: 'issue' | 'parents'
    issue?: Issue
    disabled?: boolean
    onDelete?: (issue: Issue) => void
    onRemoveParent?: (issue: Issue) => void
    className?: string
}

export function IssueDeleteDialog({
    issue,
    actions,
    children,
    disabled,
    className,
    onDelete,
    onRemoveParent,
    ...props
}: IssueDeleteDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const onOpenChange = useCallback((open: boolean) => {
        setOpen(open)
        props.onOpenChange?.(open);
    }, [props.onOpenChange]);

    const handleDelete = useCallback(
        async () => {
            if (!issue || disabled) return;

            if (issue.status !== 'todo') {
                const statusMessage = issue.status === 'done' ? 'completed' : 'in progress';
                toast.error(`Cannot delete issue - it's already ${statusMessage}.`);
                return;
            }

            setLoading(true);
            try {
                const { error } = await deleteIssueById(issue.id);
                if (error) {
                    toast.error(error);
                    return
                }
                onOpenChange(false);
                onDelete?.(issue);
            } catch (error) {
                logger.error(error);
                toast.error('Failed to delete issue');
            } finally {
                setLoading(false);
            }
        },
        [issue, disabled]
    );

    const handleRemoveParents = useCallback(
        async () => {
            if (!issue || !issue.parents || !!disabled) return;
            setLoading(true);
            try {
                const { data, error } = await issueRemoveParents(issue.id);
                if (!data) {
                    toast.error(error);
                    return
                }
                onOpenChange(false);
                onRemoveParent?.(data);
            } catch (error) {
                logger.error(error);
                toast.error('Failed to remove parent');
            } finally {
                setLoading(false);
            }
        },
        [issue, disabled]
    );

    useEffect(() => {
        if (props.open !== undefined) setOpen(props.open);
    }, [props.open]);

    return (
        <Dialog {...props} open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild disabled={disabled}>
                {children}
            </DialogTrigger>
            <DialogContent className={cn('sm:max-w-md', className)}>
                <DialogHeader>
                    <DialogTitle>
                        {actions === 'issue' ? 'Delete issue' : 'Remove parent'}
                    </DialogTitle>
                    <DialogDescription>
                        {actions === 'issue' ? 'All related data will be removed.'
                            : 'This will convert the issue into a task.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        disabled={disabled || isLoading}
                        onClick={actions === 'issue'
                            ? handleDelete : handleRemoveParents
                        }
                    >
                        {isLoading && <Icons.spinner className="animate-spin" />}
                        {isLoading
                            ? actions === 'issue' ? 'Deleting...' : 'Removing...'
                            : actions === 'issue' ? 'Delete' : 'Remove'
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface IssueMoveDialogProps extends
    React.ComponentProps<typeof CommandDialog> {
    disabled?: boolean
    value?: Issue
    options: Issue[]
    onValueChange: (value: Issue) => void
}

export function IssueMoveDialog({
    value,
    options,
    onValueChange,
    onOpenChange,
    disabled,
    ...props
}: IssueMoveDialogProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [input, setInput] = useState('');
    const [isOpen, setOpen] = useState(false);
    const [result, setResult] = useState(options);
    const [isLoading, setLoading] = useState(false);

    const handleOpen = useCallback(
        (value: boolean) => {
            setOpen(value);
            onOpenChange?.(value)
        },
        [onOpenChange],
    );

    const clearInput = useCallback(() => {
        setInput('');
        setResult([]);
        if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.focus();
        }
    }, [inputRef]);

    const onSubmit = useCallback((target: Issue) =>
        async () => {
            if (!value || disabled) return;
            clearInput();
            setLoading(true);
            try {
                const { data, error } = await moveParents(value.id, target.id);
                if (!data) {
                    toast.error(error);
                    return
                }
                onValueChange(data)
            } catch (e) {
                logger.debug(e)
            } finally {
                setLoading(false);
                handleOpen(false)
            }
        },
        [value, inputRef, setLoading],
    );

    useEffect(() => { setResult([]) }, [isOpen]);

    useEffect(() => {
        const trimmedQuery = input.trim();
        if (!trimmedQuery) {
            setResult([]);
            return;
        }

        const lowerQuery = trimmedQuery.toLowerCase();
        const handler = setTimeout(() => {
            try {
                const excludeId = value?.parents || value?.id
                const results = options.filter((v) => v.id !== excludeId &&
                    ['title', 'type', 'status'].some((field) => {
                        const value = v[field as keyof Issue];
                        return (
                            typeof value === 'string' &&
                            value.toLowerCase().includes(lowerQuery)
                        );
                    })
                );
                setResult(results);
            } catch (error) {
                console.error('Filter error:', error);
                setResult([]);
            }
        }, 100);

        return () => clearTimeout(handler);
    }, [input, value, options]);

    useEffect(() => {
        if (props.open !== undefined) setOpen(props.open);
    }, [props.open]);

    return (
        <CommandDialog {...props} open={isOpen} onOpenChange={handleOpen}>
            <CommandInput
                ref={inputRef}
                disabled={disabled}
                onValueChange={setInput}
                placeholder="Search association..."
            />
            <CommandList>
                <CommandEmpty>
                    {!isLoading ? 'No matches found.' : (
                        <div className="flex text-muted-foreground gap-2 justify-center items-center">
                            <span className="text-primary loading loading-xs loading-spinner" />
                            Moving...
                        </div>
                    )}
                </CommandEmpty>
                <CommandGroup>
                    {!isLoading && (
                        <CommandItem disabled>
                            Start typing to search across:
                            <span className="font-medium text-primary">
                                name, type, or status
                            </span>
                        </CommandItem>
                    )}
                    {result.map((item) => {
                        const Icon = ISSUE_TYPE_MAP[item.type]
                        return (
                            <CommandItem
                                key={item.id}
                                disabled={disabled}
                                onSelect={onSubmit(item)}
                                value={`${item.title}${item.type}${item.status}`}
                            >
                                <Icon className={getIssueColorClass(item.type)} />
                                <span>{item.title}</span>
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}