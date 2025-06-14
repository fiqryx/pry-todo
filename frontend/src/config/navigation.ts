import * as Lucide from "lucide-react"
import { Navigation } from "@/types/misc"

export const navigation: Navigation = {
    main: [
        {
            title: "Home",
            url: "/",
            icon: Lucide.Home,
        },
    ],
    planning: [
        {
            title: "Board",
            url: "/board",
            icon: Lucide.Columns3,
        },
        {
            title: "Analytics",
            url: "/analytic",
            icon: Lucide.ChartLine,
        },
        {
            title: "Backlog",
            url: "/backlog",
            icon: Lucide.Rows3,
        },
        {
            title: "Timeline",
            url: "/timeline",
            icon: Lucide.ChartNoAxesGantt,
        },
        // {
        //     title: "Calendar",
        //     url: "/calendar",
        //     icon: Lucide.CalendarFold,
        //     disabled: true,
        // },
        {
            title: "Settings",
            url: "/settings",
            icon: Lucide.Settings,
        },
    ],
}