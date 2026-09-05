import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { LiveLoader } from 'astro/loaders';
import {
    getMoment,
    getMomentsPage,
    getPlaces,
    getReviewsPage,
    type Moment,
    type Place,
    type Review,
} from './services/api';

const momentSchema = z.object({
    id: z.string(),
    body: z.string(),
    created_at: z.string(),
    tags: z.string().optional(),
    title: z.string().optional(),
    title_en: z.string().optional(),
    imdb_id: z.string().optional(),
    name: z.string().optional(),
    name_en: z.string().optional(),
    location: z.string().optional(),
    image: z.string().optional(),
});

const reviewSchema = z.object({
    moments_id: z.union([z.string(), z.number()]).optional(),
    imdb_id: z.string(),
    imdb_rating: z.number().nullable().optional(),
    rated_date: z.string(),
    release_date: z.string().nullable().optional(),
    title: z.string(),
    title_en: z.string().optional(),
    media_type: z.string().optional(),
    rating: z.union([z.string(), z.number()]),
});

const placeSchema = z.object({
    id: z.number(),
    name: z.string(),
    name_en: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    coordinates: z.string().optional(),
    rating: z.number().optional(),
    visit_date: z.string().optional(),
    description: z.string().optional(),
    photos: z.string().optional(),
    moments_id: z.union([z.string(), z.number()]).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

const momentsLoader: LiveLoader<Moment, { id: string }, { page?: number }> = {
    name: 'yuhang-moments',
    async loadEntry({ filter }) {
        try {
            const entry = await getMoment(filter.id);
            return entry ? { id: String(entry.id), data: entry } : undefined;
        } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
        }
    },
    async loadCollection({ filter }) {
        try {
            const result = await getMomentsPage(filter?.page ?? 1);
            return {
                entries: result.items.map((item) => ({ id: String(item.id), data: item })),
            };
        } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
        }
    },
};

const reviewsLoader: LiveLoader<Review, never, { page?: number; mediaType?: string }> = {
    name: 'yuhang-reviews',
    async loadEntry() {
        return undefined;
    },
    async loadCollection({ filter }) {
        try {
            const result = await getReviewsPage(filter?.page ?? 1, filter?.mediaType ?? '');
            return {
                entries: result.items.map((item, index) => ({
                    id: String(item.imdb_id || index),
                    data: item,
                })),
            };
        } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
        }
    },
};

const placesLoader: LiveLoader<Place, { id: string }> = {
    name: 'yuhang-places',
    async loadEntry({ filter }) {
        try {
            const places = await getPlaces();
            const place = places.find((item) => String(item.id) === String(filter.id));
            return place ? { id: String(place.id), data: place } : undefined;
        } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
        }
    },
    async loadCollection() {
        try {
            const places = await getPlaces();
            return {
                entries: places.map((item) => ({ id: String(item.id), data: item })),
            };
        } catch (error) {
            return { error: error instanceof Error ? error : new Error(String(error)) };
        }
    },
};

export const collections = {
    moments: defineLiveCollection({ loader: momentsLoader, schema: momentSchema }),
    reviews: defineLiveCollection({ loader: reviewsLoader, schema: reviewSchema }),
    places: defineLiveCollection({ loader: placesLoader, schema: placeSchema }),
};
