import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loading } from "@/components/ui/loading";

import { createMetadata } from "@/lib/metadata"
import { verifyInvitation } from "@/lib/services/notification";
import { Button, buttonVariants } from "@/components/ui/button";

import {
    EyeIcon,
    XCircle,
    EditIcon,
    CrownIcon,
    CheckCircle2,
    ArrowLeftIcon,
    ArrowRightCircle,
} from "lucide-react";

type Params = Promise<{
    [key: string]: string | string[] | undefined;
}>

interface PageProps {
    searchParams: Params
}

export const revalidate = 0;
export const dynamic = 'force-dynamic'
export const metadata = createMetadata({ title: '' });

export default function Page({ searchParams }: PageProps) {
    return (
        <Suspense fallback={<Loading variant="spinner" />}>
            <VerifyLoader searchParams={searchParams} />
        </Suspense>
    )
}

async function VerifyLoader({ searchParams }: PageProps) {
    const { token } = await searchParams;

    if (!token) {
        notFound()
    }

    const { data } = await verifyInvitation(token.toString());

    if (!data) {
        return <Error />
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-background justify-center items-center gap-10 p-4">
            <div className="grid text-center justify-center items-center gap-10">
                <div className="flex flex-col gap-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold">Invitation Accepted</h1>
                    <p className="text-muted-foreground">
                        You're now a member of{' '}
                        <span className="font-medium text-foreground">{data.name}</span>
                    </p>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="grid gap-2 rounded-lg bg-muted/50 p-4 text-left">
                        <p className="text-sm font-medium">Your Access Level</p>
                        <p className="text-sm text-muted-foreground">
                            {data.role === 'admin' && (
                                <span className="inline-flex items-center gap-1">
                                    <CrownIcon className="h-3.5 w-3.5 text-yellow-500" />
                                    Admin (Full permissions)
                                </span>
                            )}
                            {data.role === 'editor' && (
                                <span className="inline-flex items-center gap-1">
                                    <EditIcon className="h-3.5 w-3.5 text-blue-500" />
                                    Editor (Can edit content)
                                </span>
                            )}
                            {data.role === 'viewer' && (
                                <span className="inline-flex items-center gap-1">
                                    <EyeIcon className="h-3.5 w-3.5 text-purple-500" />
                                    Viewer (Read-only access)
                                </span>
                            )}
                        </p>
                    </div>

                    <Button asChild className="w-full gap-2 mt-4">
                        <a href="/">
                            <ArrowRightCircle className="h-4 w-4" />
                            Go to Project
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Error() {
    return (
        <div className="flex flex-col h-full min-h-screen bg-background justify-center items-center gap-10 p-4">
            <div className="grid justify-center items-center gap-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-center">
                    Invitation Error
                </h1>
                <p className="text-center text-muted-foreground">
                    This invitation link is no longer valid
                </p>
            </div>
            <Link href='/' className={buttonVariants({ variant: "outline", className: 'w-fit' })}>
                <ArrowLeftIcon />
                Go back to home
            </Link>
        </div>
    );
}