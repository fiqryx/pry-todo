"use client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { LifeBuoy } from "lucide-react";
import { useForm } from "react-hook-form";

import { useTranslation } from "react-i18next";
import { createReport } from "@/lib/services/report";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Translate, translateText } from "@/components/translate";
import { reportSchema, ReportSchema } from "@/types/schemas/report";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";

const feedback_types = [
    { key: 'feedback', label: 'feedback.report' },
    { key: 'bug', label: 'bug.report' },
    { key: 'feature', label: 'feature.request' },
    { key: 'other', label: 'other' },
] as const;

const feedback_messages = {
    feedback: "Thank you for your feedback! We appreciate your input.",
    bug: "Bug report submitted successfully! We'll investigate this issue.",
    feature: "Feature request received! We'll consider it for future updates.",
    other: "Your submission has been received. Thank you!"
} as const

type FeedbackFormProps = {
    asChild?: boolean
    onSubmitSuccess?: () => void;
} & React.ComponentProps<typeof Dialog>;

export function FeedbackFormDialog({
    asChild,
    children,
    onSubmitSuccess,
    ...props
}: FeedbackFormProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(props.open);

    const form = useForm<ReportSchema>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            type: undefined,
            message: "",
        },
    });

    const onOpenChange = useCallback((open: boolean) => {
        setOpen(open)
        props.onOpenChange?.(open)
    }, [])

    const onSubmit = useCallback(async (values: ReportSchema) => {
        try {
            const { data, error } = await createReport(values);

            if (!data) {
                toast.error(error);
                return
            }

            form.reset();
            toast.success(feedback_messages[values.type]);

            onOpenChange(false)
            onSubmitSuccess?.();
        } catch (error) {
            logger.error(error);
            toast.error("Failed to submit feedback")
        }
    }, []);

    useEffect(() => {
        setOpen(props.open)
    }, [props.open])

    return (
        <Dialog {...props} open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild={asChild}>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-xs sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="capitalize">
                        {translateText(t, 'feedback.report')}
                    </DialogTitle>
                    <DialogDescription>
                        {translateText(t, 'feedback.report.description')}.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                        <div className="grid gap-2 py-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-60">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {feedback_types.map((item, idx) => (
                                                    <SelectItem key={idx} value={item.key}>
                                                        {translateText(t, item.label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                className="min-h-30"
                                                placeholder="Enter your feedback or report details..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button size="sm" type="button" variant="outline">
                                    {translateText(t, 'cancel', { capitalize: true })}
                                </Button>
                            </DialogClose>
                            <Button size="sm" type="submit" disabled={form.formState.isSubmitting}>

                                {form.formState.isSubmitting && <span className="loading loading-xs loading-spinner" />}
                                {translateText(t, 'submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export function FeedbackSidebarItem({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <FeedbackFormDialog asChild>
                            <SidebarMenuButton size="sm">
                                <LifeBuoy />
                                <Translate value="feedback.report" className="capitalize" />
                            </SidebarMenuButton>
                        </FeedbackFormDialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}