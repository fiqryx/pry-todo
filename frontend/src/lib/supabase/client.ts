import { site } from '@/config/site'
import { createBrowserClient } from '@supabase/ssr'

export function useSupabaseClient(url: string, key: string, schema?: string) {
    // Create a supabase client on the browser with project's credentials
    return createBrowserClient(url, key, {
            db: { schema },
            cookieOptions: {
                name: site.auth.key,
                maxAge: 7 * 3600,
            },
        }
    )
}