'use client'
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useIssue } from "../use-issue"
import { useProject } from "@/stores/project"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tooltip } from "@/components/tooltip"
import { SidebarHeader } from "@/components/ui/sidebar"
import { IssueDropdown } from "@/components/issue-dropdown"
import { IssueDeleteDialog } from "@/components/issue-dialog"
import { Button, buttonVariants } from "@/components/ui/button"

import { EllipsisVertical, EyeIcon, RefreshCcw, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function IssueSidebarHeader({
    ...props
}: React.ComponentProps<typeof SidebarHeader>) {
    const router = useRouter();
    const { issue, onUpdateIssue } = useIssue();
    const { active, set: setProject, checkPermission } = useProject();

    const [openDialog, setOpenDialog] = useState(false);
    const levelAdmin = checkPermission('admin');

    return (
        <SidebarHeader {...props}>
            <div className="flex flex-row-reverse items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Tooltip label="Actions">
                            <div
                                className={cn(
                                    buttonVariants({ size: 'icon', variant: 'outline' }),
                                    'rounded-sm size-8'
                                )}
                            >
                                <EllipsisVertical />
                            </div>
                        </Tooltip>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                hidden={!levelAdmin}
                                onClick={() => setOpenDialog(true)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip label="Share">
                    <Button
                        size="icon"
                        variant="outline"
                        className="rounded-sm size-8"
                    >
                        <Share2 />
                    </Button>
                </Tooltip>
                <Tooltip label="Sync">
                    <Button
                        size="icon"
                        variant="outline"
                        className="size-8 rounded-sm"
                        onClick={() => setProject({ active })}
                    >
                        <RefreshCcw />
                    </Button>
                </Tooltip>
                <Tooltip label="Watch">
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-sm h-8"
                    >
                        <EyeIcon />
                        1
                    </Button>
                </Tooltip>
            </div>
            {issue && (
                <div className="flex items-center justify-between gap-1">
                    <IssueDropdown
                        name="type"
                        align='end'
                        issue={issue}
                        onValueChange={onUpdateIssue}
                        excludes={[issue.parents ? 'task' : 'subtask']}
                    />
                    <IssueDropdown
                        align="end"
                        name="status"
                        issue={issue}
                        onValueChange={onUpdateIssue}
                    />
                </div>
            )}

            <IssueDeleteDialog
                issue={issue}
                actions="issue"
                open={openDialog}
                onOpenChange={setOpenDialog}
                onDelete={() => {
                    toast.success('Delete successfully');
                    router.back();
                }}
            />
        </SidebarHeader>
    )
}