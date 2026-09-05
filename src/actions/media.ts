import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import {
    findEntityByImdbId,
    findEntityByTmdbId,
    searchMedia as searchMediaApi,
} from '../services/api';
import { actionErrorFrom, requireStudioAuth } from '../utils/studio-auth';

const keywordInput = z.object({ keyword: z.string().trim().min(1) });

export const searchMedia = defineAction({
    accept: 'json',
    input: keywordInput,
    handler: async ({ keyword }, context) => {
        requireStudioAuth(context.request);
        try {
            return await searchMediaApi(keyword);
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

export const findEntityByTMDBId = defineAction({
    accept: 'json',
    input: z.object({
        id: z.string().trim().min(1),
        type: z.enum(['movie', 'tv', 'tv_episode', 'tv_season']),
    }),
    handler: async ({ id, type }, context) => {
        requireStudioAuth(context.request);
        try {
            return await findEntityByTmdbId(id, type);
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

export const findEntity = defineAction({
    accept: 'json',
    input: z.object({ imdb_id: z.string().trim().min(1) }),
    handler: async ({ imdb_id }, context) => {
        requireStudioAuth(context.request);
        try {
            return await findEntityByImdbId(imdb_id);
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});
