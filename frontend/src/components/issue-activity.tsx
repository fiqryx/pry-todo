'use client'
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/auth';
import { Issue } from '@/types/schemas/issue';
import { useProject } from '@/stores/project';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Comment } from '@/types/schemas/comment';
import { getIssueActivities } from '@/lib/services/issue-item';

import { RealTimeAgo } from '@/components/time-ago';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Emotions } from '@/components/emotions';
import { Skeleton } from '@/components/ui/skeleton';
import { ISSUE_TYPE_MAP } from '@/types/misc';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Translate, translateText } from '@/components/translate';

import { SendIcon, SmileIcon } from 'lucide-react';
import { Activity } from '@/types/schemas/activity';
import { getActivityMessage, getIssueColorClass } from '@/lib/internal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createComment, deleteComment, getComments } from '@/lib/services/comment';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const IssueContext = createContext<Issue | null>(null);

const useIssueContext = () => {
    const context = useContext(IssueContext);
    if (!context) {
        throw new Error("Components must be used within a issue provider.")
    }
    return context
}

interface IssueActivityProps extends
    React.ComponentProps<typeof Tabs> {
    issue: Issue
    disabled?: boolean
}

export function IssueActivity({
    issue,
    disabled,
    className,
    ...props
}: IssueActivityProps) {
    return (
        <IssueContext.Provider value={issue}>
            <div
                {...props}
                className={cn('flex flex-col gap-2', className)}
            >
                <Translate as="h3" value="activity" className="capitalize text-xs font-semibold" />
                <Tabs defaultValue="comments">
                    <TabsList>
                        <TabsTrigger disabled={disabled} value="all">
                            <Translate value="all" className='capitalize' />
                        </TabsTrigger>
                        <TabsTrigger disabled={disabled} value="comments">
                            <Translate value="comments" className='capitalize' />
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className='mb-6'>
                        <ActivityContent />
                    </TabsContent>
                    <TabsContent value="comments" className='mb-6'>
                        <CommentContent />
                    </TabsContent>
                </Tabs>
            </div>
        </IssueContext.Provider>
    )
}

function ActivityContent() {
    const issue = useIssueContext();
    const { active, getTeams } = useProject();

    const teams = useMemo(getTeams, [active]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const Comp = useMemo(() => ISSUE_TYPE_MAP[issue?.type ?? 'task'], [issue.type]);

    const { data, isLoading, error, isFetching } = useQuery({
        staleTime: 0,
        queryKey: ['issue-activities'],
        queryFn: async () => {
            const { data, error } = await getIssueActivities(issue.id);
            if (error) throw new Error(error)
            return data || []
        },
    });

    useEffect(() => {
        setActivities(Array.isArray(data) ? data : []);
    }, [data]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    if (isLoading || isFetching) {
        return (
            <div className="flex flex-col gap-2 p-2">
                {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="flex gap-2">
                        <Skeleton className="size-10 rounded-full" />
                        <Skeleton className="h-12 w-full rounded-sm" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <ScrollArea className='border rounded-md'>
            <div className="flex flex-col h-full max-h-[30rem] gap-2">
                {activities.map((item) => {
                    const message = getActivityMessage(item, teams);
                    const status: string = item.new?.status ||
                        item.old?.status ||
                        issue?.status;

                    return (
                        <div key={item.id} className="p-2">
                            <div className="flex items-start gap-2">
                                <Avatar title={item.user?.name} className="size-10">
                                    <AvatarImage src={item.user?.image} alt="image" />
                                    <AvatarFallback className='capitalize'>
                                        {item.user?.name.slice(0, 2) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <div className="flex flex-col lg:flex-row lg:items-center text-xs gap-1">
                                        <span className="text-sm font-semibold">{item.user?.name}</span>
                                        <span title={message} className="max-w-52 sm:max-w-72 truncate">
                                            {message}
                                        </span>

                                        <div className="inline-flex items-center border rounded-sm text-primary p-1 gap-1">
                                            <Comp className={cn('size-4', getIssueColorClass(issue?.type))} />

                                            <span className="max-w-32 sm:max-w-52 truncate">
                                                {issue?.title || `#${item.issueId}`}
                                            </span>
                                            <div
                                                className={cn(
                                                    'ml-1 rounded-sm capitalize text-xs py-0.5 px-1',
                                                    status === 'todo' && 'bg-secondary text-secondary-foreground',
                                                    status === 'on_progress' && 'bg-primary/20 text-primary',
                                                    status === 'done' && 'bg-success/20 text-success',
                                                )}
                                            >
                                                {status?.replace('_', ' ')?.replace(/^./, char => char.toUpperCase())}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <RealTimeAgo
                                            date={item.createdAt}
                                            options={{ showTime: true, locale: 'en-US' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}

function CommentContent() {
    const issue = useIssueContext();
    const { t } = useTranslation();

    const [value, setValue] = useState('');
    const [isSubmitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [visibleComments, setVisibleComments] = useState(3);

    const { data, isLoading, error, isFetching } = useQuery({
        staleTime: 0,
        queryKey: ['issue-comments'],
        queryFn: async () => {
            const { data, error } = await getComments(issue.id);
            if (error) throw new Error(error)
            return data || []
        },
    });

    const [hasMore, commentsToShow] = useMemo(
        () => [
            comments.length > visibleComments,
            comments.slice(0, visibleComments),
        ] as const,
        [comments, visibleComments]
    );

    const onSubmit = useCallback(async () => {
        const trim = value.trim();
        if (!trim || !issue) return
        setSubmitting(true);
        try {
            const { data, error } = await createComment(issue.id, trim);
            if (!data) throw error
            setValue('');
            setComments(prev => [data, ...prev]);
        } catch (error) {
            logger.debug(error);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    }, [issue, value]);

    const onDeleteComment = useCallback(async (comment: Comment) => {
        try {
            const { data, error } = await deleteComment(comment.id, comment.issueId);
            if (!data) throw error;
            setComments(prev => prev.filter(v => v.id !== data.id));
        } catch (error) {
            logger.error(error);
            toast.error('Failed to delete comment');
        }
    }, [issue]);

    useEffect(() => {
        setComments(Array.isArray(data) ? data : []);
    }, [data]);

    useEffect(() => {
        if (error) toast.error(error.message);
    }, [error]);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-2">
                <Textarea
                    value={value}
                    disabled={isSubmitting}
                    className="resize-none ml-0.5"
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`${translateText(t, 'add.comment', { capitalize: true })}...`}
                />
                <div className="flex flex-col gap-1">
                    <Button
                        size="icon"
                        className="size-8"
                        onClick={onSubmit}
                        disabled={isLoading || !value.trim() || isSubmitting}
                    >
                        {isSubmitting ? <Icons.spinner className="animate-spin" /> : <SendIcon className="size-4" />}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                disabled={isLoading}
                                className="size-8"
                            >
                                <SmileIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="ml-1 w-64 p-1">
                            <Emotions onClick={(v) => setValue(prev => prev + v)} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea>
                <div className="flex flex-col text-xs h-full max-h-[30rem] mt-4 gap-3">
                    {(isLoading || isFetching) && (
                        [...Array(3)].map((_, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Skeleton className="size-10 rounded-full" />
                                <Skeleton className="h-12 w-full rounded-sm" />
                            </div>
                        ))
                    )}

                    {comments.length === 0 && !isLoading && !isFetching && (
                        <Translate t={t} value="empty.comment" className="text-muted-foreground text-center py-4" />
                    )}

                    {comments.length > 0 && (<>
                        {commentsToShow.map((comment, idx) => (
                            <CommentBlock key={idx} comment={comment} onDelete={onDeleteComment} />
                        ))}

                        {hasMore && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground w-full"
                                onClick={() => setVisibleComments(prev => prev + 5)}
                            >
                                <Translate t={t} value="show.more.comment" className="text-muted-foreground text-center py-4" />
                            </Button>
                        )}
                    </>)}
                </div>
            </ScrollArea>
        </div>
    );
}


export interface CommentBlockProps extends
    React.ComponentProps<'div'> {
    comment: Comment
    onDelete?: (comment: Comment) => Promise<void>
}

export function CommentBlock({
    comment,
    className,
    onDelete,
    ...props
}: CommentBlockProps) {
    const { user } = useAuthStore();
    const [isLoading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const needsTruncation = useMemo(() => comment.message.length > 150, [comment]);
    const displayedMessage = useMemo(() => {
        return isExpanded ? comment.message
            : needsTruncation
                ? `${comment.message.substring(0, 150)}...`
                : comment.message;
    }, [comment, isExpanded]);

    return (
        <div {...props} className={cn('flex gap-2', className)}>
            <Avatar className="border size-10">
                <AvatarImage src={comment.user?.image || undefined} />
                <AvatarFallback>
                    {comment.user?.name.slice(0, 1) || 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="w-full flex flex-col gap-1">
                <div className="flex flex-col border rounded-sm gap-1 p-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">
                            {comment.user?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            <RealTimeAgo date={comment.createdAt} />
                        </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                        {displayedMessage}
                        {needsTruncation && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-primary ml-1 text-xs hover:underline"
                            >
                                {isExpanded ? 'Show less' : 'Show all'}
                            </button>
                        )}
                    </p>
                </div>
                {comment.userId === user?.id && (
                    <button
                        onClick={() => {
                            if (onDelete) {
                                setLoading(true);
                                onDelete(comment).finally(() => setLoading(false));
                            }
                        }}
                        className={cn(
                            'flex w-fit text-xs text-primary px-2 gap-0.5',
                            !onDelete || isLoading ? 'opacity-50' : 'underline-offset-1 hover:underline cursor-pointer'
                        )}
                    >
                        {isLoading && <Icons.spinner className='animate-spin size-3.5' />}
                        <Translate value="delete" />
                    </button>
                )}
            </div>
        </div>
    );
}