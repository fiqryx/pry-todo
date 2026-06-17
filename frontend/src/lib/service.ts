import { createClient } from '@/lib/supabase/server';
import { BACKEND_URL } from '@/types/internal';

type Response<T = object> = {
    code: number;
    error?: string;
} & T;

export async function service<T = object>(
    endpoint: string,
    options?: RequestInit
): Promise<Response<T>> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (!data.session) {
        return { error: error?.message || 'Unauthorized', code: 401 } as Response<T>;
    }

    try {
        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            ...options,
            // cache: 'no-store',
            headers: {
                "Authorization": `Bearer ${data.session.access_token}`,
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            return {
                ...json,
                code: res.status,
                error: json.error || res.statusText || 'Request failed',
            };
        }

        return { ...json, code: res.status };
    } catch (err) {
        return {
            code: 500,
            error: err instanceof Error ? err.message : 'Unknown error occurred',
        } as Response<T>;
    }
}