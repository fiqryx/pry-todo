import Link from "next/link"
import { createMetadata } from "@/lib/metadata"
import { SingUpForm } from "./components/sign-up-form"

import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"

export const metadata = createMetadata({ title: 'Sign up' })

export default function Page() {
    return (
        <div className="flex items-center justify-center w-full h-screen bg-background px-4">
            <Card className="w-full mx-auto max-w-md">
                <CardHeader className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Sign up</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your email below to create your account
                    </p>
                </CardHeader>
                <CardContent>
                    <SingUpForm />
                    <div className="mt-4 text-center text-sm">
                        Already have account?{" "}
                        <Link href="/sign-in" className="underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
