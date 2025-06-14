"use client"
import Link from "next/link";
import { useMemo } from "react"
import { cn } from "@/lib/utils";
import { useProject } from "@/stores/project";
import { ISSUE_TYPE_MAP } from "@/types/misc";
import { User } from "@/types/schemas/user";
import { Issue } from "@/types/schemas/issue";
import type { Activity } from "@/types/schemas/activity";

import { useTranslation } from "react-i18next";
import { Translate } from "@/components/translate";
import { RealTimeAgo } from "@/components/time-ago";
import { useRecentIssues } from "../use-recent-issue";
import { GripVertical, UserIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { AvatarWithPreview } from "@/components/image-preview";
import { getActivityMessage, getIssueColorClass } from "@/lib/internal";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card"

export function AnalyticActivity({
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t } = useTranslation();
    const [issues] = useRecentIssues();
    const { active, getTeams } = useProject();

    const teams = useMemo(getTeams, [active]);
    const activities = useMemo(() => {
        const items = issues.flatMap(issue => {
            const parents = issue.parents ? issues.find(v => v.id === issue.parents) : null;
            return issue.activities?.map(activity => ({
                ...activity,
                issue: issue,
                parents
            })) || []
        });

        const sorted = [...items].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return sorted
    }, [issues])

    return (
        <Card {...props}>
            <CardHeader>
                <div className="inline-flex items-center gap-2">
                    <GripVertical className="size-4 hover:cursor-grab drag-handle" />
                    <CardTitle className="text-lg">
                        <Translate t={t} capitalize value="recent.activity" />
                    </CardTitle>
                </div>
                <Translate t={t} as={CardDescription} value="recent.activity.description" />
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea>
                    <div className="flex flex-col h-[23rem] gap-4 p-2 sm:p-6 sm:pt-0">
                        {activities.length === 0 && (
                            <div className="flex items-center justify-around min-h-52">
                                <Translate t={t} value="recent.activity.empty" className="text-xs text-muted-foreground max-w-xs text-center" />
                            </div>
                        )}

                        {activities.map((item) => <Activity key={item.id} activity={item} teams={teams} />)}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

interface ActivityProps extends
    React.ComponentProps<'div'> {
    activity: Activity & { issue: Issue }
    teams: User[]
}

function Activity({
    activity,
    teams,
    className,
    ...props
}: ActivityProps) {
    const Comp = ISSUE_TYPE_MAP[activity.issue.type];

    const user = useMemo(() => activity.user, [activity]);
    const message = useMemo(
        () => getActivityMessage(activity, teams),
        [activity, teams]
    );

    const status = useMemo<string>(
        () => activity.new?.status || activity.old?.status || activity.issue.status,
        [activity]
    );

    return (
        <div {...props} className={cn("p-2", className)}>
            <div className="flex items-start gap-2">
                <AvatarWithPreview
                    alt={user?.name}
                    src={user?.image}
                    className="size-10 cursor-pointer"
                    fallback={activity?.user?.name.slice(0, 1) || <UserIcon className="size-6 text-muted-foreground" />}
                />
                <div className="flex flex-col">
                    <div className="flex flex-col lg:flex-row lg:items-center text-xs gap-1">
                        <span className="text-sm font-semibold">{user?.name}</span>
                        <span title={message} className="max-w-32 sm:max-w-40 truncate">
                            {message}
                        </span>

                        {/* Enable for showing the parents */}
                        {/* {activity.parents && (
                            <div className="inline-flex items-center border rounded-sm text-primary p-1 gap-1">
                                <SquareCheck className="size-4" />
                                <Link
                                    className="hover:underline"
                                    href={`/issues/${activity.parents.id}`}
                                >
                                    {activity.parents?.title || `#${activity.parents.id}`}
                                </Link>
                                <div className={cn(
                                    'ml-1 rounded-sm capitalize text-xs py-0.5 px-1',
                                    activity.parents.status === 'todo' && 'bg-secondary text-secondary-foreground',
                                    activity.parents.status === 'on_progress' && 'bg-primary/20 text-primary',
                                    activity.parents.status === 'done' && 'bg-success/20 text-success',
                                )}>
                                    {activity.parents.status.replace('_', ' ').replace(/^./, char => char.toUpperCase())}
                                </div>
                            </div>
                        )} */}

                        <div className="inline-flex items-center border rounded-sm p-1 gap-1">
                            <Comp className={cn('size-4', getIssueColorClass(activity.issue.type))} />
                            <Link
                                title={activity.issue?.title}
                                href={`/issue/${activity.issueId}`}
                                className="hover:underline max-w-32 sm:max-w-52 truncate"
                            >
                                {activity.issue?.title || `#${activity.issueId}`}
                            </Link>
                            <div className={cn(
                                'ml-1 rounded-sm capitalize text-xs py-0.5 px-1',
                                status === 'draft' && 'bg-secondary text-secondary-foreground',
                                status === 'todo' && 'bg-secondary text-secondary-foreground',
                                status === 'on_progress' && 'bg-primary/20 text-primary',
                                status === 'done' && 'bg-success/20 text-success',
                            )}>
                                {status?.replace('_', ' ')?.replace(/^./, char => char.toUpperCase())}
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <RealTimeAgo date={activity.createdAt} options={{ showTime: true }} />
                    </div>
                </div>
            </div>
        </div>
    )
}