"use client"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge";
import { useRecentIssues } from "../use-recent-issue";

import { Translate } from "@/components/translate";
import { subDays, addDays, isBefore, isAfter } from "date-fns";
import { CalendarIcon, CheckCircle, CopyCheck, FilePen } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next";

export function AnalyticWidget({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [issues] = useRecentIssues();
    const { t } = useTranslation();

    const widgets = useMemo(() => {
        const now = new Date();
        const sevenDaysFromNow = addDays(now, 7);
        const sevenDaysAgo = subDays(new Date(), 7);

        return [
            {
                label: 'completed',
                icon: CheckCircle,
                value: issues.filter(
                    v => v.status === 'done' && new Date(v.updatedAt) >= sevenDaysAgo
                ).length
            },
            {
                label: 'updated',
                icon: FilePen,
                value: issues.filter(v => new Date(v.updatedAt) >= sevenDaysAgo).length
            },
            {
                label: 'created',
                icon: CopyCheck,
                value: issues.filter(v => new Date(v.createdAt) >= sevenDaysAgo).length
            },
            {
                label: 'due.soon',
                icon: CalendarIcon,
                value: issues.filter(v => {
                    const due = v.status !== 'done' && v.dueDate && new Date(v.dueDate);
                    return due && isAfter(due, now) && isBefore(due, sevenDaysFromNow);
                }).length
            },
        ]
    }, [issues]);

    return (
        <div {...props} className={cn('grid auto-rows-min', className)}>
            {widgets.map((item, idx) => (
                <Card key={idx}>
                    <CardHeader className="flex flex-row items-center p-6 gap-4">
                        <Badge variant="outline" className="rounded-full size-12">
                            <item.icon />
                        </Badge>
                        <div className="flex flex-col">
                            <Translate t={t} as={CardTitle} value={`count.${item.label}`} className="text-lg tracking-tight font-semibold">
                                {item.value}
                            </Translate>
                            <Translate t={t} as={CardDescription} value="count.last.days" className="text-muted-foreground">
                                7
                            </Translate>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}