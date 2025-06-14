'use client'
import { z } from "zod"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { useForm } from "react-hook-form"
import { useProject } from "@/stores/project"
import { cloudinaryPublicId, cn } from "@/lib/utils"
import { useCallback, useEffect, useRef, useState } from "react"

import { CameraIcon } from "lucide-react"
import { Icons } from "@/components/icons"
import { useAuthStore } from "@/stores/auth"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

import { updateUser } from "@/lib/services/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@/components/ui/card"
import { ImageCropper } from "@/components/image-cropper"
import { AvatarWithPreview } from "@/components/image-preview"
import { Translate, translateText } from "@/components/translate"
import { cloudinaryUpload, deleteCloudinary } from "@/lib/services/cloudinary"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Form validation schema
const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    photo: z.any().optional(),

})

// eslint-disable-next-line
const updatePasswordSchema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }).optional(),
    confirmPassword: z.string().optional(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export function SettingsAccount({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    const { t } = useTranslation();
    const { user, set: setAuth } = useAuthStore();
    const { active, set: setProject } = useProject();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
        },
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setCropperOpen(true);
        e.target.value = '';
    }, []);

    const handleCropComplete = useCallback((img: Blob) => {
        const file = new File([img], selectedFile?.name || 'avatar', {
            type: img.type,
        });
        form.setValue("photo", file);
        setPreviewUrl(URL.createObjectURL(file));
        setCropperOpen(false);
    }, [selectedFile]);

    const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            let secureUrl = "";
            if (values.photo) {
                const res = await cloudinaryUpload(values.photo, 'user_profile_images');
                secureUrl = res.secure_url;

                // remove previous image
                if (user?.image) {
                    const publicId = cloudinaryPublicId(user.image);
                    if (publicId) deleteCloudinary(publicId);
                }
            }


            const { data, error } = await updateUser({
                ...values,
                image: secureUrl
            });

            if (!data) {
                toast.error(error);
                return;
            }

            setAuth({ user: data });

            const users = active?.users?.map(v => v.id === data.id ? data : v);
            setProject({ active: { users } })
            toast.success("Save successfully");
        } catch (error) {
            logger.error(error);
            toast.error("Failed to save");
        } finally {
            setIsLoading(false);
        }
    }, [user, active]);

    useEffect(() => {
        if (!user) return
        form.reset({
            name: user.name,
            email: user.email,
        });
    }, [user]);

    return (
        <>
            <Card {...props} className={cn('rounded-md', className)}>
                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-6">
                                {/* Profile Section */}
                                <div className="xborder-b xpb-6">
                                    <Translate t={t} as="h3" value="profile" className="capitalize text-lg font-medium" />
                                    <Translate t={t} as="p" value="update.profile.description" className="text-sm text-muted-foreground mb-4" />

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <AvatarWithPreview
                                                src={previewUrl || user?.image}
                                                className="h-16 w-16 cursor-pointer"
                                                fallback={user?.name?.charAt(0) || 'U'}
                                            />
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <Button
                                                size="icon"
                                                type="button"
                                                variant="ghost"
                                                className="absolute -bottom-1 -right-1 bg-background border rounded-full size-8"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <CameraIcon className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                        <div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Translate t={t} value="change.avatar" />
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                JPG, GIF or PNG. {translateText(t, 'max.size', { size: '2MB' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Translate t={t} as={FormLabel} value="full.name" />
                                                    <FormControl>
                                                        <Input placeholder={translateText(t, 'your.name')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Translate t={t} capitalize as={FormLabel} value="email" />
                                                    <FormControl>
                                                        <Input disabled placeholder={translateText(t, 'your.email')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Password Section */}
                                {/* <div className="border-b pb-6">
                                    <Translate t={t} as="h3" value="password" className="capitalize text-lg font-medium" />
                                    <Translate t={t} as="p" value="password.description" className="text-sm text-muted-foreground mb-4" />

                                    <div className="space-y-4">
                                        <FormField
                                            disabled={disableChangePassoword}
                                            control={form.control}
                                            name="currentPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={cn(disableChangePassoword && 'text-muted-foreground')}>
                                                        {translateText(t, 'current.password')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder={translateText(t, 'current.password')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            disabled={disableChangePassoword}
                                            control={form.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={cn(disableChangePassoword && 'text-muted-foreground')}>
                                                        {translateText(t, 'new.password')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder={translateText(t, 'new.password')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            disabled={disableChangePassoword}
                                            control={form.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className={cn(disableChangePassoword && 'text-muted-foreground')}>
                                                        {translateText(t, 'new.password.confirm')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder={translateText(t, 'new.password.confirm')} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div> */}
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" size="sm" disabled={isLoading}>
                                    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                                    <Translate t={t} value="save.changes" />
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {selectedFile && (
                <ImageCropper
                    circularCrop
                    open={cropperOpen}
                    onOpenChange={setCropperOpen}
                    image={URL.createObjectURL(selectedFile)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </>
    );
}