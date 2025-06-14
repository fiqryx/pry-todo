import { Suspense } from "react";
import { getUser } from "@/lib/services/user";
import { getProjects } from "@/lib/services/project";

import { Loading } from "@/components/ui/loading";
import { UserCreateForm } from "@/components/user-form";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SocketProvider } from "@/components/providers/socket-provider";

export const dynamic = 'force-dynamic'

export default function AuthLayout({
    children
}: React.PropsWithChildren) {
    return (
        <Suspense fallback={<Loading variant="spinner" />}>
            <AuthLoader>{children}</AuthLoader>
        </Suspense>
    )
}

async function AuthLoader({
    children
}: React.PropsWithChildren) {
    const { user, data: session, code } = await getUser();

    if (session && code === 403) {
        return <UserCreateForm data={session} />
    }

    const { data = [] } = await getProjects({
        status: 'active',
        sort: 'createdAt'
    });

    if (!user) {
        return <Loading variant="spinner" />
    }

    return (
        <AuthProvider user={user} projects={data}>
            <SocketProvider>
                {children}
            </SocketProvider>
        </AuthProvider>
    )
}