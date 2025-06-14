'use client'
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useProject } from "@/stores/project";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "../../components/use-setting";
import { Card, CardContent } from "@/components/ui/card";
import { SwitchField } from "@/components/switch-field";
import { useTranslation } from "react-i18next";
import { translateText } from "@/components/translate";

export function SettingsNotification({
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
                <div className="flex flex-col gap-5">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnAssignment}
                                label={translateText(t, 'assignment', { capitalize: true })}
                                description={translateText(t, 'assignment.notification.description')}
                                onChange={(notifyOnAssignment) => handleSettingChange({ notifyOnAssignment })}
                            />
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnStatusChange}
                                label={translateText(t, 'status.change')}
                                description={translateText(t, 'status.change.description')}
                                onChange={(notifyOnStatusChange) => handleSettingChange({ notifyOnStatusChange })}
                            />
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                checked={settings?.dailyDigest}
                                label={translateText(t, 'daily.summary')}
                                description={translateText(t, 'daily.summary.description')}
                                onChange={(dailyDigest) => handleSettingChange({ dailyDigest })}
                            />
                        </div>

                        <div className="space-y-4">
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnDueDate}
                                label={translateText(t, 'due.date', { capitalize: true })}
                                description={translateText(t, 'due.date.notification')}
                                onChange={(notifyOnDueDate) => handleSettingChange({ notifyOnDueDate })}
                            />
                            <SwitchField
                                className="text-sm"
                                disabled={!levelAdmin}
                                checked={settings?.notifyOnOverdue}
                                label={translateText(t, 'over.due', { capitalize: true })}
                                description={translateText(t, 'over.due.notification')}
                                onChange={(notifyOnOverdue) => handleSettingChange({ notifyOnOverdue })}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}