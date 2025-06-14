'use server'
import { logger } from "@/lib/logger";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

type Preset = 'user_profile_images' | 'attachments'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// eslint-disable-next-line
async function _cloudinaryUploadOld(file: File, preset: Preset) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const uploadResponse = await fetch('your-upload-url', {
            method: 'POST',
            body: formData,
        });

        const data = await uploadResponse.json();

        return data.secure_url as string
    } catch (error) {
        logger.debug('Cloudinary upload failed:', error);
        throw new Error('Failed to upload file');
    }
}

export async function cloudinaryUpload(file: File, preset: Preset) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result: UploadApiResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream({
                    resource_type: 'auto',
                    upload_preset: preset
                }, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                })
                .end(buffer);
        }) as any;

        return result
    } catch (error) {
        logger.debug('Cloudinary upload failed:', error);
        throw new Error('Failed to upload file');
    }
}

export async function deleteCloudinary(publicId: string) {
    try {
        // Delete the resource
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            return { success: true, message: 'File deleted successfully' };
        } else {
            throw new Error(result?.result || 'Failed to delete file');
        }
    } catch (error) {
        logger.debug('Cloudinary delete error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete file'
        };
    }
}