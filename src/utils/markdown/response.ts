import type { MarkdownDocument } from './types';

export interface MarkdownResponseOptions {
    status?: number;
    filename?: string;
    contentType?: string;
    headers?: Record<string, string>;
}

/**
 * Return true only when the client explicitly accepts text/markdown.
 * Wildcards are intentionally ignored so normal browser requests remain HTML.
 */
export function acceptsMarkdown(request: Request): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;

    return (request.headers.get('accept') ?? '')
        .split(',')
        .some((part) => {
            const [mediaType, ...parameters] = part.trim().toLowerCase().split(';');
            if (mediaType !== 'text/markdown') return false;

            const quality = parameters
                .map((parameter) => parameter.trim())
                .find((parameter) => parameter.startsWith('q='));

            return quality ? Number(quality.slice(2)) > 0 : true;
        });
}

export function markdownResponse(
    document: MarkdownDocument | string,
    options: MarkdownResponseOptions = {},
): Response {
    const body = typeof document === 'string' ? document : document.body;
    const headers = new Headers({
        'Content-Type': options.contentType ?? 'text/markdown; charset=utf-8',
        'Content-Disposition': options.filename
            ? `inline; filename="${options.filename}"`
            : 'inline',
        'Vary': 'Accept',
        'Cache-Control': 'public, max-age=300',
        ...options.headers,
    });

    return new Response(body, {
        status: options.status ?? 200,
        headers,
    });
}

export function markdownError(
    message: string,
    status: number,
    headers?: Record<string, string>,
): Response {
    return markdownResponse(`# ${status === 404 ? 'Not Found' : 'Temporarily unavailable'}\n\n${message}\n`, {
        status,
        headers,
    });
}
