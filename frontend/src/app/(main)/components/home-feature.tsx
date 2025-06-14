import { cn } from "@/lib/utils";
import { LucideIcon, BarChart3, Calendar, Kanban, Users } from 'lucide-react';

const features = [
    {
        icon: Kanban,
        title: "Kanban Board",
        desc: "Visual task management with seamless drag & drop"
    },
    {
        icon: BarChart3,
        title: "Analytics",
        desc: "Comprehensive insights and progress tracking"
    },
    {
        icon: Calendar,
        title: "Timeline View",
        desc: "Track deadlines and project milestones"
    },
    {
        icon: Users,
        title: "Team Collaboration",
        desc: "Multi-user support with role-based permissions"
    }
];


export function HomeFeature({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div {...props} className={cn('grid grid-cols-1 md:grid-cols-2', className)}>
            {features.map((item, idx) => (
                <Feature
                    key={idx}
                    icon={item.icon}
                    heading={item.title}
                    description={item.desc}
                />
            ))}
        </div>
    );
}


function Feature({
    className,
    icon: Icon,
    heading,
    description,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    icon: LucideIcon;
    heading: React.ReactNode;
    description: React.ReactNode;
}): React.ReactElement {
    return (
        <div
            {...props}
            className={cn(
                'border-l border-t *:px-6 py-12',
                'group relative overflow-hidden p-8 transition-all duration-500 hover-rainbow cursor-pointer hover:border-transparent',
                className
            )}
        >
            <div className="absolute inset-0 rainbow-border rounded-2xl pointer-events-none opacity-0 hover:opacity-100" />

            {/* Content */}
            <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-4">
                    <div className="p-2 rounded-lg rainbow-bg bg-gradient-to-r from-blue-500 to-purple-600 icon-glow transition-all duration-300">
                        <Icon className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold xrainbow-text-gradient transition-all duration-300">
                    {heading}
                </h2>

                <p className="text-muted-foreground leading-relaxed font-medium">
                    {description}
                </p>
            </div>
        </div>
    );
}