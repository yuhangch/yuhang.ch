import { defineMiddleware, sequence } from 'astro:middleware';
import { STUDIO_SECRET } from 'astro:env/server';
import { acceptsMarkdown } from '../utils/markdown/response';
import { renderMarkdownRequest } from '../utils/markdown/renderers';

export const handleStudioAuth = defineMiddleware(async (context, next) => {
    try {
        if (
            new URL(context.request.url).pathname.startsWith('/studio') &&
            context.request.headers.get('authorization') !==
                `Basic ${STUDIO_SECRET}`
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

export const handleMarkdownNegotiation = defineMiddleware(async (context, next) => {
    const pathname = context.url.pathname;
    const isExcluded =
        pathname.startsWith('/raw/') ||
        pathname.startsWith('/en/raw/') ||
        pathname.startsWith('/studio') ||
        pathname.startsWith('/en/studio') ||
        pathname.endsWith('.xml') ||
        pathname.endsWith('.html') ||
        pathname === '/404' ||
        pathname === '/en/404';

    if (!context.isPrerendered && !isExcluded && acceptsMarkdown(context.request)) {
        const response = await renderMarkdownRequest(context.request, context.url);
        if (response) return response;
    }

    return next();
});

export const onRequest = sequence(handleStudioAuth, handleMarkdownNegotiation);
