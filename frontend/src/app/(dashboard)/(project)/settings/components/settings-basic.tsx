'use client'
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

import { isEqual, merge } from "lodash";
import { Icons } from "@/components/icons";
import { useProject } from "@/stores/project";

import { HexColorPicker } from "react-colorful";
import { Emotions } from "@/components/emotions";
import { Skeleton } from "@/components/ui/skeleton";
import { saveProject } from "@/lib/services/project";
import { SquarePen, PaintBucket } from "lucide-react";
import { ProjectSchema } from "@/types/schemas/project";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"

import {
    useRef,
    useMemo,
    useState,
    useEffect,
    useCallback
} from 'react'
import {
    Input,
    InputIcon,
    InputMaxIndicator
} from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export function SettingsBasic({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    const inputRef = useRef<HTMLInputElement>(null);

    const { active, list, set, checkPermission } = useProject();
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    const [project, setter] = useState(active);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const setProject = useCallback(
        (state: Partial<typeof active>) =>
            setter(merge({}, project, state)),
        [project, setter]
    );

    const onUpdateProject = useCallback(
        (values: ProjectSchema) => async () => {
            try {
                setIsLoading(true);

                if (isEqual(values, active)) {
                    await new Promise(r => setTimeout(r, 500));
                    toast.info('No changes detected', {
                        description: 'The project data remains unchanged'
                    });
                    return;
                }

                const { data, error } = await saveProject(values);

                if (!data) {
                    toast.error(error || 'Failed to update project');
                    return
                }

                set({
                    active: data,
                    list: list.map(v => v.id === data.id ? data : v)
                })

                setProject(data);
                toast.success('Changes saved successfully', {
                    description: 'Your project has been updated'
                })
            } catch (error) {
                logger.debug(error);
                toast.error('An unexpected error occurred')
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, active, list, set]
    )

    useEffect(() => {
        if (active) setProject(active);
    }, [active])

    if (!active) {
        return <Skeleton className="h-52 w-full" />
    }

    return (
        <Card {...props} className={cn('', className)}>
            <CardContent className="flex flex-col gap-8 p-6">
                <div className="w-full flex flex-wrap justify-around items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                disabled={isLoading || !levelAdmin}
                                className="relative size-24 [&_svg]:size-10 border rounded-2xl"
                                style={{ backgroundColor: project?.color ?? '' }}
                            >
                                <span className="text-5xl drop-shadow-lg">{project?.image}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="ml-1 w-64 p-1">
                            <Emotions
                                disabled={isLoading || !levelAdmin}
                                value={project?.image ?? ''}
                                onClick={(value) => setProject({ image: value })}
                                className="data-[active=true]:bg-accent"
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex flex-col gap-2">
                        <div className="space-y-1">
                            <div className="w-full flex justify-center items-center gap-1">
                                <Input
                                    ref={inputRef}
                                    maxLength={30}
                                    autoComplete="off"
                                    value={project?.name ?? ''}
                                    disabled={isLoading || !levelAdmin}
                                    readOnly={!isEditing}
                                    placeholder="Enter the name"
                                    onBlur={() => setIsEditing(false)}
                                    onChange={(e) => setProject({ name: e.target.value })}
                                    className={cn(
                                        'border-0 border-b-1 text-sm font-semibold outline-none',
                                        'focus-visible:ring-0 focus-visible:border-primary shadow-none p-0 max-w-xs rounded-none'
                                    )}
                                >
                                    <InputIcon
                                        position="right"
                                        onClick={() => {
                                            setIsEditing(true)
                                            setTimeout(() => {
                                                const nativeInput = inputRef.current?.querySelector('input');
                                                nativeInput?.focus();
                                            }, 10);
                                        }}
                                        className={cn(
                                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                                            'size-6'
                                        )}
                                    >
                                        <SquarePen className="size-4" />
                                    </InputIcon>
                                </Input>

                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        asChild
                                        disabled={isLoading || !levelAdmin}
                                    >
                                        <div
                                            className={cn(
                                                buttonVariants({ variant: 'ghost', size: 'icon' }),
                                                'size-8 text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            <PaintBucket className="xscale-x-[-1]" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="left" align="center" className="flex items-center justify-center p-2">
                                        <HexColorPicker
                                            color={project?.color ?? ''}
                                            onChange={(color) => setProject({ color })}
                                        />
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <InputMaxIndicator
                                max={30}
                                align="start"
                                value={project?.name.length ?? 0}
                            />
                        </div>
                        <Input
                            maxLength={30}
                            autoComplete="off"
                            disabled={isLoading || !levelAdmin}
                            placeholder="Add description"
                            value={project?.description ?? ''}
                            onChange={(e) => setProject({ description: e.target.value })}
                            className={cn(
                                'border-0 border-b-1 text-sm outline-none rounded-none shadow-none',
                                'focus-visible:ring-0 focus-visible:border-primary p-0 max-w-xs'
                            )}
                        />
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isLoading || !levelAdmin || isEqual(project, active)}
                    onClick={onUpdateProject(project as ProjectSchema)}
                >
                    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Updating...' : 'Update'}
                </Button>
            </CardContent>
        </Card>
    )
}