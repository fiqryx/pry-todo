'use client'
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { cn, omit } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { useForm } from "react-hook-form"
import { User } from "@/types/schemas/user"
import { useAuthStore } from "@/stores/auth"
import { useState, useCallback, useEffect } from "react"

import { Tooltip } from "@/components/tooltip"
import { Input } from "@/components/ui/input"
import { USER_ROLES_MAP } from "@/types/misc"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Translate } from "@/components/translate"
import { zodResolver } from "@hookform/resolvers/zod"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { inviteUser, changeProjectAccess } from "@/lib/services/project"
import { projectInviteSchema, ProjectInviteSchema } from "@/types/schemas/project"

import { AvatarWithPreview } from "@/components/image-preview"
import { Check, CrownIcon, UserIcon, UserPlus2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogHeader, DialogTitle, DialogTrigger, DialogContent, DialogDescription } from "@/components/ui/dialog"

interface InviteUserDialogProps extends
    React.ComponentProps<typeof Dialog>,
    Pick<React.ComponentProps<typeof DialogContent>, 'onInteractOutside'> {
    title?: string
    description?: string
    className?: string
    users?: User[]
    allowInvite?: boolean
    asChild?: boolean
    disabled?: boolean
}

export function InviteUserDialog({
    users,
    children,
    className,
    title = "Team's",
    allowInvite,
    onInteractOutside,
    description,
    asChild,
    disabled,
    ...props
}: InviteUserDialogProps) {
    return (
        <Dialog {...props}>
            <DialogTrigger disabled={disabled} asChild={asChild}>
                {children}
            </DialogTrigger>
            <DialogContent
                onInteractOutside={onInteractOutside}
                className={cn('max-w-xs sm:max-w-md p-4 rounded-xl', className)}
            >
                <DialogHeader className="text-center space-y-0">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/90">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea>
                    <div className="grid h-full max-h-96 sm:max-h-max gap-5">
                        {allowInvite && <InviteUserForm />}
                        {allowInvite && !!users && <Separator />}
                        {!!users && (
                            <div className="grid gap-2">
                                <h4 className="text-xs font-semibold">
                                    <Translate capitalize value="teams" />&nbsp;
                                    ({users.length ?? 0})
                                </h4>
                                <ScrollArea className="max-h-52 rounded-md border">
                                    {users.map((item, idx) => (
                                        <TeamView key={idx} user={item} />
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

interface AccessLevelDialogProps extends
    React.ComponentProps<typeof Dialog>,
    Pick<React.ComponentProps<typeof DialogContent>, 'onInteractOutside'> {
    projectId: string
    title?: string
    description?: string
    className?: string
    user?: User
    asChild?: boolean
    disabled?: boolean
    onSave?: (user?: User) => void
}

export function AccessLevelDialog({
    projectId,
    title,
    description,
    user,
    asChild,
    disabled,
    className,
    children,
    onSave,
    onInteractOutside,
    ...props
}: AccessLevelDialogProps) {
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(false);
    const [role, setRole] = useState<keyof typeof USER_ROLES_MAP>();

    const handleSave = useCallback(async () => {
        if (!projectId || !user?.id || !role) return
        try {
            setLoading(true);
            const { data, error } = await changeProjectAccess(projectId, user?.id, role);
            if (!data) {
                toast.error(error);
                return
            }
            onSave?.({ ...user, role } as User);
            toast.success('Update successfully');
        } catch (error) {
            logger.error(error);
            toast.error('Failed to change access level');
        } finally {
            setLoading(false);
        }
    }, [projectId, user, role]);

    useEffect(() => {
        setRole(user?.role)
    }, [user]);

    return (
        <Dialog {...props}>
            <DialogTrigger disabled={disabled} asChild={asChild}>
                {children}
            </DialogTrigger>
            <DialogContent
                onInteractOutside={onInteractOutside}
                className={cn('max-w-md p-4 rounded-xl', className)}
            >
                <DialogHeader className="text-center space-y-0">
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/90">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                    {Object.keys(omit(USER_ROLES_MAP, 'owner')).reverse().map((item, idx) => {
                        const Comp = USER_ROLES_MAP[item as keyof typeof USER_ROLES_MAP];
                        return (
                            <Button
                                key={idx}
                                type="button"
                                variant="outline"
                                className={cn(
                                    "flex items-start gap-3 text-start text-xs h-14 p-3",
                                    "data-[active=true]:bg-primary/10 data-[active=true]:border-primary",
                                    "hover:bg-accent/50 transition-colors"
                                )}
                                data-active={role === item}
                                onClick={() => setRole(item as keyof typeof USER_ROLES_MAP)}
                            >
                                <div className="flex items-center justify-center p-2 border rounded-lg bg-background">
                                    <Comp className="size-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 flex flex-col gap-0.5">
                                    <Translate t={t} capitalize value={item} className="capitalize font-medium" />
                                    <Translate t={t} as="p" value={`${item}.access`} className="text-xs text-muted-foreground" />
                                </div>
                                {role === item && <Check className="size-4 text-primary ml-auto" />}
                            </Button>
                        );
                    })}
                </div>

                <Button size="sm" disabled={isLoading} onClick={handleSave}>
                    {isLoading ? <Icons.spinner className="animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                    <Translate t={t} value="save.changes" />
                </Button>
            </DialogContent>
        </Dialog>
    )
}

export function InviteUserForm() {
    const { t } = useTranslation();
    const [isLoading, setLoading] = useState(false);
    const { setError, ...form } = useForm<ProjectInviteSchema>({
        resolver: zodResolver(projectInviteSchema),
        defaultValues: {
            email: '',
            role: 'viewer'
        },
    });

    const onSubmit = useCallback(
        async (values: ProjectInviteSchema) => {
            try {
                setLoading(true)
                const { data, error } = await inviteUser({ ...values });
                if (!data) throw new Error(error)
                form.reset();
                toast.success(data);
            } catch (e: any) {
                logger.debug(e);
                toast.error(e?.message ?? 'An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        },
        [form]
    );

    return (
        <Form setError={setError} {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <Translate
                                capitalize
                                as={FormLabel}
                                htmlFor="email"
                                value="email.address"
                                className="text-xs font-semibold"
                            />
                            <FormControl>
                                <Input
                                    id="email"
                                    className="h-10"
                                    autoComplete="off"
                                    placeholder="teammate@example.com"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                <FormField
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem className="grid">
                            <Translate t={t} capitalize as={FormLabel} value="access.level" className="text-xs font-semibold" />
                            {Object.keys(omit(USER_ROLES_MAP, 'owner')).reverse().map((item, idx) => {
                                const Comp = USER_ROLES_MAP[item as keyof typeof USER_ROLES_MAP];
                                return (
                                    <Button
                                        key={idx}
                                        type="button"
                                        variant="outline"
                                        className={cn(
                                            "flex items-start gap-3 text-start text-xs h-14 p-3",
                                            "data-[active=true]:bg-primary/10 data-[active=true]:border-primary",
                                            "hover:bg-accent/50 transition-colors"
                                        )}
                                        data-active={field.value === item}
                                        onClick={() => field.onChange(item)}
                                    >
                                        <div className="flex items-center justify-center p-2 border rounded-lg bg-background">
                                            <Comp className="size-5 text-muted-foreground" />
                                        </div>
                                        <div className="grid w-full gap-0.5">
                                            <Translate t={t} capitalize value={item} className="capitalize font-medium" />
                                            <Translate t={t} value={`${item}.access`} className="text-xs text-muted-foreground truncate" />
                                        </div>
                                        {field.value === item && <Check className="size-4 text-primary ml-auto" />}
                                    </Button>
                                );
                            })}
                        </FormItem>
                    )}
                />
                <Button size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? <Icons.spinner className="animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                    <Translate t={t} value="send.invitation" />
                </Button>
            </form>
        </Form>
    )
}

interface AvatartUsersProps extends
    Omit<React.ComponentProps<'div'>, 'onClick'> {
    users: User[]
    slice?: number
    placeholder?: string
    onClick?: (user?: User) => void
}

export function AvatartUsers({
    users,
    slice = 3,
    className,
    placeholder,
    onClick,
    ...props
}: AvatartUsersProps) {
    const showPlaceholer = placeholder && users.length < slice
    return (
        <div
            {...props}
            className={cn("inline-flex mx-4", className)}
        >
            {showPlaceholer && (
                <Tooltip label={placeholder}>
                    <div
                        suppressHydrationWarning
                        onClick={() => onClick?.()}
                        className="-ml-3 rounded-full border-2 cursor-pointer z-1 hover:z-10">
                        <Avatar className="size-9">
                            <AvatarFallback className="text-muted-foreground">
                                <UserIcon className="size-5" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </Tooltip>
            )}
            {users.slice(0, showPlaceholer ? slice - 1 : slice).map((item, idx) => (
                <Tooltip key={idx} label={item.name}>
                    <div
                        suppressHydrationWarning
                        onClick={() => onClick?.(item)}
                        className="-ml-3 rounded-full border-2 cursor-pointer z-1 hover:z-10"
                    >
                        <Avatar className="size-9">
                            <AvatarImage src={item.image} alt={item.name} />
                            <AvatarFallback>
                                {item.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </Tooltip>
            ))}
        </div>
    )
}

interface TeamViewProps
    extends React.ComponentProps<'div'> {
    user: User
}

export function TeamView({
    user,
    className,
    ...props
}: TeamViewProps) {
    const { user: userAuth } = useAuthStore();
    const isSelf = userAuth?.id === user.id;

    return (
        <div
            {...props}
            className={cn(
                'flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors',
                className
            )}
        >
            <AvatarWithPreview
                src={user.image}
                className="h-9 w-9 border cursor-pointer"
                fallback={user.name?.charAt(0) || 'U'}
                classNames={{
                    fallback: 'text-xs font-medium'
                }}
            />

            <div className="flex-1 min-w-0">
                <Translate
                    as="p"
                    capitalize={isSelf}
                    value={isSelf ? 'you' : user.name}
                    className="text-sm font-medium truncate"
                />
                <div className="flex items-center gap-1.5">
                    <Translate capitalize value={user.role || "owner"} className="text-xs text-muted-foreground" />
                    {(user.role === 'owner' || user.role === 'admin') && (
                        <CrownIcon
                            className={cn(
                                'h-3 w-3',
                                user.role === 'admin' && 'text-amber-500 fill-amber-500',
                                user.role === 'owner' && 'text-purple-500 fill-purple-500',
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}