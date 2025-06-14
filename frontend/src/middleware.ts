import { site } from '@/config/site'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'


// applies this middleware only to files in the app directory
export const config = {
    matcher: '/((?!api|static|.*\\..*|_next).*)'
}

const ignore = [
    '/api/auth',
    '/auth/callback',
    '/auth/confirm',
]

const publics = [
    '/',
    '/sign-in',
    '/sign-up',
    '/verify/*',
]

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecret = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseKey && supabaseSecret) {
        let supabaseResponse = NextResponse.next({ request });

        const supabase = createServerClient(supabaseKey, supabaseSecret, {
            cookieOptions: {
                name: site.auth.key,
                maxAge: 7 * 3600,
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        });

        const { data: { user } } = await supabase.auth.getUser()
        const isAuthRoute = ignore.some((v) => new RegExp('^' + v.replace(/\*/g, '.*') + '$').test(pathname));

        // redirect to /sign-n if not authenticated
        if (!isAuthRoute && !publics.includes(pathname) && !user) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        // redirect if authenticated on public route
        if ((isAuthRoute || publics.includes(pathname)) && user) {
            return NextResponse.redirect(new URL('/home', request.url))
        }

        if (pathname === "/settings") {
            return NextResponse.redirect(new URL('/settings/general', request.url))
        }

        return supabaseResponse
    }

}