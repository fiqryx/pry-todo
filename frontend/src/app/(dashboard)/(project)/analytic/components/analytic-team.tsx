"use client"
import { useMemo, useEffect } from "react"
import { User } from "@/types/schemas/user";
import { useProject } from "@/stores/project";
import { useTranslation } from "react-i18next";
import { useRecentIssues } from "../use-recent-issue";

import { Translate } from "@/components/translate";
import { Progress } from "@/components/ui/progress";
import { GripVertical, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AnalyticTeam({
    ...props
}: React.ComponentProps<typeof Card>) {
    const { active } = useProject();
    const [issues] = useRecentIssues();
    const { t } = useTranslation();

    const data = useMemo(() => {
        if (!active?.users || !issues.length) return [];

        const users: User[] = [
            {
                id: 'unassigned',
                name: 'Unassigned',
                email: '',
                image: '',
                createdAt: '',
                updatedAt: '',
                projectId: ''
            },
            ...active.users
        ]

        return users.map(user => {
            const list = active.users || [];
            const count = user.id === 'unassigned'
                ? issues.filter(
                    (issue) => !issue.assigneeId || !list.some(u => u.id === issue.assigneeId)
                ).length
                : issues.filter(issue => issue.assigneeId === user.id).length;

            const rawPercentage = (count / issues.length) * 100;

            return {
                ...user,
                count,
                percentage: Math.round(rawPercentage * 10) / 10,
            };
        })
            .filter(user => user.percentage > 0); // remove if want show all users
    }, [active?.users, issues]);


    useEffect(() => {
        if (!active) return
        document.title = `Analytic - ${active.name}`;
    }, [active])

    return (
        <Card {...props}>
            <CardHeader>
                <div className="inline-flex items-center gap-2">
                    <GripVertical className="size-4 hover:cursor-grab drag-handle" />
                    <Translate t={t} capitalize as={CardTitle} value="team.workload" className="text-lg" />
                </div>
                <Translate t={t} as={CardDescription} value="team.workload.description" />
            </CardHeader>
            <CardContent className="lg:h-[23rem] overflow-y-auto">
                <Table className="text-sm">
                    <TableHeader className="[&_tr]:border-none">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold w-[30%]">
                                <Translate t={t} capitalize value="assignee" />
                            </TableHead>
                            <TableHead className="font-semibold w-[70%]">
                                <Translate t={t} capitalize value="work.distribution" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((user, idx) => (
                            <TableRow key={idx} className="border-none">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="size-6 rounded-full">
                                            <AvatarImage src={user.image || undefined} />
                                            <AvatarFallback>
                                                <UserIcon className="size-3.5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Progress variant='success' value={user.percentage} />
                                        <span className="text-xs w-8 text-right">
                                            {user.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {data.length === 0 && (
                    <div className="flex items-center justify-around min-h-52">
                        <Translate t={t} value="team.workload.empty" className="text-xs text-muted-foreground max-w-xs text-center" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}