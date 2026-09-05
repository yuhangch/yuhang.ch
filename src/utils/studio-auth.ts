import { ActionError } from 'astro:actions';
import { STUDIO_SECRET } from 'astro:env/server';

export const isStudioAuthorized = (request: Request): boolean =>
    request.headers.get('authorization') === `Basic ${STUDIO_SECRET}`;

export const requireStudioAuth = (request: Request): void => {
    if (!isStudioAuthorized(request)) {
        throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'Studio authentication is required.',
        });
    }
};

export const actionErrorFrom = (error: unknown): ActionError => {
    if (error instanceof ActionError) return error;

    const status = typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: unknown }).status
        : undefined;
    const code = status === 404
        ? 'NOT_FOUND'
        : typeof status === 'number' && status >= 400 && status < 500
          ? 'BAD_REQUEST'
          : 'INTERNAL_SERVER_ERROR';

    return new ActionError({
        code,
        message: error instanceof Error ? error.message : 'Upstream request failed.',
    });
};
