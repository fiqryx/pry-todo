'use client'
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useProject } from "@/stores/project";
import { ISSUE_MAPS } from "@/types/internal";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { translateText } from "@/components/translate";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "../../components/use-setting";
import { SwitchField, SelectField } from "@/components/switch-field";

export function SettingsGeneral({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t } = useTranslation();
    const { active, checkPermission } = useProject()
    const { settings, handleSettingChange } = useSettings();
    const levelAdmin = useMemo(() => checkPermission('admin'), [active]);

    if (!active) {
        return <Skeleton className="h-[600px] w-full" />;
    }

    return (
        <Card {...props} className={cn('rounded-md', className)}>
            <CardContent className="flex flex-col p-4 sm:p-6 gap-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <SelectField
                            disabled={!levelAdmin}
                            label={translateText(t, 'default.value', {
                                capitalize: true,
                                value: translateText(t, 'priority')
                            })}
                            value={settings?.defaultIssuePriority ?? 'medium'}
                            onChange={(v) => handleSettingChange({ defaultIssuePriority: v as 'medium' })}
                            options={Object.keys(ISSUE_MAPS.priority).map(
                                (value) => ({
                                    value,
                                    label: value.replace('_', ' ').replace(/^./, char => char.toUpperCase())
                                })
                            )}
                        />
                        <SelectField
                            disabled={!levelAdmin}
                            label={translateText(t, 'default.value', {
                                capitalize: true,
                                value: translateText(t, 'status')
                            })}
                            value={settings?.defaultIssueStatus ?? 'todo'}
                            options={Object.keys(ISSUE_MAPS.status).map(
                                (value) => ({
                                    value,
                                    label: value.replace('_', ' ').replace(/^./, char => char.toUpperCase())
                                })
                            )}
                            onChange={(v) => handleSettingChange({ defaultIssueStatus: v as 'todo' })}
                        />
                    </div>

                    <div className="space-y-4">
                        <SwitchField
                            className="text-sm"
                            disabled={!levelAdmin}
                            label={translateText(t, 'require.value', {
                                capitalize: true,
                                value: translateText(t, 'description')
                            })}
                            checked={settings?.requireDescription}
                            onChange={(requireDescription) => handleSettingChange({ requireDescription })}
                            description={translateText(t, 'description.mandatory')}
                        />
                        <SwitchField
                            className="text-sm"
                            disabled={!levelAdmin}
                            label={translateText(t, 'automatic.assignment')}
                            checked={settings?.autoAssignment}
                            onChange={(autoAssignment) => handleSettingChange({ autoAssignment })}
                            description={translateText(t, 'automatic.assignment.description')}
                        />
                        {settings?.autoAssignment && (
                            <SelectField
                                disabled={!levelAdmin}
                                label={translateText(t, 'assignment.method')}
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
                </div>

                <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <SwitchField
                            className="text-sm"
                            disabled={!levelAdmin}
                            label={translateText(t, 'enable.time.tracking')}
                            checked={settings?.enableTimeTracking}
                            onChange={(enableTimeTracking) => handleSettingChange({ enableTimeTracking })}
                        />
                        {settings?.enableTimeTracking && (
                            <SelectField
                                disabled={!levelAdmin}
                                label={translateText(t, 'time.units')}
                                value={settings.timeTrackingUnit ?? 'hours'}
                                onChange={(v) => handleSettingChange({ timeTrackingUnit: v as 'hours' })}
                                options={[
                                    { value: 'hours', label: translateText(t, 'hours', { capitalize: true }) },
                                    { value: 'days', label: translateText(t, 'days', { capitalize: true }) },
                                    { value: 'minutes', label: translateText(t, 'minutes', { capitalize: true }) }
                                ]}
                            />
                        )}
                    </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-5">
                    <h3 className="capitalize text-md font-semibold leading-none tracking-tight">
                        {translateText(t, 'workflow')}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                label={translateText(t, 'workflow.enable.approval')}
                                checked={settings?.enableApprovalWorkflow}
                                onChange={(enableApprovalWorkflow) => handleSettingChange({ enableApprovalWorkflow })}
                                description={translateText(t, 'workflow.approval.description')}
                            />
                        </div>

                        <div className="space-y-4">
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                label={translateText(t, 'allow.attachments')}
                                checked={settings?.allowAttachments}
                                onChange={(allowAttachments) => handleSettingChange({ allowAttachments })}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}