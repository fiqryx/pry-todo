"use client"
import { useMemo } from "react"
import { cn } from "@/lib/utils";
import { PRIORITY_MAP } from "@/types/misc";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRecentIssues } from "../use-recent-issue";

import { GripVertical } from "lucide-react";
import { Translate, translateText } from "@/components/translate";
import { Bar, Cell, XAxis, YAxis, BarChart, CartesianGrid } from "recharts"
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslation } from "react-i18next";

const iconColor = {
    highest: 'text-destructive',
    high: 'text-destructive',
    medium: 'text-warning',
    low: 'text-success',
    lowest: 'text-success'
} as const

const chartConfig = {
    highest: {
        label: "highest",
        color: "hsl(var(--chart-1))",
        icon: PRIORITY_MAP.highest,
    },
    high: {
        label: "high",
        color: "hsl(var(--chart-3))",
        icon: PRIORITY_MAP.high,
    },
    medium: {
        label: "medium",
        color: "hsl(var(--chart-2))",
        icon: PRIORITY_MAP.medium,
    },
    low: {
        label: "low",
        color: "hsl(var(--chart-4))",
        icon: PRIORITY_MAP.low,
    },
    lowest: {
        label: "lowest",
        color: "hsl(var(--chart-5))",
        icon: PRIORITY_MAP.lowest,
    },
} satisfies ChartConfig

export function AnalyticPriority(props: React.ComponentProps<typeof Card>) {
    const isMobile = useIsMobile();
    const { t } = useTranslation();
    const [issues] = useRecentIssues();

    const chartData = useMemo(() => {
        return Object.entries(chartConfig).map(
            ([priorityKey, config]) => ({
                priority: config.label,
                value: issues.filter(issue =>
                    issue.priority === priorityKey
                ).length,
                fill: config.color,
            })
        );
    }, [issues]);

    return (
        <Card {...props}>
            <CardHeader>
                <div className="inline-flex items-center gap-2">
                    <GripVertical className="size-4 hover:cursor-grab drag-handle" />
                    <Translate t={t} capitalize as={CardTitle} value="priority.breakdown" className="text-lg" />
                </div>
                <Translate t={t} as={CardDescription} value="priority.description" />
            </CardHeader>
            <CardContent className="flex items-center justify-around lg:h-[23rem] p-2 sm:p-6">
                {issues.length === 0 && (
                    <Translate t={t} value="priority.breakdown.empty" className="text-xs text-muted-foreground max-w-xs text-center" />
                )}
                {issues.length > 0 && (
                    <ChartContainer config={chartConfig} className="w-full xh-full md:p-6 md:pl-0">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            layout="horizontal"
                            margin={{
                                top: 0,
                                right: 0,
                                bottom: 10,
                                left: 0
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                tickMargin={10}
                                type="category"
                                dataKey="priority"
                                tick={(props) => {
                                    const value = props.payload.value as keyof typeof chartConfig;
                                    const Icon = chartConfig[value].icon;

                                    return (
                                        <foreignObject
                                            x={props.x - 18}
                                            y={props.y - 7}
                                            width={100}
                                            height={28}
                                            className="overflow-visible"
                                        >
                                            <div className="flex items-center h-full">
                                                {Icon && <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', iconColor[value])} />}
                                                <span className="ml-1 text-xs capitalize whitespace-nowrap text-muted-foreground">
                                                    {value}
                                                </span>
                                            </div>
                                        </foreignObject>
                                    );
                                }}
                            />
                            {!isMobile && (
                                <YAxis
                                    dataKey="value"
                                    type="number"
                                    allowDecimals={false}
                                    tickCount={Math.max(...chartData.map(d => d.value)) + 1}
                                    tickMargin={10}
                                />
                            )}
                            <ChartTooltip
                                cursor={false}
                                labelClassName="capitalize"
                                content={<ChartTooltipContent />}
                            />
                            <Bar
                                barSize={60}
                                fill="#8884d8"
                                dataKey="value"
                                layout="horizontal"
                                radius={[0, 2, 2, 0]}
                                name={translateText(t, 'count', { capitalize: true })}
                            >
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}