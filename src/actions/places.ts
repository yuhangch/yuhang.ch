import { defineAction } from 'astro:actions';
import { AMAP_KEY } from 'astro:env/server';
import { z } from 'astro/zod';
import { createPlace as createPlaceApi, type CreatePlaceInput } from '../services/api';
import { actionErrorFrom, requireStudioAuth } from '../utils/studio-auth';

const placeInput: z.ZodType<CreatePlaceInput> = z.object({
    name: z.string(),
    name_en: z.string(),
    type: z.string(),
    location: z.string(),
    coordinates: z.string(),
    rating: z.number(),
    visit_date: z.string(),
    description: z.string(),
    photos: z.string(),
    moments_id: z.string(),
});

export const createPlace = defineAction({
    accept: 'json',
    input: placeInput,
    handler: async (place, context) => {
        requireStudioAuth(context.request);
        try {
            await createPlaceApi(place);
            return { ok: true };
        } catch (error) {
            throw actionErrorFrom(error);
        }
    },
});

interface AmapPoi {
    id: string;
    name?: string;
    address?: string;
    location?: string;
    tel?: string;
    type?: string;
    business_area?: string;
    rating?: string;
    cost?: string;
    photos?: unknown[];
}

interface AmapResponse {
    status?: string;
    info?: string;
    pois?: AmapPoi[];
}

export const searchPOI = defineAction({
    accept: 'json',
    input: z.object({
        keywords: z.string().trim().min(1),
        region: z.string().optional(),
        city: z.string().optional(),
    }),
    handler: async ({ keywords, region, city }, context) => {
        requireStudioAuth(context.request);
        const query = new URLSearchParams({
            key: AMAP_KEY,
            keywords,
            region: region || city || '天津',
            show_fields: 'all',
        });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
            const response = await fetch(
                `https://restapi.amap.com/v5/place/text?${query}`,
                { signal: controller.signal },
            );
            const data = (await response.json()) as AmapResponse;
            if (!response.ok || data.status !== '1') {
                throw new Error(data.info || `Amap returned ${response.status}`);
            }
            return data.pois ?? [];
        } catch (error) {
            throw actionErrorFrom(error);
        } finally {
            clearTimeout(timeout);
        }
    },
});
