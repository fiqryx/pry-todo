import Link from "next/link"
import { createMetadata } from "@/lib/metadata"
import { SignInForm } from "./components/sign-in-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata = createMetadata({ title: 'Sign in' })

export default function Page() {
    return (
        <div className="flex items-center justify-center w-full h-screen bg-background px-4">
            <Card className="w-full mx-auto max-w-sm">
                <CardHeader className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Welcome</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials below to continue
                    </p>
                </CardHeader>
                <CardContent>
                    <SignInForm className="gap-4" />
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/sign-up" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
