'use client'
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Issue } from "@/types/schemas/issue";
import { useProject } from "@/stores/project";
import { Tooltip } from "@/components/tooltip";
import { ISSUE_MAPS } from "@/types/internal";
import { useAuthStore } from "@/stores/auth";
import { getIssueColorClass } from "@/lib/internal";
import { TConfig } from "@/components/ui/old-unused/date-timeline-v2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "lucide-react";

export const config: TConfig<Issue> = {
    label: 'title',
    startDate: 'startDate',
    endDate: (item) => (item.dueDate || item.doneDate) as Date,
    header: (item) => {
        const Icon = ISSUE_MAPS.type[item.type];
        return (
            <div className="flex flex-shrink-0 items-center gap-1.5 max-w-full">
                <div className="icon">
                    <Icon className={cn('size-4', getIssueColorClass(item.type))} />
                </div>
                <Link href={`/issue/${item.id}`} className="text-xs truncate font-semibold underline-offset-1 hover:underline hover:text-primary">
                    {item.title}
                </Link>
            </div>
        )
    },
    render: (item) => {
        const { user } = useAuthStore();
        const { getTeams } = useProject();

        const Status = ISSUE_MAPS.status[item.status];
        const Priority = ISSUE_MAPS.priority[item.priority];
        const assignee = getTeams().find(v => v.id === item.assigneeId);
        const startDate = item.startDate ? format(item.startDate, "EEE, MMM d ") : '';
        const endDate = item.dueDate ? format(item.dueDate, "EEE, MMM d") : ''

        return (
            <div className="flex flex-shrink-0 items-center gap-1 max-w-full">
                <Tooltip label={!assignee?.id ? 'Unassigned' : assignee.id === user?.id ? 'You' : assignee.name}>
                    <Avatar className="size-7 mr-1">
                        <AvatarImage src={assignee?.image} alt={assignee?.name} />
                        <AvatarFallback className="text-muted-foreground">
                            {assignee?.name.slice(0, 1) || <UserIcon className="size-4" />}
                        </AvatarFallback>
                    </Avatar>
                </Tooltip>
                <div className="icon">
                    <Status className={cn('size-4', getIssueColorClass(item.status))} />
                </div>
                <div title={item.priority}>
                    <Priority className={cn('size-4', getIssueColorClass(item.priority))} />
                </div>
                <span title={`${startDate} - ${endDate}`} className="text-xs truncate font-normal">
                    {`${startDate} - ${endDate}`}
                </span>
            </div>
        )
    },
}