"use client"
import { useMemo } from "react"
import { cn } from "@/lib/utils";
import { ISSUE_TYPE_MAP } from "@/types/misc";
import { useRecentIssues } from "../use-recent-issue";

import { GripVertical } from "lucide-react";
import { Translate } from "@/components/translate";
import { Progress } from "@/components/ui/progress";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "react-i18next";

export function AnalyticType({
    ...props
}: React.ComponentProps<typeof Card>) {
    const [issues] = useRecentIssues();
    const { t } = useTranslation();

    const data = useMemo(() => {
        if (!issues?.length) return [];

        const totalIssues = issues.length;
        const counts = Object.keys(ISSUE_TYPE_MAP).reduce((acc, type) => ({
            ...acc,
            [type]: 0
        }), {} as Record<keyof typeof ISSUE_TYPE_MAP, number>);

        issues.forEach(issue => {
            if (issue.type in counts) {
                counts[issue.type]++;
            }
        });

        const entries = Object.entries(ISSUE_TYPE_MAP) as Array<[keyof typeof ISSUE_TYPE_MAP, any]>

        const items = entries.map(([type, Comp]) => {
            const rawPercentage = (counts[type] / totalIssues) * 100;
            return {
                type,
                count: counts[type],
                icon: Comp,
                raw: rawPercentage,
                rounded: Math.round(rawPercentage * 10) / 10
            };
        });

        const totalRounded = items.reduce((sum, item) => sum + item.rounded, 0);
        const diff = 100 - totalRounded;

        if (diff !== 0) {
            const largestIndex = items.reduce((maxIndex, item, index) =>
                item.raw > items[maxIndex].raw ? index : maxIndex, 0);
            items[largestIndex].rounded += diff;
        }

        return items
            .map((item) => ({ ...item, percentage: item.rounded }))
            .filter(item => item.percentage > 0) // remove to show all type
    }, [issues]);


    return (
        <Card {...props}>
            <CardHeader>
                <div className="inline-flex items-center gap-2">
                    <GripVertical className="size-4 hover:cursor-grab drag-handle" />
                    <Translate t={t} capitalize as={CardTitle} value="types.work" className="text-lg" />
                </div>
                <Translate t={t} as={CardDescription} value="types.work.description" />
            </CardHeader>
            <CardContent className="lg:h-[23rem] overflow-y-auto">
                <Table className="text-sm">
                    <TableHeader className="[&_tr]:border-none">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold w-[30%]">
                                <Translate t={t} capitalize value="type" />
                            </TableHead>
                            <TableHead className="font-semibold w-[70%]">
                                <Translate t={t} capitalize value="distribution" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow key={idx} className="border-none">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <item.icon
                                            className={cn(
                                                'size-4 text-primary',
                                                item.type === 'task' && 'text-primary',
                                                item.type === 'subtask' && 'text-primary/80',
                                                item.type === 'bug' && 'text-destructive',
                                                item.type === 'story' && 'text-success',
                                                item.type === 'epic' && 'text-purple-500',
                                            )}
                                        />
                                        <span className="capitalize">{item.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center xmax-w-md gap-4">
                                        <Progress variant="muted" value={item.percentage} />
                                        <span className="text-xs w-8 text-right">
                                            {item.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {data.length === 0 && (
                    <div className="flex items-center justify-around min-h-52">
                        <Translate t={t} value="types.work.empty" className="text-xs text-muted-foreground max-w-xs text-center" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}