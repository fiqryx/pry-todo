'use client'
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { useProject } from "@/stores/project";
import { useTranslation } from "react-i18next";

import { ShieldAlert } from "lucide-react";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteProject } from "@/lib/services/project";

import React, {
    useMemo,
    useState,
    useCallback
} from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { translateText } from "@/components/translate";

export function SettingDeleteProject({
    ...props
}: React.ComponentProps<typeof Card>) {
    const { active } = useProject();

    if (!active) {
        return <Skeleton className="h-52 w-full" />
    }

    return (
        <Card {...props}>
            <CardHeader className="flex-row justify-between items-center">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="rounded-full p-2">
                        <ShieldAlert />
                    </Badge>
                    <CardTitle>
                        Security
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col mt-2 gap-6">
                <span className="text-muted-foreground">
                    A deleted project cannot be restored. All data will be permanently removed.
                </span>
                <DeleteProjectDialog />
            </CardContent>
        </Card>
    )
}

export function DeleteProjectDialog({ children }: { children?: React.ReactNode }) {
    const { t } = useTranslation();
    const { active, list, set: setProject, checkPermission } = useProject();
    const levelOwner = useMemo(() => checkPermission('owner'), [active]);

    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onDelete = useCallback(async () => {
        if (!active || !levelOwner) return
        try {
            setIsLoading(true);

            const project = active;
            const { data, error } = await deleteProject(project.id);

            if (error) throw new Error(error);

            toast.success(`Project ${project.name} has been deleted.`);

            if (!data) {
                window.location.reload();
                return
            }

            setProject({
                active: data,
                list: list.filter(v => v.id !== project.id)
            });
        } catch (e: any) {
            logger.debug(e);
            toast.error(e?.message || 'Deleted project failed!')
        } finally {
            setIsLoading(false);
            setOpen(false);
        }
    }, [active, list, levelOwner]);

    if (!active) {
        return <Skeleton className="h-52 w-full" />
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ?? (
                    <Button size="sm" variant="outline" disabled={!levelOwner}>
                        {translateText(t, 'delete', { capitalize: true })}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent aria-describedby="delete-project" className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {translateText(t, 'delete.project', { capitalize: true })}
                    </DialogTitle>
                    <DialogDescription>
                        {translateText(t, 'delete.project.description', { capitalize: true })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button size="sm" variant="secondary" disabled={isLoading}>
                            {translateText(t, 'cancel', { capitalize: true })}
                        </Button>
                    </DialogClose>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isLoading || !levelOwner}
                    >
                        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                        {translateText(t, 'delete', { capitalize: true })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}