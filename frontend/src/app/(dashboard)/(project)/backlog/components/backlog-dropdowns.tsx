'use client'
import { Icons } from "@/components/icons";
import { useProject } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Translate } from "@/components/translate";

import { useRef, useState, ChangeEvent, useCallback } from "react"
import { Globe, CopyCheck, Paperclip, PlusIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface AddItemDropdownProps extends
    React.ComponentProps<typeof DropdownMenuContent> {
    disabled?: boolean
    size?: "sm" | "default" | "lg" | "icon"
    onAddWebLink?: () => void
    onAttacmentChange?: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function AddItemDropdown({
    disabled,
    size = 'sm',
    onAddWebLink,
    onAttacmentChange,
    ...props
}: AddItemDropdownProps) {
    const { active } = useProject();
    const attachmentRef = useRef<HTMLInputElement>(null);
    const [isLoading, setLoading] = useState(false);

    const uploadAttachment = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            setLoading(true)
            await onAttacmentChange?.(e)
            setLoading(false)
        },
        [onAttacmentChange]
    );

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={disabled}>
                    <Button size={size} disabled={disabled} variant="outline">
                        {isLoading ? <Icons.spinner className="animate-spin" /> : <PlusIcon />}
                        {isLoading ? 'Uploading' : 'Add'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent {...props}>
                    <DropdownMenuItem
                        disabled={isLoading || !active?.setting?.allowAttachments}
                        onClick={() => {
                            if (attachmentRef.current) {
                                attachmentRef.current.value = '';
                                attachmentRef.current.files = null;
                                attachmentRef.current.click();
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Paperclip className="size-4" />
                            <Translate value="attachment" className="capitalize text-xs truncate" />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                        <div className="flex items-center gap-3">
                            <CopyCheck className="size-4" />
                            <Translate value="linked.work" className="capitalize text-xs truncate" />
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={isLoading}
                        onClick={onAddWebLink}
                    >
                        <div className="flex items-center gap-3">
                            <Globe className="size-4" />
                            <Translate value="web.link" className="capitalize text-xs truncate" />
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                type="file"
                name="attachment"
                ref={attachmentRef}
                className="hidden"
                disabled={isLoading}
                onChange={uploadAttachment}
            />
        </>
    )
}