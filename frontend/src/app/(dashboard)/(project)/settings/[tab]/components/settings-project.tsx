'use client'
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isEqual, pick } from "lodash";
import { logger } from "@/lib/logger";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth";
import { useProject } from "@/stores/project";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useEffect, useCallback } from 'react'

import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"
import { HexColorPicker } from "react-colorful";
import { Emotions } from "@/components/emotions";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";

import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarWithPreview } from "@/components/image-preview";
import { Translate, translateText } from "@/components/translate";
import { CrownIcon, EllipsisVertical, PlusIcon } from "lucide-react";
import { removeProjectAccess, saveProject } from "@/lib/services/project";
import { DeleteProjectDialog } from "../../components/setting-delete-project";
import { AccessLevelDialog, InviteUserDialog } from "@/components/invite-user";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formSchema = z.object({
    name: z.string().min(1, "Project name is required").max(30),
    description: z.string().max(100).optional(),
    image: z.string().min(1, "Icon is required"),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code")
});

export function SettingsProject({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    const {
        active,
        list,
        getTeams,
        set: setProject,
        checkPermission
    } = useProject();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: active?.name || '',
            description: active?.description || '',
            image: active?.image || '',
            color: active?.color || '#f4f4f5'
        }
    });

    const [tempUser, setTempUser] = useState<typeof user>();
    const [isLoading, setIsLoading] = useState(false);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const watchImage = form.watch("image");
    const teams = useMemo(getTeams, [active]);
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);
    const levelOwner = useMemo(() => checkPermission('owner'), [active]);

    const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            if (isEqual(values, pick(active, ['name', 'image', 'color', 'description']))) {
                toast.info('No changes detected', {
                    description: 'The project data remains unchanged'
                });
                return;
            }

            const { data, error } = await saveProject({ ...values, id: active?.id });
            if (!data) {
                toast.error(error || 'Failed to update project');
                return;
            }

            setProject({
                active: data,
                list: list.map(v => v.id === data.id ? data : v)
            });

            toast.success('Changes saved successfully', {
                description: 'Your project has been updated'
            });
        } catch (error) {
            logger.debug(error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [active]);

    const onRemoveTeams = useCallback(
        async () => {
            if (!active || !tempUser) return
            try {
                setRemoveLoading(true);
                const { data, error } = await removeProjectAccess(active.id, tempUser.id);

                if (!data) {
                    toast.error(error);
                    return
                }

                const users = teams.filter(v => v.id !== tempUser?.id);
                setProject({ active: { ...active, users } });

                toast.success('Successfully', {
                    description: `${tempUser?.name} has been remove from your teams`
                });
            } catch (error) {
                logger.debug(error);
                toast.error('An unexpected error occurred');
            } finally {
                setOpenDeleteDialog(false);
                setRemoveLoading(false);
            }
        },
        [active, teams, tempUser, openDeleteDialog]
    );

    useEffect(() => {
        if (active) {
            form.reset({
                name: active.name,
                description: active.description,
                image: active.image,
                color: active.color
            });
        }
    }, [active, form]);

    if (!active) {
        return <Skeleton className="h-52 w-full" />;
    }

    return (
        <Card {...props} className={cn('rounded-md', className)}>
            <CardContent className="flex flex-col gap-4 p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-8 md:grid-cols-[auto_1fr]">
                            <div className="space-y-4">
                                <div className="flex flex-col items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={() => (
                                            <FormItem>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            disabled={isLoading || !levelAdmin}
                                                            className="relative size-24 [&_svg]:size-10 border-2 rounded-2xl"
                                                            style={{ backgroundColor: form.watch("color") }}
                                                            type="button"
                                                        >
                                                            <span className="text-5xl drop-shadow-lg">
                                                                {watchImage || '?'}
                                                            </span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent side="right" align="start" className="ml-1 w-64 p-2">
                                                        <Emotions
                                                            disabled={isLoading || !levelAdmin}
                                                            value={watchImage}
                                                            onClick={(value) => form.setValue("image", value)}
                                                            className="data-[active=true]:bg-accent"
                                                        />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <Label>{translateText(t, 'background.color')}</Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild disabled={isLoading || !levelAdmin}>
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
                                                <DropdownMenuContent className="p-4">
                                                    <HexColorPicker
                                                        color={field.value}
                                                        onChange={field.onChange}
                                                    />
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <Input
                                                            className="flex-1 uppercase"
                                                            placeholder="Hex color code"
                                                            {...field}
                                                        />
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <Translate capitalize t={t} as={Label} htmlFor="project-name" value="name" />
                                            <FormControl>
                                                <div className="relative flex-1">
                                                    <Input
                                                        id="project-name"
                                                        maxLength={30}
                                                        autoComplete="off"
                                                        placeholder="Awesome Project"
                                                        disabled={isLoading || !levelAdmin}
                                                        className="pl-3 pr-10 py-2 text-base"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <Translate t={t} value="max.characters" options={{ value: 30 }} />
                                                <span>{field.value?.length || 0}/30</span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <Translate capitalize t={t} as={Label} htmlFor="project-description" value="description" />
                                            <FormControl>
                                                <Input
                                                    id="project-description"
                                                    maxLength={100}
                                                    autoComplete="off"
                                                    disabled={isLoading || !levelAdmin}
                                                    placeholder={`${translateText(t, "project.description")}...`}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <Translate t={t} value="optional.description" />
                                                <span>{field.value?.length || 0}/100</span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <DeleteProjectDialog>
                                <Button size="sm" variant="destructive" disabled={!levelOwner}>
                                    {translateText(t, 'delete.project', { capitalize: true })}
                                </Button>
                            </DeleteProjectDialog>
                            <Button
                                size="sm"
                                type="submit"
                                disabled={isLoading || !levelAdmin || isEqual(form.getValues(), pick(active, ['name', 'image', 'color', 'description']))}
                            >
                                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                <Translate value="save.changes" />
                            </Button>
                        </div>
                    </form>
                </Form>
                <Separator />
                <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-md font-semibold leading-none tracking-tight">
                            {translateText(t, 'team.management')}
                        </h3>
                        {levelAdmin && (
                            <InviteUserDialog
                                asChild
                                allowInvite={levelAdmin}
                                title={translateText(t, 'invite.user', { capitalize: true })}
                                description={translateText(t,
                                    levelAdmin ? 'invite.collaborators'
                                        : 'project.worker'
                                )}
                            >
                                <Button size="sm" variant="outline">
                                    <PlusIcon />
                                    {translateText(t, 'invite.user', { capitalize: true })}
                                </Button>
                            </InviteUserDialog>
                        )}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map((item) => (
                            <div key={item.id} className="flex items-center rounded-md border gap-3 p-3">
                                <AvatarWithPreview
                                    src={item.image}
                                    className="size-12 border"
                                    fallback={item.name?.charAt(0) || 'U'}
                                    classNames={{
                                        fallback: 'text-xs font-medium'
                                    }}
                                />

                                <div className="flex w-full items-center justify-between gap-2">
                                    <div className="flex flex-col w-full gap-1">
                                        <Translate
                                            as="p"
                                            capitalize={user?.id === item.id}
                                            className="text-sm font-medium truncate"
                                            value={user?.id === item.id ? 'you' : item.name}
                                        />
                                        <div className="flex items-center gap-1.5">
                                            <Translate capitalize value={item.role || "owner"} className="text-xs text-muted-foreground" />
                                            {(item.role === 'owner' || item.role === 'admin') && (
                                                <CrownIcon
                                                    className={cn(
                                                        'h-3 w-3',
                                                        item.role === 'admin' && 'text-amber-500 fill-amber-500',
                                                        item.role === 'owner' && 'text-purple-500 fill-purple-500',
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {(levelAdmin && item.role !== 'owner' && user && user.id !== item.id) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="size-8 rounded-md">
                                                    <EllipsisVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-52">
                                                <DropdownMenuItem
                                                    disabled={!levelAdmin}
                                                    onClick={() => {
                                                        setTempUser(item);
                                                        setOpenDialog(true);
                                                    }}
                                                >
                                                    {translateText(t, 'access.level', { capitalize: true })}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    disabled={!levelAdmin}
                                                    className="text-red-500 focus:text-destructive"
                                                    onClick={() => {
                                                        setTempUser(item);
                                                        setOpenDeleteDialog(true);
                                                    }}
                                                >
                                                    <Translate t={t} value="remove.from">
                                                        {translateText(t, 'teams')}
                                                    </Translate>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <AccessLevelDialog
                    projectId={active.id}
                    user={tempUser}
                    open={openDialog}
                    onOpenChange={(open) => {
                        if (!open) setTempUser(undefined);
                        setOpenDialog(open);
                    }}
                    description="Change access level"
                    title={translateText(t, 'access.level', { capitalize: true })}
                    onSave={(user) => {
                        const users = teams.map(v => v.id === user?.id ? user : v);
                        setProject({ active: { ...active, users } });
                        setOpenDialog(false);
                    }}
                />

                <Dialog
                    open={openDeleteDialog}
                    onOpenChange={(open) => {
                        if (!open) setTempUser(undefined);
                        setOpenDeleteDialog(open);
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <Translate capitalize t={t} as={DialogTitle} value="remove.value">
                                {translateText(t, 'teams')}
                            </Translate>
                            <Translate t={t} as={DialogDescription} value="remove.teams.description">
                                <b>{tempUser?.name}</b>
                            </Translate>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="secondary"
                                    disabled={isLoading}
                                    className="capitalize"
                                    onClick={() => setTempUser(undefined)}
                                >
                                    {t('cancel')}
                                </Button>
                            </DialogClose>
                            <Button
                                size="sm"
                                disabled={removeLoading}
                                className="capitalize"
                                variant="destructive"
                                onClick={onRemoveTeams}
                            >
                                {removeLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                {t('remove')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}