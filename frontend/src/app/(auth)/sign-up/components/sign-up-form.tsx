"use client"

import { z } from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input, InputIcon } from "@/components/ui/input"
import { signInWithOAuth } from "../../actions"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"



const formSchema = z.object({
    firstName: z.string({ required_error: "first name is required" }).
        min(1, { message: "first name is required" }),
    lastName: z.string({ invalid_type_error: "invalid format" }).
        optional(),
    email: z.string({ required_error: "email is required" }).
        min(1, { message: "email is required" }).
        email({ message: 'invalid email address' }),
    password: z.string({ required_error: 'password is required' }).
        min(1, { message: "password is required" })
})

export function SingUpForm({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [showPassword, setshowPassword] = useState<boolean>(false)

    const { setError, ...form } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: ''
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);

            await new Promise((resolve) => setTimeout(resolve, 1000));
            logger.debug({ values });

            toast.error('Sign up failed', {
                description: 'Please try again with account provider.'
            });
        } catch ({ message = "Unknown error" }: any) {
            logger.debug({ error: message });
            toast.error('Sign up failed');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div {...props} className={cn("grid gap-6", className)}>
            <Form setError={setError} {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="firstName" className="required">
                                        First name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            id="firstName"
                                            autoComplete="off"
                                            disabled={isLoading}
                                            placeholder="Enter first name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel htmlFor="lastName">
                                        Last name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            id="lastName"
                                            autoComplete="off"
                                            disabled={isLoading}
                                            placeholder="Enter last name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="required">
                                    Email
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        autoComplete="off"
                                        disabled={isLoading}
                                        placeholder="Enter email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="required">
                                    Password
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="off"
                                        disabled={isLoading}
                                        placeholder="Enter password"
                                        {...field}
                                    >
                                        <InputIcon
                                            position="right"
                                            className="cursor-pointer"
                                            onClick={() => setshowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="size-4" />
                                            ) : (
                                                <EyeOffIcon className="size-4" />
                                            )}
                                        </InputIcon>
                                    </Input>
                                </FormControl>
                                <FormDescription>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create account
                    </Button>
                </form>
            </Form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">
                        or continue with
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => signInWithOAuth({ provider: 'discord' })}
                >
                    <Icons.discord />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => signInWithOAuth({ provider: 'github' })}
                >
                    <Icons.gitHub />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => signInWithOAuth({ provider: 'google' })}
                >
                    <Icons.google />
                </Button>
            </div>
        </div>
    )
}