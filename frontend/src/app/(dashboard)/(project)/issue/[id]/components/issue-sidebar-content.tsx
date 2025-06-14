'use client'
import { IssueSidebarHeader } from "./issue-sidebar-header"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { IssueDetail } from "./issue-detail"

export function IssueSidebarContent({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props}>
            <IssueSidebarHeader className="gap-2 p-4" />
            <SidebarContent className="p-2">
                <IssueDetail />
            </SidebarContent>
        </Sidebar>
    )
}