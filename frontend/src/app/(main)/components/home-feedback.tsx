import { cn } from "@/lib/utils";

export function HomeFeedback({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            {...props}
            className={cn(
                'relative flex flex-col items-center overflow-hidden border-x border-t px-6 py-8 md:py-16',
                className
            )}
        >
            <div
                className="absolute inset-x-0 bottom-0 z-[-1] h-32 opacity-40"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent, white)',
                    background: 'linear-gradient(-45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)',
                    backgroundSize: '400% 400%',
                    animation: 'rainbow 4s ease infinite',
                }}
            />

            <div className="relative z-10 text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Transform Your Workflow
                </h2>
                <p className="text-lg font-medium text-muted-foreground max-w-2xl">
                    Experience the perfect balance of power and simplicity
                </p>
            </div>

            <div className="mt-8 rounded-2xl border bg-gradient-to-b from-background/80 to-secondary/20 backdrop-blur-sm p-6 shadow-xl max-w-2xl">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Built for Creators & Innovators</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Designed with intention, crafted with care. Our streamlined approach eliminates complexity while amplifying your creative potential. Focus on what matters most – let us handle the rest.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        ⚡ Lightning Fast
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        🎯 Purpose-Built
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        ✨ Beautifully Simple
                    </span>
                </div>
            </div>
        </div>
    );
}