'use client'
import languages from '@/../locales/languages.json'

import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useAppStore } from '@/stores/app'
import { Label } from "@/components/ui/label"
import { useTranslation } from 'react-i18next'
import { setCookie } from 'cookies-next/client'

import { Switch } from "@/components/ui/switch"
import { Button } from '@/components/ui/button'
import { Translate, translateText } from '@/components/translate'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from "@/components/ui/card"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SettingsSystem({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const { locale, set: setApp } = useAppStore();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

    const onResetSetting = () => {
        setTheme('system');
        onLanguageChange('en', false);
        setNotificationsEnabled(true);
        setAnalyticsEnabled(true);
        setApp({ color: { primary: 'blue', sidebar: 'default' } });
    }

    const onLanguageChange = (value: string, notify: boolean = true) => {
        if (value !== locale) {
            setApp({ locale: value })
            i18n.changeLanguage(value)
            setCookie('LOCALE', value, { path: '/' })

            if (notify) {
                const id = 'changed.language';
                toast.success(translateText(t, id, { capitalize: true }), { id })
            }
        }
    }

    return (
        <Card {...props} className={cn('rounded-md', className)}>
            <CardContent className="p-6 space-y-8">
                <div className="space-y-3">
                    <Translate t={t} as="h3" value="theme" className='text-md font-medium' />
                    <RadioGroup
                        value={theme}
                        className="flex gap-5"
                        onValueChange={(value) => setTheme(value)}
                    >
                        <div className="flex items-center gap-2.5">
                            <RadioGroupItem value="light" id="light" />
                            <Label htmlFor="light" className="flex items-center gap-1 text-sm">
                                <SunIcon className="h-4 w-4" />
                                <Translate t={t} capitalize value="light" />
                            </Label>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <RadioGroupItem value="dark" id="dark" />
                            <Label htmlFor="dark" className="flex items-center gap-1 text-sm">
                                <MoonIcon className="h-4 w-4" />
                                <Translate t={t} capitalize value="dark" />
                            </Label>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <RadioGroupItem value="system" id="system" />
                            <Label htmlFor="system" className="flex items-center gap-1 text-sm">
                                <MonitorIcon className="h-4 w-4" />
                                <Translate t={t} capitalize value="system" />
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    <Translate t={t} as="h3" value="language" className='capitalize text-md font-medium' />
                    <div className="space-y-2">
                        <Translate t={t} as={Label} capitalize htmlFor="language" value="interface.language" />
                        <Select value={locale ?? 'en'} onValueChange={onLanguageChange}>
                            <SelectTrigger className="w-[240px]">
                                <SelectValue placeholder={translateText(t, 'select.language')} />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Translate t={t} as="p" value="interface.language.description" className="text-sm text-muted-foreground" />
                    </div>
                </div>

                <div className="space-y-4">
                    <Translate t={t} as="h3" capitalize value="notifications" className="text-md font-medium" />
                    <div className="flex items-center justify-between space-x-4">
                        <div className="space-y-1">
                            <Translate t={t} as={Label} capitalize htmlFor="notifications" value="enable.notification" />
                            <Translate t={t} as="p" capitalize value="receive.update.notification" className="text-sm text-muted-foreground" />
                        </div>
                        <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                    </div>
                </div>

                <div className="space-y-4">
                    <Translate t={t} as="h3" capitalize value="privacy" className="text-md font-medium" />
                    <div className="flex items-center justify-between space-x-4">
                        <div className="space-y-1">
                            <Translate t={t} as={Label} capitalize htmlFor="analytics" value="share.usage.analytics" />
                            <Translate t={t} as="p" capitalize value="help.us.improve.sharing.data" className="text-sm text-muted-foreground" />
                        </div>
                        <Switch id="analytics" checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
                    </div>
                </div>

                <Separator className='mb-4' />

                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Translate t={t} as="h3" capitalize value="reset.settings" />
                        <Translate t={t} capitalize value="reset.settings.description" className="text-sm text-muted-foreground" />
                    </div>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onResetSetting}
                        className='h-8 rounded-sm px-4'
                    >
                        {translateText(t, 'reset', { capitalize: true })}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}