"use client"
import React from "react"
import { cn } from "@/lib/utils"

import { ReactSortable } from "react-sortablejs"
import { AnalyticOverview } from "./analytic-overview";
import { AnalyticPriority } from "./analytic-priority";
import { AnalyticTeam } from "./analytic-team";
import { usePersistedState } from "@/hooks/use-persist";
import { AnalyticType } from "./analytic-type";
import { AnalyticActivity } from "./analytic-activity";


interface OrderItem {
    id: number;
    key: keyof typeof COMPONENT_MAP
}

const COMPONENT_MAP = {
    overview: AnalyticOverview,
    activity: AnalyticActivity,
    type: AnalyticType,
    priority: AnalyticPriority,
    team: AnalyticTeam
} as const;

const DEFAULT_ORDER: OrderItem[] = [
    { id: 1, key: 'overview' },
    { id: 2, key: 'activity' },
    { id: 3, key: 'priority' },
    { id: 4, key: 'team' },
    { id: 5, key: 'type' },
];

type Props = Pick<
    React.ComponentProps<typeof ReactSortable>,
    'className'
>

export function AnalyticLayout({
    className,
    ...props
}: Props) {
    const [order, setOrder] = usePersistedState('analytics-order', DEFAULT_ORDER);

    return (
        <ReactSortable
            {...props}
            delay={2}
            animation={200}
            delayOnTouchOnly
            list={order}
            setList={setOrder}
            handle=".drag-handle"
            className={cn('grid gap-5', className)}
        >
            {order.map((item) => {
                const Component = COMPONENT_MAP[item.key];
                return Component && <Component key={item.id} />;
            })}
        </ReactSortable>
    )
}