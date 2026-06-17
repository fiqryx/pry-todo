// file: components/SupabaseProvider.tsx
"use client"
import { createContext, useContext, useMemo } from 'react'
import { useSupabaseClient } from '@/lib/supabase/client'

const SupabaseContext = createContext<any>(null)

export function SupabaseProvider({
    url,
    anonKey,
    children
}: {
    url: string,
    anonKey: string,
    children: React.ReactNode
}) {
    const supabase = useMemo(() => useSupabaseClient(url, anonKey), [url, anonKey])

    return (
        <SupabaseContext.Provider value={supabase}>
            {children}
        </SupabaseContext.Provider>
    )
}

export const useSupabase = () => useContext(SupabaseContext)