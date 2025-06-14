import { site } from '@/config/site';
import type { Metadata } from 'next/types';

export const baseUrl =
    process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SITE_URL
        ? new URL('http://localhost:3001')
        : new URL(process.env.NEXT_PUBLIC_SITE_URL);

export function createMetadata(override: Metadata): Metadata {
    const title = override.title ? `${override.title} | ${site.name}` : site.name
    return {
        ...override,
        title,
        metadataBase: baseUrl,
        description: override.description ?? site.description,
        openGraph: {
            title,
            description: override.description ?? site.description,
            url: baseUrl,
            images: '/banner.png',
            siteName: 'Pry',
            ...override.openGraph,
        },
        twitter: {
            title,
            card: 'summary_large_image',
            creator: '@fiqryx',
            description: override.description ?? site.description,
            images: '/banner.png',
            ...override.twitter,
        },
    };
}
