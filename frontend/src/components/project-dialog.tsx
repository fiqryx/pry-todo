"use client"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { Icons } from "@/components/icons"
import { Emotions } from "@/components/emotions"

import { useForm } from "react-hook-form"
import { emotions } from "@/lib/emotions"
import { useProject } from "@/stores/project"
import { HexColorPicker } from "react-colorful";
import { Project } from "@/types/schemas/project"
import { saveProject } from "@/lib/services/project"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { translateText } from "@/components/translate"
import { useCallback, useEffect, useState } from "react"
import { projectSchema, ProjectSchema } from "@/types/schemas/project"
import { Input, InputMaxIndicator } from "@/components/ui/input"
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ProjectDialogProps extends Omit<React.ComponentProps<typeof Dialog>, 'children'> {
    data?: Project
    children?: React.ReactNode
}

export function ProjectDialog({ data, children, onOpenChange, ...props }: ProjectDialogProps) {
    const { t } = useTranslation();
    const { active, list, set: setProject } = useProject();

    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { setError, ...form } = useForm<ProjectSchema>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: 'Project name',
            color: '#ffffff',
            description: '',
        },
    });

    const handleOpenChange = useCallback((open: boolean) => {
        setOpen(open)
        if (onOpenChange) {
            onOpenChange(open);
        }
    }, [onOpenChange]);

    const onSubmit = useCallback(async (values: ProjectSchema) => {
        try {
            setIsLoading(true)
            const { data: res, error } = await saveProject({
                id: data?.id,
                ...values
            })

            if (!res) {
                toast.error(error || 'Failed to create project');
                return
            }

            setProject({
                active: (!data || !active || res.id === active?.id) ? res : active,
                list: data ? list.map(item => item.id === res.id ? res : item) : [...list, res]
            });

            handleOpenChange(false);
            form.reset();
        } catch (error) {
            logger.debug(error);
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(false);
        }
    }, [form]);

    useEffect(() => {
        if (props.open !== undefined) setOpen(props.open)
    }, [props.open]);

    useEffect(() => {
        if (!open) return;
        const emoji = emotions[Math.floor(Math.random() * emotions.length)];

        const generateName = () => {
            const adjectives = ['New', 'Awesome', 'Creative', 'Spark', 'Next', 'Bright', 'Dynamic'];
            const nouns = ['Project', 'Venture', 'Workspace', 'Initiative', 'Plan', 'Horizon'];

            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

            return `${randomAdj} ${randomNoun} ${Math.floor(Math.random() * 100)}`;
        }

        const generateColor = () => {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        form.setValue('name', data?.name ?? generateName());
        form.setValue('description', data?.description || '');
        form.setValue('color', data?.color ?? generateColor());
        form.setValue('image', data?.image ?? emoji.values[Math.floor(Math.random() * emoji.values.length)]);
    }, [open, data]);

    return (
        <Dialog {...props} open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent aria-describedby="project-dialog" className="max-w-xs sm:max-w-lg">
                <Form setError={setError} {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
                        <DialogHeader>
                            <DialogTitle>
                                {translateText(t, `${data ? 'update' : 'create'}.project`, { capitalize: true })}
                            </DialogTitle>
                            <DialogDescription>
                                {translateText(t, 'create.project.description')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <FormField
                                    name="image"
                                    control={form.control}
                                    render={({ field }) => (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    disabled={isLoading}
                                                    className="relative size-24 [&_svg]:size-10 border"
                                                    style={{ backgroundColor: form.watch('color') }}
                                                >
                                                    <span className="text-5xl drop-shadow-lg">{field.value}</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="right" align="start" className="ml-1 w-64 p-1">
                                                <Emotions
                                                    value={field.value}
                                                    disabled={isLoading}
                                                    onClick={field.onChange}
                                                    className="data-[active=true]:bg-accent"
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild disabled={isLoading}>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full justify-start gap-2"
                                                    >
                                                        <div
                                                            className="size-5 rounded-full border"
                                                            style={{ backgroundColor: field.value }}
                                                        />
                                                        <span className="uppercase text-muted-foreground min-w-16">
                                                            {field.value}
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="p-0">
                                                    <HexColorPicker color={field.value} onChange={field.onChange} />
                                                    <Input placeholder="Hex color code" className="rounded-none"  {...field} />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-2">
                                <FormField
                                    name="name"
                                    control={form.control}
                                    render={({ field }) => {
                                        return (
                                            <FormItem className="space-y-1">
                                                <div className="flex justify-center items-center gap-1">
                                                    <Input
                                                        {...field}
                                                        maxLength={30}
                                                        autoComplete="off"
                                                        disabled={isLoading}
                                                        className="text-sm font-semibold xw-fit max-w-xs border-0 border-b-1 outline-none focus-visible:ring-0 shadow-none p-0 rounded-none"
                                                    />
                                                </div>
                                                <InputMaxIndicator max={30} value={field.value.length} align="start">
                                                    <FormMessage className="w-full text-xs" />
                                                </InputMaxIndicator>
                                            </FormItem>
                                        )
                                    }}
                                />
                                <FormField
                                    name="description"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <Input
                                                {...field}
                                                maxLength={30}
                                                autoComplete="off"
                                                placeholder={translateText(t, 'add.description')}
                                                className="border-0 border-b-1 text-sm outline-none focus-visible:ring-0 shadow-none p-0 max-w-xs rounded-none"
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="secondary"
                                    disabled={isLoading}
                                    onClick={() => form.reset()}
                                >
                                    {translateText(t, 'cancel', { capitalize: true })}
                                </Button>
                            </DialogClose>
                            <Button
                                size="sm"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                {translateText(t, 'save', { capitalize: true })}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent >
        </Dialog >
    )
}