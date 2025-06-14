'use client'
import { timeAgo } from '@/lib/utils';
import { useAppStore } from '@/stores/app';
import { TimeAgoOptions } from '@/types/misc';
import { useState, useEffect } from 'react';

interface Props {
    date?: string | Date;
    options?: TimeAgoOptions
}

export function RealTimeAgo({
    date,
    options
}: Props) {
    const { locale } = useAppStore();
    const setCurrentTime = useState(Date.now())[1];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, [date]);

    return <>{timeAgo(date ?? new Date(), { showTime: true, locale, numeric: 'always', ...options })}</>;
}