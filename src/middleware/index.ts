import { defineMiddleware, sequence } from 'astro:middleware';
import { STUDIO_SECRET } from 'astro:env/server';
import { getLocaleFromPath, stripLocaleFromPath } from '../utils/locale';
import { acceptsMarkdown } from '../utils/markdown/response';
import { renderMarkdownRequest } from '../utils/markdown/renderers';

const isStudioPath = (pathname: string): boolean => {
    const localPath = stripLocaleFromPath(pathname);
    return localPath === '/studio' || localPath.startsWith('/studio/');
};

export const handleStudioAuth = defineMiddleware(async (context, next) => {
    try {
        if (
            isStudioPath(new URL(context.request.url).pathname) &&
            context.request.headers.get('authorization') !== `Basic ${STUDIO_SECRET}`
        ) {
            return new Response('Unauthorized', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="YH Visible Realm"',
                },
            });
        }
        return await next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
});

export const handleLocale = defineMiddleware(async (context, next) => {
    const originalUrl = new URL(context.request.url);
    const originalPathname = originalUrl.pathname;
    const locale = getLocaleFromPath(originalPathname);

    context.locals.locale = locale;
    context.locals.originalPathname = originalPathname;
    context.locals.originalUrl = originalUrl;

    if (locale === 'en') {
        const rewrittenUrl = new URL(originalUrl);
        rewrittenUrl.pathname = stripLocaleFromPath(originalPathname);
        return next(rewrittenUrl);
    }

    return next();
});

export const handleMarkdownNegotiation = defineMiddleware(async (context, next) => {
    const pathname = context.url.pathname;
    const isExcluded =
        pathname.startsWith('/raw/') ||
        pathname.startsWith('/studio') ||
        pathname.endsWith('.xml') ||
        pathname.endsWith('.html') ||
        pathname === '/404';

    if (!context.isPrerendered && !isExcluded && acceptsMarkdown(context.request)) {
        const response = await renderMarkdownRequest(
            context.request,
            context.url,
            context.locals.locale,
        );
        if (response) return response;
    }

    return next();
});

export const onRequest = sequence(
    handleStudioAuth,
    handleLocale,
    handleMarkdownNegotiation,
);
