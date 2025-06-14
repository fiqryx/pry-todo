'use client'
import { useMemo } from "react";
import { useSettings } from "./use-setting";
import { useProject } from "@/stores/project";

import { SettingsIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PRIORITY_MAP, STATUS_MAP } from "@/types/misc";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export function SettingDetails({
    ...props
}: React.ComponentProps<typeof Card>) {
    const { active, checkPermission } = useProject()
    const { settings, handleSettingChange } = useSettings();
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    if (!active) {
        return <Skeleton className="h-[600px] w-full" />;
    }

    return (
        <Card {...props}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full p-2">
                        <SettingsIcon />
                    </Badge>
                    <CardTitle className="text-lg">Settings</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col mt-2 gap-8">
                <div className="flex flex-col gap-5">
                    <h3 className="text-md font-semibold leading-none tracking-tight">
                        General
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Require Description"
                                checked={settings?.requireDescription}
                                onChange={(requireDescription) => handleSettingChange({ requireDescription })}
                                description="Make description mandatory for new issues"
                            />
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Automatic Assignment"
                                checked={settings?.autoAssignment}
                                onChange={(autoAssignment) => handleSettingChange({ autoAssignment })}
                                description="Automatically assign new issues"
                            />
                            {settings?.autoAssignment && (
                                <SelectField
                                    disabled={!levelAdmin}
                                    label="Assignment Method"
                                    value={settings.assignmentMethod ?? 'round_robin'}
                                    options={[
                                        { value: 'round_robin', label: 'Round Robin' },
                                        { value: 'least_busy', label: 'Least Busy' },
                                        { value: 'random', label: 'Random' }
                                    ]}
                                    onChange={(v) => handleSettingChange({ assignmentMethod: v as 'random' })}
                                />
                            )}
                        </div>

                        <div className="space-y-4">
                            <SelectField
                                disabled={!levelAdmin}
                                label="Default Priority"
                                value={settings?.defaultIssuePriority ?? 'medium'}
                                options={Object.keys(PRIORITY_MAP).map(
                                    (value) => ({
                                        value,
                                        label: value.replace('_', ' ').replace(/^./, char => char.toUpperCase())
                                    })
                                )}
                                onChange={(v) => handleSettingChange({ defaultIssuePriority: v as 'medium' })}
                            />
                            <SelectField
                                disabled={!levelAdmin}
                                label="Default Status"
                                value={settings?.defaultIssueStatus ?? 'todo'}
                                options={Object.keys(STATUS_MAP).map(
                                    (value) => ({
                                        value,
                                        label: value.replace('_', ' ').replace(/^./, char => char.toUpperCase())
                                    })
                                )}
                                onChange={(v) => handleSettingChange({ defaultIssueStatus: v as 'todo' })}
                            />
                            <NumberField
                                min={1}
                                max={30}
                                disabled={!levelAdmin}
                                label="Default Due Date (Days)"
                                value={settings?.defaultDueDateOffset ?? 7}
                                onChange={(defaultDueDateOffset) => handleSettingChange({ defaultDueDateOffset })}
                                description="Days from creation date"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Enable Time Tracking"
                                checked={settings?.enableTimeTracking}
                                onChange={(enableTimeTracking) => handleSettingChange({ enableTimeTracking })}
                            />
                            {settings?.enableTimeTracking && (
                                <SelectField
                                    disabled={!levelAdmin}
                                    label="Time Units"
                                    value={settings.timeTrackingUnit ?? 'hours'}
                                    options={[
                                        { value: 'hours', label: 'Hours' },
                                        { value: 'days', label: 'Days' },
                                        { value: 'minutes', label: 'Minutes' }
                                    ]}
                                    onChange={(v) => handleSettingChange({ timeTrackingUnit: v as 'hours' })}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-5">
                    <h3 className="text-md font-semibold leading-none tracking-tight">
                        Workflow
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Enable Approval Workflow"
                                checked={settings?.enableApprovalWorkflow}
                                onChange={(enableApprovalWorkflow) => handleSettingChange({ enableApprovalWorkflow })}
                                description="Require approval for certain issue status changes"
                            />
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Require Due Dates"
                                checked={settings?.requireDueDate}
                                onChange={(requireDueDate) => handleSettingChange({ requireDueDate })}
                                description="Due dates are mandatory for all subtasks"
                            />
                        </div>

                        <div className="space-y-4">
                            <SwitchField
                                disabled={!levelAdmin}
                                label="Allow Attachments"
                                checked={settings?.allowAttachments}
                                onChange={(allowAttachments) => handleSettingChange({ allowAttachments })}
                            />
                            {settings?.allowAttachments && (
                                <NumberField
                                    min={1}
                                    max={100}
                                    disabled={!levelAdmin}
                                    label="Max Attachment Size (MB)"
                                    value={settings.maxAttachmentSize ?? 10}
                                    onChange={(maxAttachmentSize) => handleSettingChange({ maxAttachmentSize })}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <NumberField
                            min={1}
                            max={20}
                            disabled={!levelAdmin}
                            label="Max Tasks Per User"
                            value={settings?.taskLimitPerUser ?? 5}
                            onChange={(taskLimitPerUser) => handleSettingChange({ taskLimitPerUser })}
                            description="0 means no limit"
                        />
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-5">
                    <h3 className="text-md font-semibold leading-none tracking-tight">
                        Notifications
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <SwitchField
                                label="On Assignment"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnAssignment}
                                onChange={(notifyOnAssignment) => handleSettingChange({ notifyOnAssignment })}
                            />
                            <SwitchField
                                label="On Status Change"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnStatusChange}
                                onChange={(notifyOnStatusChange) => handleSettingChange({ notifyOnStatusChange })}
                            />
                        </div>

                        <div className="space-y-4">
                            <SwitchField
                                label="On Due Date"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnDueDate}
                                onChange={(notifyOnDueDate) => handleSettingChange({ notifyOnDueDate })}
                            />
                            <SwitchField
                                label="On Overdue"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnOverdue}
                                onChange={(notifyOnOverdue) => handleSettingChange({ notifyOnOverdue })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <SwitchField
                            disabled={!levelAdmin}
                            label="Daily Summary"
                            checked={settings?.dailyDigest}
                            onChange={(dailyDigest) => handleSettingChange({ dailyDigest })}
                            description="Receive daily summary of all issue activities"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Helper components
const SwitchField = ({ label, checked, disabled, onChange, description }: {
    label: string;
    checked?: boolean;
    disabled?: boolean;
    onChange: (val: boolean) => void;
    description?: string;
}) => (
    <div className="flex items-center justify-between">
        <div>
            <Label>{label}</Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Switch disabled={disabled} checked={checked} onCheckedChange={onChange} />
    </div>
);

const SelectField = ({ label, disabled, value, options, onChange, description }: {
    label: string;
    value: string;
    disabled?: boolean;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    description?: string;
}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <Select disabled={disabled} value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
);

const NumberField = ({ label, value, min, max, disabled, onChange, description }: {
    label: string;
    value: number;
    min: number;
    max: number;
    disabled?: boolean;
    onChange: (val: number) => void;
    description?: string;
}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <Input
            type="number"
            disabled={disabled}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-24"
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
);

// eslint-disable-next-line
export const IntegrationCard = ({ icon, name, enabled, onToggle, description }: {
    icon: React.ReactNode;
    name: string;
    enabled: boolean;
    onToggle: (val: boolean) => void;
    description: string;
}) => (
    <div className="border rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium">{name}</h4>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        {enabled && (
            <Button variant="outline" size="sm" className="mt-4">
                Configure Integration
            </Button>
        )}
    </div>
);