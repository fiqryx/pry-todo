'use client'
import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Editor } from '@tiptap/react';
import { useIssues } from "../use-issue";
import { useProject } from "@/stores/project";
import { useIssueContext } from "./backlog-details";

import { Issue } from "@/types/schemas/issue";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { FormatAction } from "@/components/minimal-tiptap/types";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { CalendarWithTime } from "@/components/ui/calendar";

import {
    BanIcon,
    SaveIcon,
    SquarePen,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface BacklogEditorProps {
    className?: string
    item: keyof Omit<Issue, 'project'
        | 'assignee'
        | 'reporter'
        | 'comments'
        | 'items'
        | 'createdAt'
        | 'updatedAt'
        | 'activities'
        | 'creator'
    >
}

export function BacklogEditor({ item, className }: BacklogEditorProps) {
    const issue = useIssueContext();
    const setIssues = useIssues()[1];

    const { active, checkPermission } = useProject();
    const levelEditor = React.useMemo(() => checkPermission('editor'), [active]);

    const ref = React.useRef<HTMLInputElement>(null);
    const [editMode, setEditMode] = React.useState(false);
    const [value, setValue] = React.useState(issue[item]);

    const isDate = value instanceof Date;

    if (!editMode || !levelEditor) {
        const renderContent = () => {
            if (item !== 'label' || isDate) {
                return <span>{isDate ? format(value, "LLL dd, y, HH:mm") : value}</span>;
            }

            if (!value) return '-';

            return value.toString().split(',').map((item, idx) => (
                <Badge
                    key={idx}
                    variant="primary"
                    className="rounded-full capitalize text-xs font-normal py-1 px-2"
                >
                    {item.trim()}
                </Badge>
            ));
        };

        return (
            <div className={cn('flex flex-wrap gap-0.5', className)}>
                {renderContent()}
                {levelEditor && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-4 [&_svg]:size-3"
                        onClick={() => {
                            setEditMode(true);
                            setTimeout(() => ref.current?.focus(), 10);
                        }}
                    >
                        <SquarePen />
                    </Button>
                )}
            </div>
        )
    }

    if (isDate) {
        return (
            <Popover open={editMode} onOpenChange={setEditMode}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "text-xs text-left font-normal",
                            !value && "text-muted-foreground",
                            className
                        )}
                    >
                        {value ? format(value, "LLL dd, y") : 'Pick a date'}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="top" align="end">
                    <CalendarWithTime
                        selected={value}
                        onSelect={(v) => {
                            if (v && v !== issue[item]) {
                                setEditMode(false);
                                setValue(v);
                                setIssues({ ...issue, [item]: v });
                            }
                        }}
                    />
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Input
            ref={ref}
            defaultValue={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
            }}
            onBlur={() => {
                setEditMode(false);
                if (value && value !== issue[item]) {
                    setIssues({ ...issue, [item]: value })
                }
            }}
            className={cn(
                'border-0 outline-none focus-visible:ring-0 shadow-none p-0 max-w-sm rounded-none',
                editMode && 'border-b-1 border-dashed',
                className
            )}
        />
    )
}

interface BacklogTiptapEditorProps {
    placeholder?: string
    autoHide?: boolean
    value?: string
    onChange?: (Value: string) => void
    onSave?: (Value: string) => void
    onCancel?: (Value: string) => void
    className?: string
}

export function BacklogTiptapEditor({
    autoHide,
    value,
    onChange,
    onSave,
    onCancel,
    placeholder = 'Add a description',
    className
}: BacklogTiptapEditorProps) {
    const ref = React.useRef<Editor>(null);
    const [editMode, setEditMode] = React.useState(!autoHide);

    const { active, checkPermission } = useProject();
    const levelEditor = React.useMemo(() => checkPermission('editor'), [active]);

    const actions = React.useMemo<FormatAction[]>(() => [
        {
            value: 'save',
            label: 'Save',
            icon: <SaveIcon className="size-5" />,
            action: (editor) => {
                if (autoHide) setEditMode(false);
                editor.chain().blur().run();
                onSave?.(value as string);
            },
            isActive: () => false,
            canExecute: (editor) => editor.can().chain().focus().run(),
            shortcuts: ['mod', 'S']
        },
        {
            value: 'cancel',
            label: 'Cancel',
            icon: <BanIcon className="size-5" />,
            shortcuts: ['mod', 'E'],
            isActive: () => false,
            canExecute: () => true,
            action: (editor) => {
                if (autoHide) setEditMode(false);
                editor.chain().blur().run();
                onCancel?.(value as string);
            }
        }
    ], [value, editMode, setEditMode]);

    if (!editMode || !levelEditor) {
        return (
            <div
                onClick={() => {
                    setEditMode(!editMode);
                    setTimeout(() => ref.current?.commands.focus(), 10);
                }}
                className={cn(
                    'flex h-auto max-h-60 overflow-y-auto w-full flex-col rounded-md border border-input border-dashed minimal-tiptap-editor p-2',
                    !levelEditor && 'hover:cursor-text hover:bg-accent hover:text-accent-foreground hover:border-input'
                )}
            >
                <div
                    className={cn(
                        'tiptap ProseMirror text-sm text-muted-foreground',
                        !value && 'text-center text-xs'
                    )}
                    dangerouslySetInnerHTML={{ __html: value || placeholder }}
                />
            </div>
        )
    }

    return (
        <MinimalTiptapEditor
            editable
            injectCSS
            output="html"
            throttleDelay={0}
            placeholder="Write here..."
            onChange={(v) => onChange?.(v as string)}
            className={cn('w-full focus-within:border-ring min-h-40', className)}
            addControl={{ mainActionCount: 2, actions }}
            onCreate={({ editor: e }) => {
                if (e.isEmpty) e.commands.setContent(value as string);
                ref.current = e;
            }}
            editorProps={{
                attributes: { class: 'focus:outline-hidden p-5' },
                handleKeyDown: (_, e) => {
                    if (e.key === 's' && e.ctrlKey) {
                        e.preventDefault();
                        if (autoHide) setEditMode(false);
                        onSave?.(value as string);
                    }

                    if (e.key === 'e' && e.ctrlKey) {
                        e.preventDefault();
                        if (autoHide) setEditMode(false);
                        onCancel?.(value as string);
                    }
                },
            }}
        />
    )
}