import { getRelativeLocaleUrl } from 'astro:i18n';
import zh from '../locales/zh.yml';
import en from '../locales/en.yml';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

const getNested = (obj: unknown, path: string): unknown => {
    if (!obj || typeof obj !== 'object') return undefined;

    return path.split('.').reduce<unknown>((current, key) => {
        if (!current || typeof current !== 'object') return undefined;
        return key in current ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
};

export const normalizeLocale = (value: string | undefined): Locale =>
    value === 'en' ? 'en' : defaultLocale;

export const getLocaleFromPath = (pathname: string): Locale =>
    pathname === '/en' || pathname.startsWith('/en/') ? 'en' : defaultLocale;

export const stripLocaleFromPath = (pathname: string): string => {
    if (pathname === '/en' || pathname.startsWith('/en/')) {
        return pathname.slice('/en'.length) || '/';
    }
    return pathname || '/';
};

export const getLocalePath = (locale: Locale, path = '/'): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return getRelativeLocaleUrl(locale, normalizedPath);
};

const useTranslation = (locale: Locale) => {
    const primary = locale === 'en' ? en : zh;
    const fallback = locale === 'en' ? zh : en;

    return (key: string): string => {
        const value = getNested(primary, key) ?? getNested(fallback, key);
        if (typeof value === 'string') return value;

        console.warn(`Translation for "${key}" not found`);
        return key.split('.').pop() ?? key;
    };
};

export const useLocale = (url: URL, explicitLocale?: string) => {
    const locale = normalizeLocale(explicitLocale ?? getLocaleFromPath(url.pathname));
    return {
        path: (path: string) => getLocalePath(locale, path),
        t: useTranslation(locale),
        locale,
    };
};
