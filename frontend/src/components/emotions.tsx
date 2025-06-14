'use client'
import * as React from "react"
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { emotions } from "@/lib/emotions"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"

interface EmotionsProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
    value?: string
    onClick?: (emoji: string) => void
}

export function Emotions({
    className,
    onClick,
    value,
    ...props
}: EmotionsProps) {
    return (
        <Tabs defaultValue="smileys">
            <TabsList className='w-full rounded-sm'>
                {Object.values(emotions).map(({ key, icon: Comp }, idx) => (
                    <TabsTrigger key={idx} value={key} className='p-2'>
                        <Comp className='size-4' />
                    </TabsTrigger>
                ))}
            </TabsList>
            {Object.values(emotions).map(({ key, title, values }, idx) => (
                <TabsContent key={idx} value={key} className='mt-1'>
                    <span className='text-xs text-muted-foreground p-1'>{title}</span>
                    <ScrollArea className='h-48'>
                        {values.map((emoji, idx) => (
                            <Button
                                key={idx}
                                size="icon"
                                variant="ghost"
                                className={cn('text-lg size-8 data-[active=true]:bg-accent', className)}
                                data-active={value === emoji}
                                onClick={() => onClick && onClick(emoji)}
                                {...props}
                            >
                                {emoji}
                            </Button>
                        ))}
                    </ScrollArea>
                </TabsContent>
            ))}
        </Tabs>
    )
}