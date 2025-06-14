'use client'
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { debounce, omit } from "lodash"
import { useFilter } from "../use-filter"
import { useAppStore } from "@/stores/app"
import { useRouter } from "next/navigation"
import { useProject } from "@/stores/project"
import { useTranslation } from "react-i18next"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Project } from "@/types/schemas/project"
import { Skeleton } from "@/components/ui/skeleton"
import { EllipsisVertical, Trash2 } from "lucide-react"
import { ProjectDialog } from "@/components/project-dialog"
import { Translate, translateText } from "@/components/translate"

import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteProject, getProjects, switchProject } from "@/lib/services/project"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ProjectViews({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const router = useRouter();
    const { t } = useTranslation();
    const { set: setApp } = useAppStore();
    const { active, list, set: setProject } = useProject();

    const [filter] = useFilter();
    const [isSync, setSync] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editDialog, setEditDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const [projectId, setProjectId] = useState<string>();
    const [editProject, setEditProject] = useState<Project>();
    const [projects, setProjects] = useState<Project[]>([]);

    const syncProject = useCallback(
        async (filters: Omit<typeof filter, 'layout'>) => {
            try {
                setSync(true);
                const { data, error } = await getProjects(filters);

                if (!data) {
                    logger.debug(error);
                    return
                }

                setProjects(data);
            } catch (error) {
                logger.error(error);
            } finally {
                setSync(false);
            }
        },
        []
    );

    const debouncedSyncProject = useMemo(
        () => debounce(syncProject, 300),
        [syncProject]
    );

    const onDeleteProject = useCallback(
        async () => {
            try {
                if (!projectId) return
                setIsLoading(true);

                const { data, error } = await deleteProject(projectId);

                if (error) {
                    logger.debug(error);
                    toast.error(error);
                    return
                }

                setProject({
                    active: data,
                    list: list.filter(v => v.id !== projectId)
                });
            } catch (e) {
                logger.debug(e)
            } finally {
                setProjectId(undefined);
                setIsLoading(false);
                setDeleteDialog(false);
            }
        },
        [projectId, projects]
    );

    const onSwitchProject = useCallback(
        async (item: Project) => {
            if (!list.length) return

            if (active && item.id === active.id) {
                router.push('/settings/project');
                return
            }

            try {
                setApp({ loading: true, overlay: true, loading_message: 'Switching project...' });

                const { data, error } = await switchProject(item.id);

                if (!data) {
                    toast(error)
                    return
                }

                setProject({ active: data });
                router.push('/settings/project');
            } catch (e) {
                logger.error(e);
                toast.error('failed to switch project')
            } finally {
                setApp({ loading: false })
            }
        },
        [active, list, setProject]
    );

    useEffect(() => {
        debouncedSyncProject(omit(filter, 'layout'));

        return () => debouncedSyncProject.cancel();
    }, [filter.search, filter.sort, list]);

    useEffect(() => {
        syncProject(omit(filter, 'layout'));
    }, []);

    if (isSync) {
        return (
            <div
                {...props}
                className={cn(
                    'grid gap-4',
                    filter.layout === 'grid' && 'lg:grid-cols-3',
                    className
                )}
            >
                <Skeleton className="w-full h-20" />
                <Skeleton className="w-full h-20" />
                <Skeleton className="w-full h-20" />
            </div>
        )
    }

    return (
        <div
            {...props}
            className={cn(
                'grid gap-4',
                projects.length > 0 && filter.layout === 'grid' && 'lg:grid-cols-3',
                className
            )}
        >
            {projects.length === 0 && (
                <div className="w-full flex items-center justify-center min-h-52">
                    <Translate t={t} capitalize value="create.first.project" className="text-xs text-muted-foreground max-w-xs text-center" />
                </div>
            )}

            {projects.map((item, idx) => (
                <div
                    key={idx}
                    className="group rounded-xl border bg-card text-card-foreground shadow-sm hover:border-accent-foreground/30"
                >
                    <div className="flex justify-between gap-2 p-4">
                        <div className="flex gap-2">
                            <div
                                style={{ backgroundColor: item.color ?? undefined }}
                                className="flex aspect-square size-12 items-center justify-center rounded-lg"
                            >
                                <span className="text-3xl drop-shadow-lg">{item.image}</span>
                            </div>
                            <div className="flex flex-col text-sm truncate leading-tight min-w-24">
                                <div
                                    onClick={() => onSwitchProject(item)}
                                    className="text-xs font-semibold hover:underline cursor-pointer"
                                >
                                    {item.name}
                                </div>
                                <span className="text-xs text-muted-foreground capitalize">
                                    {item.description}
                                </span>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="size-6">
                                    <span className="sr-only">{t('actions')}</span>
                                    <EllipsisVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-lg">
                                <DropdownMenuItem
                                    className="capitalize"
                                    onClick={() => {
                                        setEditDialog(true);
                                        setEditProject(item);
                                    }}
                                >
                                    {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="capitalize"
                                    onClick={() => onSwitchProject(item)}
                                >
                                    {t('settings')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="capitalize"
                                    onClick={() => {
                                        setDeleteDialog(true);
                                        setProjectId(item.id);
                                    }}
                                >
                                    {t('delete')}
                                    <DropdownMenuShortcut>
                                        <Trash2 className="size-4" />
                                    </DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            ))}

            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {translateText(t, 'delete.project', { capitalize: true })}
                        </DialogTitle>
                        <DialogDescription>
                            {translateText(t, 'delete.project.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                size="sm"
                                type="button"
                                variant="secondary"
                                disabled={isLoading}
                                className="capitalize"
                                onClick={() => setProjectId(undefined)}
                            >
                                {t('cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            size="sm"
                            disabled={isLoading}
                            className="capitalize"
                            variant="destructive"
                            onClick={onDeleteProject}
                        >
                            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                            {t('delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProjectDialog
                open={editDialog}
                data={editProject}
                onOpenChange={(state) => {
                    if (!state) setEditProject(undefined);
                    setEditDialog(state)
                }}
            />
        </div>
    )
}