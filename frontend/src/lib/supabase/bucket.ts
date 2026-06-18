'use server'
import { logger } from "@/lib/logger";
import { createClient } from './server';

type BucketType = 'user_profile_images' | 'attachments'

export async function supabaseBucketUpload(file: File, bucket: BucketType) {
    try {
        const supabase = await createClient();
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(uniqueFileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            url: publicUrlData.publicUrl,
            path: data.path
        };
    } catch (error) {
        logger.debug('Supabase upload failed:', error);
        throw new Error('Failed to upload file');
    }
}

export async function supabaseBucketDelete(filePath: string, bucket: BucketType) {
    try {
        const supabase = await createClient();

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return { success: true, message: 'File deleted successfully' };
    } catch (error) {
        logger.debug('Supabase delete error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete file'
        };
    }
}