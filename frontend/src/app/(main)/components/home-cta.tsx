import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/config/site";
import { ArrowRight } from "lucide-react";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";

export function HomeCta({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                'grid grid-cols-1 items-center xmd:grid-cols-2 xlg:grid-cols-3',
                className
            )}
            style={{
                background: [
                    "url('cosmic.svg') center/cover no-repeat",
                    'linear-gradient(to bottom, hsl(var(--background)) 40%, transparent)',
                    'repeating-linear-gradient(to right, hsl(var(--primary)/.1),hsl(var(--primary)/.1) 1px,transparent 1px,transparent 50px)',
                    'repeating-linear-gradient(to bottom, hsl(var(--primary)/.1),hsl(var(--primary)/.1) 1px,transparent 1px,transparent 50px)'
                ].join(',')
            }}
        >
            <div className="flex flex-col gap-4 overflow-hidden px-8 py-14">
                <h2 className="text-4xl font-semibold">Ready to Transform Your Workflow?</h2>
                <span className="text-xl text-muted-foreground mb-8">
                    Join thousands of teams already using {site.name} to manage their projects more efficiently
                </span>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/home"
                        className={cn(
                            buttonVariants({ size: 'lg' }),
                            'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        )}
                    >
                        Get Started Now
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        target="_blank"
                        href={process.env.NEXT_PUBLIC_REPO_URL ?? "#"}
                        className={buttonVariants({ size: 'lg', variant: 'outline' })}
                    >
                        <Icons.gitHub className="size-5" />
                        View on GitHub
                    </Link>
                </div>
            </div>
        </div>
    )
}