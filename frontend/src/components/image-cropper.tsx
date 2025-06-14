'use client'
import { toast } from 'sonner';
import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { cn, getCroppedImg } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { translateText } from '@/components/translate';
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ImageCropperProps extends
    React.ComponentProps<typeof Dialog> {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    aspectRatio?: number;
    circularCrop?: boolean;
    className?: string
}

export function ImageCropper({
    image,
    onCropComplete,
    aspectRatio = 1,
    circularCrop = false,
    className,
    ...props
}: ImageCropperProps) {
    const { t } = useTranslation();
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });

    const [cropped, setCropped] = useState<{
        area: Area
        pixel: Area
    }>();

    const handleCropComplete = async (_: Area, croppedAreaPixels: Area) => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            toast.error(`Error cropping image: ${e}`);
        }
    };

    return (
        <Dialog {...props}>
            <DialogContent className={cn('sm:rounded-sm sm:max-w-2xl p-1', className)}>
                <div className="flex flex-col gap-1">
                    <div className="relative h-96 size-full">
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            showGrid={!circularCrop}
                            cropShape={circularCrop ? 'round' : 'rect'}
                            onCropComplete={(area, pixel) => setCropped({ area, pixel })}
                        />
                    </div>
                    <Button
                        className='rounded-sm'
                        onClick={() => cropped && handleCropComplete(cropped.area, cropped.pixel)}
                    >
                        {translateText(t, 'crop.save')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}