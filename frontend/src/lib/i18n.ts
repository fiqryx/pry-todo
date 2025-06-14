import i18next from 'i18next'
import languages from '@/../locales/languages.json'
import resourcesToBackend from 'i18next-resources-to-backend';

import { Config } from "next-i18n-router/dist/types";
import { initReactI18next } from 'react-i18next/initReactI18next';
import { i18n, Resource, createInstance } from 'i18next';


const i18nConfig = {
    defaultLocale: 'en',
    locales: languages.map(v => v.code),
} satisfies Config

export async function i18nInitialize(
    locale: string,
    namespaces: string[],
    i18nInstance?: i18n,
    resources?: Resource,
) {
    i18nInstance = i18nInstance || createInstance();

    i18nInstance.use(initReactI18next);

    if (!resources) {
        i18nInstance.use(
            resourcesToBackend((language: string, namespace: string) => {
                return import(`../../locales/${language}/${namespace}.json`)
            }),
        );
    }

    await i18nInstance.init({
        lng: locale,
        resources,
        fallbackLng: i18nConfig.defaultLocale,
        supportedLngs: i18nConfig.locales,
        defaultNS: namespaces[0],
        fallbackNS: namespaces[0],
        ns: namespaces,
        preload: resources ? [] : i18nConfig.locales,
    });

    return {
        i18n: i18nInstance,
        resources: i18nInstance.services.resourceStore.data,
        t: i18nInstance.t,
    }
}

export function createServerTranslator(locale: string, namespaces: string[]) {
    // Initialize a fresh instance for each request
    const instance = i18next.createInstance();

    // Configure for server-side usage
    instance.use(resourcesToBackend((language: string, namespace: string) => {
        return import(`../../locales/${language}/${namespace}.json`);
    }));

    // Initialize synchronously (or await if you make this async)
    instance.init({
        lng: locale,
        fallbackLng: i18nConfig.defaultLocale,
        supportedLngs: i18nConfig.locales,
        ns: namespaces,
        defaultNS: namespaces[0],
        preload: [locale],
        initImmediate: false // Important for server-side!
    });

    return {
        t: instance.t.bind(instance),
        i18n: instance
    };
}