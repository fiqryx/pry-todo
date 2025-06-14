"use client"
import { z } from "zod"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import { translateText } from "@/components/translate"
import { useTranslation } from "react-i18next"
import { useRef, useState, useCallback } from "react"

import { useForm } from "react-hook-form"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { registerUser } from "@/lib/services/user"
import { CameraIcon } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AvatarWithPreview } from "@/components/image-preview"
import { ImageCropper } from "@/components/image-cropper"
import { cloudinaryUpload } from "@/lib/services/cloudinary"

import { User as SupabaseUser } from "@supabase/supabase-js"
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    image: z.any().optional(),
});

type Props = {
    data: SupabaseUser
}

export function UserCreateForm({ data }: Props) {
    const { t } = useTranslation();
    const { setError, ...form } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: data.user_metadata?.name || '',
        }
    });

    const name = form.watch('name');
    const fileRef = useRef<HTMLInputElement>(null);
    const [isloading, setLoading] = useState(false);
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
        form.setValue("image", file);
        setPreviewUrl(URL.createObjectURL(file));
        setCropperOpen(false);
    }, [selectedFile]);

    const onSubmit = useCallback(
        async (value: z.infer<typeof schema>) => {
            try {
                setLoading(true);

                let imageUrl = data.user_metadata?.avatar_url;
                if (value.image) {
                    const res = await cloudinaryUpload(
                        value.image,
                        'user_profile_images'
                    );
                    imageUrl = res.secure_url;
                }

                const res = await registerUser({
                    id: data.id,
                    name: value.name,
                    email: data.email,
                    image: imageUrl
                });

                if (res?.error) throw res.error;

                toast.success("User created successfully");
                window.location.reload();
            } catch (e: any) {
                logger.debug(e);
                toast.error(e?.message || "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        },
        [data]
    );

    return (
        <Form setError={setError} {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center justify-center h-screen w-full">
                <Card className="w-full max-w-xs sm:max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>
                            {translateText(t, 'welcome.to', { value: translateText(t, 'your.account') })}
                        </CardTitle>
                        <CardDescription>
                            {translateText(t, 'getting.started')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center gap-4">
                        <FormField
                            name="image"
                            control={form.control}
                            render={() => (
                                <FormItem className="space-y-1">
                                    <div className="relative">
                                        <AvatarWithPreview
                                            src={previewUrl || data.user_metadata?.avatar_url}
                                            className="h-24 w-24 rounded-full border p-0.5 cursor-pointer"
                                            classNames={{
                                                img: 'rounded-full',
                                                fallback: 'rounded-full hover:bg-muted/70'
                                            }}
                                        />
                                        <input
                                            type="file"
                                            ref={fileRef}
                                            className="hidden"
                                            onChange={handleFileChange}
                                            accept="image/jpeg,image/png"
                                        />
                                        <Button
                                            size="icon"
                                            type="button"
                                            variant="ghost"
                                            className="absolute bottom-1 right-1 bg-background border rounded-full size-8"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            <CameraIcon className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            name="name"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="space-y-1 w-full">
                                    <Input
                                        placeholder="Enter your name"
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            form.setValue("name", e.target.value);
                                        }}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!name.trim() || isloading}
                        >
                            {isloading && <Icons.spinner className="animate-spin" />}
                            {translateText(t, 'create.account', { capitalize: true })}
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {selectedFile && (
                <ImageCropper
                    circularCrop
                    open={cropperOpen}
                    onOpenChange={setCropperOpen}
                    image={URL.createObjectURL(selectedFile)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </Form>
    )
}
