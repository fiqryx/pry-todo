import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Loading } from "@/components/ui/loading";
import { getProject } from "@/lib/services/project";

export const dynamic = 'force-dynamic'

export default function Layout({
    children
}: React.PropsWithChildren) {
    return (
        <Suspense fallback={<Loading variant="spinner" />}>
            <Comp>{children}</Comp>
        </Suspense>
    )
}

async function Comp({
    children
}: React.PropsWithChildren) {
    const { data } = await getProject()

    if (!data) {
        redirect('/home');
    }

    return children
}