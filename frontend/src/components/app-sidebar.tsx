"use client"
import { omit } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"
import { useProject } from "@/stores/project"
import { navigation } from "@/config/navigation"
import type { NavMain } from "@/types/misc"

import { Skeleton } from "@/components/ui/skeleton"
import { NavUser } from "@/components/nav-user"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavMain as NavMainComp } from "@/components/nav-main"
import { FeedbackSidebarItem } from "@/components/feedback-dialog"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const { active, list } = useProject()

  const navKeys = Object.keys(
    omit(navigation, 'footer')
  ) as (keyof typeof navigation)[];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="xborder-b">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          {navKeys.map((key, idx) => (
            <NavMainComp
              key={idx}
              label={key !== 'main' ? key : ''}
              items={navigation[key] as NavMain[]}
              disabled={key === 'planning' && (!active?.id || !list.length)}
            />
          ))}
        </ScrollArea>
        <FeedbackSidebarItem className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {!user ? <Skeleton className="h-12 w-full rounded-md" /> : <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
