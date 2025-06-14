'use client'
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useIssue } from "../use-issue";
import { InputTiptapEditor } from '@/components/input-editor';

interface IssueDescriptionProps extends
    React.ComponentProps<'div'> {
    disabled?: boolean
}

export function IssueDescription({
    className,
    disabled,
    ...props
}: IssueDescriptionProps) {
    const { issue, onUpdateIssue } = useIssue();
    const [description, setDescription] = useState(issue?.description);

    return (
        <div
            {...props}
            className={cn('flex flex-col gap-1', className)}
        >
            <span className="text-xs font-semibold">
                Description
            </span>
            <InputTiptapEditor
                autoHide
                disabled={disabled}
                value={description}
                placeholder='Add a description'
                onChange={setDescription}
                onCancel={() => setDescription(issue?.description)}
                onSave={(description) => {
                    if (description !== issue?.description) {
                        onUpdateIssue({ description });
                    }
                }}
            />
        </div>
    )
}