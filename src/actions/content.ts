import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import {
    createMoment as createMomentApi,
    createReview as createReviewApi,
    getMoment as getMomentApi,
    updateMoment as updateMomentApi,
} from '../services/api';
import { actionErrorFrom, requireStudioAuth } from '../utils/studio-auth';

const momentInput = z.object({
    tags: z.string(),
    body: z.string(),
});

export const createMoment = defineAction({
    accept: 'json',
    input: momentInput,
    handler: async ({ tags, body }, context) => {
        requireStudioAuth(context.request);
        try {
            return await createMomentApi(tags, body);
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

const reviewInput = z.object({
    moments_id: z.string(),
    imdb_id: z.string().min(1),
    imdb_rating: z.number().nullable(),
    rated_date: z.string(),
    release_date: z.string().nullable(),
    title: z.string(),
    title_en: z.string(),
    media_type: z.string(),
    rating: z.string(),
    content: z.string(),
});

export const createReview = defineAction({
    accept: 'json',
    input: reviewInput,
    handler: async (review, context) => {
        requireStudioAuth(context.request);
        try {
            await createReviewApi({
                ...review,
                imdb_rating: review.imdb_rating ?? null,
                release_date: review.release_date ?? null,
            });
            return { ok: true };
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

export const getMoment = defineAction({
    accept: 'json',
    input: z.object({ id: z.string().trim().min(1) }),
    handler: async ({ id }, context) => {
        requireStudioAuth(context.request);
        try {
            return await getMomentApi(id);
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

export const updateMoment = defineAction({
    accept: 'json',
    input: momentInput.extend({ id: z.string().trim().min(1) }),
    handler: async ({ id, tags, body }, context) => {
        requireStudioAuth(context.request);
        try {
            await updateMomentApi(id, tags, body);
            return { ok: true };
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});
