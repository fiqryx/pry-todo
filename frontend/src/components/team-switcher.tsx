"use client"
import React from "react"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

import { useAppStore } from "@/stores/app"
import { useProject } from "@/stores/project"
import { useTranslation } from "react-i18next"
import { ScrollArea } from "./ui/scroll-area"
import { ProjectDialog } from "./project-dialog"
import { Project } from "@/types/schemas/project"
import { Skeleton } from "@/components/ui/skeleton"
import { switchProject } from "@/lib/services/project"

import {
  Plus,
  ClipboardList,
  ChevronsUpDown,
  ClipboardPenLine,
} from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TeamSwitcher() {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();

  const { set: setApp } = useAppStore();
  const { active, list, set: setProject } = useProject();

  const [dialogOpen, setDialogOpen] = React.useState(false)

  const onSwitchProject = React.useCallback(async (item: Project) => {
    if (!list.length) return
    try {
      setApp({ loading: true, overlay: true, loading_message: 'Switching project...' });

      const { data, error } = await switchProject(item.id);

      if (!data) {
        toast(error)
        return
      }

      setProject({ active: data });
    } catch (e) {
      logger.error(e)
    } finally {
      setApp({ loading: false })
    }
  }, [active, list, setProject]);

  React.useEffect(() => {
    if (!list) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (list[index]) {
          onSwitchProject(list[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [list, onSwitchProject]);

  if (active === undefined) {
    return <Skeleton className="h-12 w-full rounded-md" />
  }

  if (!list.length) {
    return (
      <ProjectDialog>
        <SidebarMenuButton size="lg">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ClipboardPenLine className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="capitalize truncate font-semibold">
              {t('create.project')}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {t('empty.project')}
            </span>
          </div>
        </SidebarMenuButton>
      </ProjectDialog>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                style={{ backgroundColor: active?.color }}
                className="flex aspect-square size-8 items-center justify-center rounded-lg bg-accent"
              >
                <span className="text-xl drop-shadow-lg">
                  {active?.image ?? "💤"}
                </span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="capitalize truncate font-semibold">
                  {active?.name ?? t('choose.project')}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.description}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="capitalize text-xs text-muted-foreground">
              {t('projects')}
            </DropdownMenuLabel>
            <ScrollArea className={list.length > 5 ? 'h-64' : ''}>
              {list.map((item, idx) => (
                <DropdownMenuItem
                  key={idx}
                  className="gap-2 p-2 my-0.5 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground hover:cursor-pointer"
                  data-active={item.id === active?.id}
                  onClick={() => {
                    if (item.id !== active?.id) {
                      onSwitchProject(item)
                    }
                  }}
                >
                  <div
                    style={{ backgroundColor: item.color ?? undefined }}
                    className="flex size-8 items-center justify-center rounded-md border"
                  >
                    {item.image ? <span className="text-md drop-shadow-lg">{item.image}</span> : (
                      <ClipboardList className="size-4 shrink-0" />
                    )}
                  </div>
                  {item.name}
                  {idx < 9 && (
                    <DropdownMenuShortcut>
                      {navigator.platform.toUpperCase().includes('MAC') ? '⌥' : 'Alt+'}{idx + 1}
                    </DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => setDialogOpen(true)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="capitalize font-medium text-muted-foreground">
                {t('add.new')}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </SidebarMenu>
  )
}