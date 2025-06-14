'use client'
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Editor } from '@tiptap/react';
import React, { useRef, useState, forwardRef, ComponentProps, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { FormatAction } from "./minimal-tiptap/types";
import { Ban, SaveIcon, SquarePen } from "lucide-react";
import { CalendarWithTime } from "@/components/ui/calendar";
import { MinimalTiptapEditor } from "@/components/minimal-tiptap";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";

type InputValue = string | number | Date

interface InputEditorProps extends
    Omit<ComponentProps<typeof Input>, 'value' | 'onChange'> {
    hideIcon?: boolean
    value?: InputValue
    onValueChange?: (value?: InputValue) => void
    side?: "top" | "right" | "bottom" | "left"
    align?: "center" | "start" | "end"
    children?: React.ReactNode
}

const InputEditor = forwardRef<HTMLInputElement, InputEditorProps>(
    ({ onValueChange, className, disabled, hideIcon, side, align, children, ...props }, ref) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [editMode, setEditMode] = useState(false);
        const [value, setValue] = useState(props.value);

        if (!editMode || disabled) {
            const renderContent = () => {
                if (!value) return '-';

                return (
                    <span
                        suppressHydrationWarning
                        className={cn(!disabled && 'cursor-pointer', className)}
                        onClick={() => {
                            if (!disabled) {
                                setEditMode(true);
                                setTimeout(() => inputRef.current?.focus(), 10);
                            }
                        }}
                    >
                        {value instanceof Date ? format(value, "LLL dd, y, HH:mm") : value}
                    </span>
                )
            }

            return (
                <div className={cn('flex flex-wrap gap-1', className)}>
                    {children ?? renderContent()}
                    {!disabled && !hideIcon && (
                        <sup
                            className="cursor-pointer size-3 [&_svg]:size-2.5"
                            onClick={() => {
                                setEditMode(true);
                                setTimeout(() => inputRef.current?.focus(), 10);
                            }}
                        >
                            <SquarePen />
                        </sup>
                    )}
                </div>
            )
        }

        if (value instanceof Date) {
            return (
                <Popover
                    open={editMode}
                    onOpenChange={(open) => {
                        setEditMode(open);
                        if (!open) onValueChange?.(value)
                    }}
                >
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
                    <PopoverContent side={side ?? "top"} align={align ?? "end"} className="w-auto p-0">
                        <CalendarWithTime selected={value} onSelect={setValue} />
                    </PopoverContent>
                </Popover>
            )
        }

        return (
            <Input
                {...props}
                ref={(el) => {
                    if (typeof ref === 'function') {
                        ref(el);
                    } else if (ref) {
                        ref.current = el;
                    }
                    inputRef.current = el;
                }}
                value={value}
                disabled={disabled}
                onChange={(e) => setValue(e.currentTarget.value)}
                onBlur={() => {
                    setEditMode(false);
                    if (value && value !== props.value) {
                        onValueChange?.(value);
                    }
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className={cn(
                    'border-0 outline-none focus-visible:ring-0 shadow-none p-0 w-fit rounded-none',
                    editMode && 'border-b-1',
                    className
                )}
            />
        )
    }
);
InputEditor.displayName = "InputEditor"

interface InputTiptapEditorProps {
    placeholder?: string
    disabled?: boolean
    autoHide?: boolean
    value?: string
    onChange?: (Value: string) => void
    onSave?: (Value: string) => void
    onCancel?: (Value: string) => void
    className?: string
}

const InputTiptapEditor = forwardRef<Editor, InputTiptapEditorProps>(
    ({ placeholder, disabled, autoHide, onSave, onCancel, onChange, className, value }, ref) => {
        const inputRef = useRef<Editor>(null);
        const [editMode, setEditMode] = useState(false);

        const actions = useMemo<FormatAction[]>(() => [
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
                icon: <Ban className="size-5" />,
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

        if (!editMode || disabled) {
            return (
                <ScrollArea>
                    <div
                        onClick={() => {
                            if (!disabled) {
                                setEditMode(!editMode);
                                setTimeout(() => inputRef.current?.commands.focus(), 10);
                            }
                        }}
                        className={cn(
                            'flex flex-col size-full max-h-60 minimal-tiptap-editor hover:bg-accent hover:text-accent-foreground p-1',
                            className
                        )}
                    >
                        <div
                            className={cn(
                                'tiptap xProseMirror text-sm text-muted-foreground cursor-default',
                                disabled && 'cursor-not-allowed'
                            )}
                            dangerouslySetInnerHTML={{ __html: value || placeholder || '' }}
                        />
                    </div>
                </ScrollArea>
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
                    if (typeof ref === 'function') {
                        ref(e);
                    } else if (ref) {
                        ref.current = e;
                    }
                    inputRef.current = e;
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
);
InputTiptapEditor.displayName = "InputTiptapEditor"

export {
    InputEditor,
    InputTiptapEditor
}