"use client"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input, InputIcon } from "@/components/ui/input"
import { useState, ComponentProps, useCallback } from "react"
import { signInWithOAuth, signInWithPassword } from "../../actions"

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
  email: z.string({ required_error: "email is required" }).
    min(1, { message: "email is required" }).
    email({ message: 'invalid email address' }),
  password: z.string({ required_error: 'password is required' }).
    min(1, { message: "password is required" })
})

export function SignInForm({
  className,
  ...props
}: ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setshowPassword] = useState(false);

  const { setError, ...form } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      try {
        setIsLoading(true);
        const { data, error } = await signInWithPassword(values);

        if (!data?.user) {
          toast.error(error || 'Authentication failed')
          return
        }

        window.location.reload();
      } catch (e: any) {
        toast.error(e?.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div {...props} className={cn("grid gap-4", className)}>
      <Form setError={setError} {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2">
          <div className="grid gap-1">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
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
                  <FormLabel htmlFor="password">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
          </div>
          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid xgrid-cols-3 gap-2">
        <Button
          disabled={isLoading}
          type="button"
          variant="outline"
          onClick={() => signInWithOAuth({ provider: 'discord' })}
        >
          <Icons.discord /> Discord
        </Button>
        <Button
          disabled={isLoading}
          type="button"
          variant="outline"
          onClick={() => signInWithOAuth({ provider: 'github' })}
        >
          <Icons.gitHub /> Github
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => signInWithOAuth({ provider: 'google' })}
        >
          <Icons.google /> Google
        </Button>
      </div>
    </div>
  )
}
