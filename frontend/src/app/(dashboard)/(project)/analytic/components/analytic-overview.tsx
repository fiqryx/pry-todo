"use client"
import React from "react"
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Translate } from "@/components/translate";
import { useRecentIssues } from "../use-recent-issue";
import { buttonVariants } from "@/components/ui/button";
import { Pie, Label, PieChart } from "recharts"
import { GripVertical, LucideIcon } from "lucide-react";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const config: ChartConfig = {
    todo: {
        label: 'Todo',
        color: "hsl(var(--muted-foreground) / 0.8)",
    },
    on_progress: {
        label: 'On progress',
        color: "hsl(var(--primary) / 0.8)",
    },
    done: {
        label: 'Done',
        color: "hsl(var(--success) / 0.8)",
    }
}
export function AnalyticOverview({
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t } = useTranslation();
    const [issues] = useRecentIssues();

    const chartData = React.useMemo(() => {
        return Object.entries(config).map(
            ([status, config]) => ({
                status: config.label,
                value: issues.filter(
                    v => v.status === status
                ).length,
                fill: config.color,
                icon: config.icon as LucideIcon
            })
        );
    }, [issues]);

    return (
        <Card {...props}>
            <CardHeader>
                <div className="inline-flex items-center gap-2">
                    <GripVertical className="size-4 hover:cursor-grab drag-handle" />
                    <Translate t={t} as={CardTitle} capitalize value="status.overview" className="text-lg" />
                </div>
                <CardDescription>
                    <Translate t={t} value="status.overview.snapshot" />.&nbsp;
                    <Translate t={t} as={Link} href="/backlog" value="view.all" className="text-primary hover:underline" />
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-around lg:h-[23rem] gap-4">
                {issues.length === 0 && (
                    <Translate t={t} value="status.overview.empty" className="text-xs text-muted-foreground max-w-xs text-center" />
                )}
                {issues.length > 0 && (
                    <ChartContainer
                        config={config}
                        className="aspect-square max-h-[300px] max-w-xs w-full"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                nameKey='status'
                                dataKey='value'
                                data={chartData}
                                strokeWidth={5}
                                innerRadius={90}
                            >
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-3xl font-bold"
                                                    >
                                                        {issues.length}
                                                    </tspan>
                                                    <Translate
                                                        t={t}
                                                        as="tspan"
                                                        capitalize
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                        value="total.issues"
                                                        className="fill-muted-foreground"
                                                    />
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
                <div className="flex flex-row lg:flex-col flex-wrap justify-center gap-1 lg:gap-4">
                    {chartData.map((item, idx) => (
                        <Link
                            key={idx}
                            href="#"
                            className={buttonVariants({
                                size: 'sm',
                                variant: 'ghost',
                                className: 'group justify-start w-fit'
                            })}
                        >
                            <div
                                className="size-5 rounded-sm"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm group-hover:underline">
                                {item.status}:
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {item.value}
                            </span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}