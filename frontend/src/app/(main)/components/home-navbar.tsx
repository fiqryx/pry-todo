"use client";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";

import { Icons } from "@/components/icons";
import { ThemeToggle } from "./home-toogle-theme";
import { buttonVariants } from "@/components/ui/button";
import { LucideIcon, CheckCircle } from "lucide-react";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export function Navbar({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                "fixed left-1/2 inset-x-0 max-w-7xl mx-auto z-40",
                className
            )}
        >
            <NavigationMenu className="flex lg:rounded-2xl border border-input bg-background shadow-sm gap-6 px-2 h-14 lg:h-12 max-w-full">
                <Link href={"/"} className="inline-flex items-center gap-1.5 font-semibold ml-2 lg:ml-3.5">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-[15px]">{site.name}</span>
                </Link>
                <div className="flex flex-1 justify-end items-center gap-1.5">
                    <ThemeToggle className="hidden sm:flex" />
                    <Link
                        target="_blank"
                        href={process.env.NEXT_PUBLIC_REPO_URL ?? "#"}
                        className="hidden xsm:flex size-8 hover:bg-accent hover:text-accent-foreground p-1.5 rounded-lg"
                    >
                        <Icons.gitHub />
                    </Link>
                    <Link
                        href="/sign-in"
                        className={cn(buttonVariants(), 'hidden sm:flex rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0')}
                    >
                        Sign In
                    </Link>
                    <NavigationMenuItem className="list-none sm:hidden">
                        <NavigationMenuTrigger className="px-3.5" />
                        <NavigationMenuContent className="flex flex-col gap-3 p-4">
                            <div className="flex flex-row items-center gap-1.5">
                                <Link
                                    target="_blank"
                                    href={process.env.NEXT_PUBLIC_REPO_URL ?? "#"}
                                    className="flex lg:hidden size-8 hover:bg-accent hover:text-accent-foreground p-1.5 rounded-lg"
                                >
                                    <Icons.gitHub />
                                </Link>
                                <ThemeToggle className="flex lg:hidden" />
                                <Link
                                    href="/sign-in"
                                    className={cn(buttonVariants(), 'ml-auto flex lg:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0')}
                                >
                                    Sign In
                                </Link>
                            </div>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </div>
            </NavigationMenu>
        </div>
    );
}

interface ListItemProps extends
    Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> {
    href?: string
    icon?: LucideIcon
}

const ListItem = React.forwardRef<
    HTMLAnchorElement,
    ListItemProps
>(({ className, icon, href, title, children, ...props }, ref) => {
    const Comp = icon;

    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    ref={ref}
                    href={href ?? '#'}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-1 sm:p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="inline-flex items-center text-sm font-medium leading-none gap-2">
                        {Comp && <Comp className="size-5" />}
                        {title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
