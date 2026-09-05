import { API_SECRET, API_URL } from 'astro:env/server';

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly path?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export interface Moment {
    id: string;
    body: string;
    created_at: string;
    tags?: string;
    title?: string;
    title_en?: string;
    imdb_id?: string;
    name?: string;
    name_en?: string;
    location?: string;
    image?: string;
}

export interface Review {
    moments_id?: string | number;
    imdb_id: string;
    imdb_rating?: number | null;
    rated_date: string;
    release_date?: string | null;
    title: string;
    title_en?: string;
    media_type?: string;
    rating: string | number;
}

export interface Place {
    id: number;
    name: string;
    name_en?: string;
    type?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    coordinates?: string;
    rating?: number;
    visit_date?: string;
    description?: string;
    photos?: string;
    moments_id?: number | string;
    created_at?: string;
    updated_at?: string;
}

export interface PageResult<T> {
    items: T[];
    prev: number | null;
    next: number | null;
}

export interface MediaSearchResult {
    id: number;
    release_date?: string;
    first_air_date?: string;
    title?: string;
    name?: string;
    media_type: string;
}

export interface MediaEntity {
    imdb_id: string;
    title: string;
    title_en: string;
    media_type: string;
    imdb_rating: number | null;
    rating: number;
    release_date: string | null;
    rated_date: string | null;
}

export interface CreateReviewInput {
    moments_id: string;
    imdb_id: string;
    imdb_rating: number | null;
    rated_date: string;
    release_date: string | null;
    title: string;
    title_en: string;
    media_type: string;
    rating: string;
    content: string;
}

export interface CreatePlaceInput {
    name: string;
    name_en: string;
    type: string;
    location: string;
    coordinates: string;
    rating: number;
    visit_date: string;
    description: string;
    photos: string;
    moments_id: string;
}

interface PageResponse<T> {
    moments?: T[];
    reviews?: T[];
    prev?: number | null;
    next?: number | null;
}

interface PlacesResponse {
    places?: Place[];
}

function apiPath(path: string): string {
    return `${API_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function toError(error: unknown, path: string): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof Error && error.name === 'AbortError') {
        return new ApiError(`API request timed out: ${path}`, undefined, path);
    }
    return new ApiError(
        `API request failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        path,
    );
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${API_SECRET}`);
    headers.set('Accept', headers.get('Accept') ?? 'application/json');

    try {
        const response = await fetch(apiPath(path), {
            ...init,
            headers,
            signal: init.signal ?? controller.signal,
        });

        const responseText = await response.text();
        if (!response.ok) {
            throw new ApiError(
                `API returned ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
                response.status,
                path,
            );
        }

        if (!responseText) return undefined as T;

        try {
            return JSON.parse(responseText) as T;
        } catch {
            return responseText as T;
        }
    } catch (error) {
        throw toError(error, path);
    } finally {
        clearTimeout(timeout);
    }
}

function jsonRequest(body: unknown): RequestInit {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

export async function getMoment(id: string): Promise<Moment | null> {
    if (!id.trim()) return null;
    return apiFetch<Moment | null>(`moments/${encodeURIComponent(id)}`);
}

export async function getMomentsPage(page: number): Promise<PageResult<Moment>> {
    const result = await apiFetch<PageResponse<Moment>>(`moments?page=${page}`);
    return {
        items: result.moments ?? [],
        prev: result.prev ?? null,
        next: result.next ?? null,
    };
}

export async function getReviewsPage(page: number, mediaType = ''): Promise<PageResult<Review>> {
    const query = new URLSearchParams({ page: String(page) });
    if (mediaType) query.set('media_type', mediaType);

    const result = await apiFetch<PageResponse<Review>>(`reviews?${query}`);
    return {
        items: result.reviews ?? [],
        prev: result.prev ?? null,
        next: result.next ?? null,
    };
}

export async function getPlaces(): Promise<Place[]> {
    const result = await apiFetch<PlacesResponse | Place[]>('places');
    return Array.isArray(result) ? result : result.places ?? [];
}

export async function createMoment(tags: string, body: string): Promise<string> {
    return apiFetch<string>('moments', jsonRequest({ tags, body }));
}

export async function updateMoment(id: string, tags: string, body: string): Promise<string> {
    return apiFetch<string>(`moments/${encodeURIComponent(id)}`, jsonRequest({ tags, body }));
}

export async function createReview(data: CreateReviewInput): Promise<void> {
    await apiFetch('reviews', jsonRequest(data));
}

export async function createPlace(data: CreatePlaceInput): Promise<void> {
    await apiFetch('places', jsonRequest(data));
}

export async function searchMedia(keyword: string): Promise<MediaSearchResult[]> {
    const query = new URLSearchParams({ query: keyword, language: 'zh' });
    const result = await apiFetch<{ results?: MediaSearchResult[] }>(`tmdb/3/search/multi?${query}`);
    return result.results ?? [];
}

async function getTmdbFindResult(id: string, language: string): Promise<Record<string, unknown> | null> {
    const query = new URLSearchParams({ external_source: 'imdb_id', language });
    const result = await apiFetch<{
        movie_results?: Record<string, unknown>[];
        tv_results?: Record<string, unknown>[];
        tv_episode_results?: Record<string, unknown>[];
        tv_season_results?: Record<string, unknown>[];
    }>(`tmdb/3/find/${encodeURIComponent(id)}?${query}`);

    return result.movie_results?.[0]
        ?? result.tv_results?.[0]
        ?? result.tv_episode_results?.[0]
        ?? result.tv_season_results?.[0]
        ?? null;
}

export async function findEntityByImdbId(id: string): Promise<MediaEntity | null> {
    const [zhResult, enResult] = await Promise.all([
        getTmdbFindResult(id, 'zh'),
        getTmdbFindResult(id, 'en'),
    ]);

    if (!zhResult) return null;

    const title = String(zhResult.title ?? zhResult.name ?? '');
    const titleEn = String(enResult?.title ?? enResult?.name ?? title);
    return {
        imdb_id: id,
        title,
        title_en: titleEn,
        media_type: String(zhResult.media_type ?? ''),
        imdb_rating: typeof zhResult.vote_average === 'number' ? zhResult.vote_average : null,
        rating: -1,
        release_date: String(zhResult.release_date ?? zhResult.first_air_date ?? '') || null,
        rated_date: null,
    };
}

export async function findEntityByTmdbId(id: string, type: string): Promise<MediaEntity | null> {
    const query = new URLSearchParams({ language: 'zh' });
    const externalIds = await apiFetch<{ imdb_id?: string }>(
        `tmdb/3/${encodeURIComponent(type)}/${encodeURIComponent(id)}/external_ids?${query}`,
    );
    return externalIds.imdb_id ? findEntityByImdbId(externalIds.imdb_id) : null;
}
