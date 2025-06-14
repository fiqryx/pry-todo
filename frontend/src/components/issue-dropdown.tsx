'use client'
import { omit } from "lodash";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { User } from "@/types/schemas/user";
import { useProject } from "@/stores/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Issue, MoveDirection } from "@/types/schemas/issue";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Translate } from "./translate";
import { getIssueColorClass } from "@/lib/internal";
import { ISSUE_MAPS, IssueEnum } from "@/types/internal";
import { updateIssueOrderIndex } from "@/lib/services/issues";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IssueDeleteDialog, IssueMoveDialog } from "@/components/issue-dialog";
import { ChevronDown, EllipsisVertical, LucideIcon, Trash2, UserIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next";

interface IssueDropdownProps<K extends keyof Issue> extends
    Omit<React.ComponentProps<typeof DropdownMenuContent>, 'defaultValue'> {
    disabled?: boolean;
    name: K;
    excludes?: Issue[K][];
    defaultValue?: Issue[K];
    issue: Issue;
    onValueChange?: (issue: Issue) => void;
}

export function IssueDropdown({
    className,
    disabled,
    onValueChange,
    excludes,
    name,
    issue,
    defaultValue,
    ...props
}: IssueDropdownProps<IssueEnum>) {
    const { active, checkPermission } = useProject();

    const [mapper, value, Comp] = useMemo(() => {
        let mapper = ISSUE_MAPS[name];
        if (excludes) mapper = omit(mapper, ...excludes) as typeof mapper;

        const value = issue[name] || defaultValue;
        const comp = (value in mapper ?
            (mapper as any)[value] : null) as LucideIcon | null;

        return [mapper, value, comp] as const;
    }, [issue, name, excludes]);

    const isDisable = useMemo(() =>
        !checkPermission('editor') || disabled,
        [active, disabled]
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isDisable}>
                <Badge
                    variant="outline"
                    className={cn(
                        'rounded-md capitalize text-xs font-normal py-1 px-1.5 gap-1',
                        isDisable ? 'text-muted-foreground' : 'hover:cursor-pointer',
                        className
                    )}
                >
                    <div className="flex gap-1">
                        {Comp && <Comp className={cn('size-4', getIssueColorClass(value))} />}
                        <span className="truncate">
                            {value?.replace('_', ' ').replace(/^./, char => char.toUpperCase())}
                        </span>
                    </div>
                    {!isDisable && <ChevronDown className="size-3 ml-auto" />}
                </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent {...props}>
                {Object.entries(mapper).map(([item, Icon], idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onClick={() => {
                            if (!disabled) onValueChange?.({ ...issue, [name]: item })
                        }}
                        className={cn(
                            'my-[1px] hover:cursor-pointer',
                            value === item && 'bg-accent text-accent-foreground'
                        )}
                    >
                        <Icon className={cn('size-4', getIssueColorClass(item as Issue[IssueEnum]))} />
                        {item.replace('_', ' ').replace(/^./, char => char.toUpperCase())}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface UserAvatarDropdownProps extends
    React.ComponentProps<typeof DropdownMenuContent> {
    disabled?: boolean
    value?: string
    hideLabel?: boolean
    size?: 'xs' | 'sm' | 'default' | 'lg'
    onValueChange?: (value?: string) => void
}

export function UserAvatarDropdown({
    className,
    disabled,
    onValueChange,
    value,
    hideLabel,
    size,
    ...props
}: UserAvatarDropdownProps) {
    const { active, checkPermission } = useProject();
    const [selected, setSelected] = useState<User>();

    const isDisable = useMemo(() =>
        !checkPermission('editor') || disabled,
        [active, disabled]
    );

    useEffect(() => {
        if (value && active?.users) {
            setSelected(active.users.find(v => v.id === value));
        }
    }, [value, active?.users]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isDisable} className="group">
                <div
                    className={cn(
                        'inline-flex items-center rounded-lg py-1 px-2 text-xs w-fit gap-3',
                        'hover:cursor-pointer hover:bg-accent/50 hover:text-accent-foreground',
                        isDisable && 'pointer-events-none',
                        hideLabel && 'p-0 rounded-full',
                        className
                    )}
                >
                    <Avatar
                        title={selected?.name || 'Unassigned'}
                        className={cn(
                            'border',
                            size === 'lg' && 'size-12',
                            size === 'default' && 'size-10',
                            size === 'sm' && 'size-8',
                            size === 'xs' && 'size-6',
                        )}
                    >
                        <AvatarImage src={selected?.image || undefined} alt={selected?.name} />
                        <AvatarFallback>
                            {selected?.name ? (
                                <AvatarFallback className="text-base font-medium">
                                    {selected.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            ) : (
                                <UserIcon
                                    className={cn(
                                        'text-muted-foreground',
                                        size === 'lg' && 'size-8',
                                        size === 'default' && 'size-6',
                                        size === 'sm' && 'size-5',
                                        size === 'xs' && 'size-4',
                                    )}
                                />
                            )}
                        </AvatarFallback>
                    </Avatar>
                    {!hideLabel && (
                        <span className="text-xs truncate">
                            {selected?.name || 'Unassigned'}
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent {...props}>
                {!!selected && (
                    <DropdownMenuItem
                        onClick={() => {
                            setSelected(undefined);
                            if (onValueChange) onValueChange(undefined);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="border size-8 hover:cursor-pointer">
                                <AvatarFallback>
                                    <UserIcon className="size-5 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate">Unassigned</span>
                        </div>
                    </DropdownMenuItem>
                )}
                {active?.users?.map((item, idx) =>
                    selected?.id !== item.id && (
                        <DropdownMenuItem
                            key={idx}
                            onClick={() => {
                                setSelected(item);
                                if (onValueChange) onValueChange(item.id);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="border size-8 hover:cursor-pointer">
                                    <AvatarImage src={item.image || undefined} alt={item.name} />
                                    <AvatarFallback className="text-xs font-medium">
                                        {item.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs truncate">{item.name}</span>
                            </div>
                        </DropdownMenuItem>
                    )
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface IssueActionMenuProps extends
    React.ComponentProps<typeof DropdownMenuContent> {
    disabled?: boolean
    index: number
    issue: Issue
    options: Issue[]
    count: number
    onMoveOrder?: (values: Issue[]) => void
    onMoveParent?: (values: Issue) => void
    onDelete?: (issue: Issue) => void
    onRemoveParent?: (issue: Issue) => void
}

export function IssueActionMenu({
    issue,
    index,
    count,
    options,
    onMoveOrder,
    onMoveParent,
    onRemoveParent,
    onDelete,
    children,
    disabled,
    ...props
}: IssueActionMenuProps) {
    const { t } = useTranslation();
    const { checkPermission } = useProject();

    const levelAdmin = checkPermission('admin');
    const levelEditor = checkPermission('editor');

    const [openMove, setOpenMove] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteAction, setDeleteAction] = useState<'issue' | 'parents'>('issue');

    const handleMove = useCallback(
        async (direction: MoveDirection) => {
            const { data: result = [], error } = await updateIssueOrderIndex(issue, direction);
            if (!result.length) {
                toast.error(error);
            }
            onMoveOrder?.(result)
        }, [issue]
    );

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" disabled={disabled} className="size-8 p-0">
                        <Translate t={t} value="actions" className="sr-only" />
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent {...props}>
                    {/* {!issue.parents && levelAdmin && (
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                hidden={!!issue.startDate}
                                disabled={issue.status === 'done' || !!issue.startDate}
                                onClick={() => setOpenSprint(!openSprint)}
                            >
                                Start sprint
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </DropdownMenuGroup>
                    )} */}

                    <DropdownMenuGroup hidden={!levelEditor}>
                        <Translate t={t} as={DropdownMenuLabel} value="parent" className="text-xs" />
                        <DropdownMenuItem
                            disabled={!levelAdmin}
                            onClick={() => setOpenMove(!openMove)}
                        >
                            <Translate t={t} value={issue.parents ? 'move.parent' : 'add.parent'} />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!issue.parents || !levelAdmin}
                            onClick={() => {
                                setDeleteAction('parents');
                                setOpenDelete(true);
                            }}
                        >
                            <Translate t={t} value="remove.parent" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </DropdownMenuGroup>

                    <DropdownMenuGroup hidden={!levelAdmin || count <= 1}>
                        <Translate t={t} as={DropdownMenuLabel} value="position" className="text-xs" />
                        <DropdownMenuItem
                            hidden={index === 0}
                            disabled={index === 0}
                            onClick={() => handleMove('top')}
                        >
                            <Translate t={t} value="move.to">
                                <Translate t={t} value="top" />
                            </Translate>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            hidden={index === 0}
                            disabled={index === 0}
                            onClick={() => handleMove('up')}
                        >
                            <Translate t={t} value="move.to">
                                <Translate t={t} value="up" />
                            </Translate>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            hidden={index === count - 1}
                            disabled={index === count - 1}
                            onClick={() => handleMove('down')}
                        >
                            <Translate t={t} value="move.to">
                                <Translate t={t} value="down" />
                            </Translate>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            hidden={index === count - 1}
                            disabled={index === count - 1}
                            onClick={() => handleMove('bottom')}
                        >
                            <Translate t={t} value="move.to">
                                <Translate t={t} value="bottom" />
                            </Translate>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </DropdownMenuGroup>

                    <DropdownMenuGroup>
                        {children}
                        <DropdownMenuItem
                            hidden={!levelAdmin}
                            disabled={issue.status !== 'todo'}
                            onClick={() => {
                                setDeleteAction('issue');
                                setOpenDelete(true);
                            }}
                        >
                            <Translate t={t} value="delete" className="capitalize" />
                            <DropdownMenuShortcut>
                                <Trash2 className="size-4" />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <IssueDeleteDialog
                issue={issue}
                open={openDelete}
                onDelete={onDelete}
                actions={deleteAction}
                disabled={!levelAdmin}
                onOpenChange={setOpenDelete}
                onRemoveParent={onRemoveParent}
            />
            <IssueMoveDialog
                value={issue}
                disabled={disabled}
                open={openMove}
                onOpenChange={setOpenMove}
                options={options}
                onValueChange={(value) => onMoveParent?.(value)}
            />
        </>
    )
}