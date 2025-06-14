'use client'
import languages from '@/../locales/languages.json'

import { cn } from '@/lib/utils'
import { Globe } from "lucide-react"
import { useAppStore } from "@/stores/app"
import { setCookie } from 'cookies-next/client'
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "react-i18next"
import { translateText } from "@/components/translate"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ToogleLocale({
    locale,
    className,
    ...props
}: React.ComponentProps<typeof Select> & {
    locale?: string
    className?: string
}) {
    const appStore = useAppStore();
    const { toast } = useToast()
    const { t, i18n } = useTranslation();

    const onChange = (value: string) => {
        if (value !== locale) {
            appStore.set({ locale: value })
            i18n.changeLanguage(value)
            setCookie('LOCALE', value, { path: '/' })

            toast({
                description: translateText(t, 'changed.language', {
                    capitalize: true
                })
            })
        }
    }

    return (
        <Select
            {...props}
            onValueChange={onChange}
            defaultValue={locale ?? appStore.locale}
        >
            <SelectTrigger className={cn('hidden xsm:flex items-center justify-between h-8', className)}>
                <Globe className='w-4 h-4 mr-2 text-muted-foreground' />
                <SelectValue placeholder={t('Language')} />
            </SelectTrigger>
            <SelectContent>
                {languages.map((item, idx) => (
                    <SelectItem key={idx} value={item.code}>
                        {item.code.toUpperCase()}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}