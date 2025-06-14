"use client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ScrollArea } from "./ui/scroll-area"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Skeleton } from '@/components/ui/skeleton';
import { RealTimeAgo } from "@/components/time-ago"
import { translateText } from "@/components/translate"
import { BellIcon, ArrowRight } from "lucide-react"
import { useSocket } from "./providers/socket-provider"
import { useState, useEffect, useCallback } from "react"
import { Notification } from "@/types/schemas/notification"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ToggleNotification({ className, ...props }: React.ComponentProps<typeof Button>) {
    const socket = useSocket();
    const router = useRouter();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const getNotif = useCallback((items: Notification[]) => {
        setNotifications(items);
        setUnreadCount(items.filter(v => !v.isRead).length);
        setIsLoading(false);
    }, []);

    const pushNotif = useCallback((item: Notification) => {
        toast.message(item.title, { description: item.message });
        setNotifications(prev => [item, ...prev]);
        setUnreadCount(prev => prev + 1);
    }, []);

    const errorNotif = useCallback((message: string) => {
        toast.error(message)
    }, []);

    const markAsRead = useCallback((id: string) => {
        socket.emit("notification:read", id)
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        socket.emit("notification:read")
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        socket.emit("notification:get");
    }, []);

    useEffect(() => {
        socket.on('notification:get', getNotif);
        socket.on('notification:push', pushNotif);
        socket.on('notification:error', errorNotif);

        return () => {
            socket.off('notification:get', getNotif);
            socket.off('notification:push', pushNotif);
            socket.off('notification:error', errorNotif);
        };
    }, []);

    return (
        <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <div className="relative">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("h-9 w-9 p-2 focus:ring-0", className)}
                                    {...props}
                                >
                                    <BellIcon className="h-4 w-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="capitalize bg-accent text-accent-foreground">
                        {translateText(t, 'notifications')}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="w-72 sm:w-96 rounded-lg p-0"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="capitalize font-semibold">
                        {translateText(t, 'notifications')}
                    </h3>
                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:underline"
                        >
                            {translateText(t, 'mark.all.read')}
                        </button>
                    )}
                </div>

                <ScrollArea className="h-96">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start space-x-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-3 w-[160px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex h-96 justify-center items-center">
                            <span className="max-w-52 text-center text-xs text-muted-foreground p-2">
                                {translateText(t, 'empty.notifications')}
                            </span>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((item, idx) => (
                                <DropdownMenuItem
                                    key={idx}
                                    className={cn(
                                        "py-3 px-4 flex items-start gap-3 cursor-pointer rounded-none",
                                        !item.isRead && "bg-accent"
                                    )}
                                    onClick={() => {
                                        markAsRead(item.id)
                                        if (item.metadata?.link)
                                            router.push(item.metadata.link)
                                    }}
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-col gap-0.5">
                                            <h4 className="text-sm font-medium">
                                                {item.title}
                                            </h4>
                                            <time
                                                className="text-xs text-muted-foreground whitespace-nowrap"
                                                dateTime={new Date(item.createdAt).toISOString()}
                                            >
                                                <RealTimeAgo date={item.createdAt} />
                                            </time>
                                        </div>
                                        <p
                                            title={item.message}
                                            className="text-xs text-muted-foreground truncate max-w-xs mt-1"
                                        >
                                            {item.message}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 10 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-xs text-primary">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            {translateText(t, 'see.all.notifications')}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
