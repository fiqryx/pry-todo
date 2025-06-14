import { createMetadata } from "@/lib/metadata"

import { Zap } from "lucide-react";
import { Navbar } from "./components/home-navbar";
import { HomeHero } from "./components/home-hero";
import { Footer } from "./components/home-footer";
import { HomeCta } from "./components/home-cta";
import { HomeFeature } from "./components/home-feature";
import { HomeFeedback } from "./components/home-feedback";

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const metadata = createMetadata({})

export default function Page() {
    return (
        <div className="flex flex-col items-center">
            <Navbar className="top-0 lg:top-2" />
            <div
                className="absolute inset-x-0 top-[200px] h-[250px] max-md:hidden"
                style={{
                    background: [
                        "url('cosmic.svg') center/cover no-repeat",
                        'repeating-linear-gradient(to right, hsl(var(--primary)/.1),hsl(var(--primary)/.1) 1px,transparent 1px,transparent 50px)',
                        'repeating-linear-gradient(to bottom, hsl(var(--primary)/.1),hsl(var(--primary)/.1) 1px,transparent 1px,transparent 50px)'
                    ].join(','),
                }}
            />
            <main className="container relative max-w-[1100px] px-2 mt-16 lg:mt-24">
                <div
                    style={{
                        background:
                            'repeating-linear-gradient(to bottom, transparent, hsl(var(--secondary)/.2) 500px, transparent 1000px)',
                    }}
                >
                    <HomeHero className="relative" />
                    <div className="container flex flex-col items-center border-x border-y py-16 md:py-24">
                        <div
                            className="mb-2 p-2 rounded-md relative"
                            style={{
                                background: 'linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1), rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))',
                                animation: 'rainbow-glow 3s ease-in-out infinite',
                                border: '1px solid rgba(147, 51, 234, 0.3)',
                            }}
                        >
                            <Zap className="size-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
                            Everything You Need
                        </h2>
                        <p className="text-xl text-center max-w-2xl mx-auto text-muted-foreground">
                            Powerful features designed to streamline your workflow and boost team productivity
                        </p>
                    </div>
                    <HomeFeature className="border-r" />
                    <HomeFeedback />
                    <HomeCta className="border-y border-x" />
                </div>
            </main>
            <Footer className="w-full mt-2" />
        </div>
    )
}
