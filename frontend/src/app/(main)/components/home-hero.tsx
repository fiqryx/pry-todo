import Link from "next/link";
import { cn } from "@/lib/utils";
import { MonitorPlay } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function HomeHero({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                'container relative z-2 flex flex-col overflow-hidden border-x border-t bg-background px-6 py-12 max-md:text-center md:px-12',
                className
            )}
        >
            <h1 className="mb-6 max-w-[400px] text-4xl font-bold">
                Manage Projects
                <span className="block bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                    Like Never Before
                </span>
            </h1>
            <p className="mb-8 text-muted-foreground md:max-w-[80%] md:text-xl">
                <span className="text-foreground">A powerful, intuitive</span>{' '}
                project management platform that combines the best of{' '}
                <span className="text-foreground">Kanban boards</span>,{' '}
                <span className="text-foreground">Analytics</span> and{' '}
                <span className="text-foreground">Team collaboration</span> in one beautiful interface.
            </p>
            <div className="inline-flex items-center gap-3 max-md:mx-auto">
                <Link
                    href="/home"
                    className={cn(
                        buttonVariants({
                            size: 'lg',
                            className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full'
                        }),
                    )}
                >
                    Get Started
                </Link>
                <Link
                    href={process.env.NEXT_PUBLIC_APP_URL ?? '#'}
                    className={cn(
                        buttonVariants({
                            size: 'lg',
                            variant: 'outline',
                            className: 'rounded-full bg-background [&_svg]:size-5',
                        }),
                    )}
                >
                    <MonitorPlay />
                    Live Demo
                </Link>
            </div>
            <div
                className="absolute inset-0 z-[-1] opacity-80"
                style={{ background: "url('cosmic.svg') center/cover no-repeat" }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        animation: 'rainbow-glow 5s ease-in-out infinite',
                    }}
                />

                <div
                    className="absolute inset-0"
                    style={{
                        animation: 'rainbow-lines 4s ease-in-out infinite',
                    }}
                />

                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 30%, rgba(147, 51, 234, 0.1))',
                        animation: 'rainbow-shimmer 6s ease-in-out infinite',
                    }}
                />

                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, hsl(var(--background)) 40%, transparent)',
                    }}
                />
            </div>
        </div>
    );
}