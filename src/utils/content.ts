import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'> | CollectionEntry<'posts-en'>;

export interface PostListItem {
    id: string;
    url: string;
    title?: string;
    description?: string;
    tags?: string[];
    categories?: string[];
    pubDate: Date;
    lastModified?: Date;
    isDraft?: boolean;
}

export interface PostsByYear {
    year: string;
    list: PostListItem[];
}

export const getPostsCollectionName = (locale: string): 'posts' | 'posts-en' =>
    locale === 'en' ? 'posts-en' : 'posts';

export const getAllPosts = async (
    locale: string,
    tag = '',
    category = '',
): Promise<{ posts: PostsByYear[]; tags: Set<string> }> => {
    const collectionName = getPostsCollectionName(locale);
    const allPosts = await getCollection(collectionName);
    const filteredPosts: PostListItem[] = allPosts
        .filter((entry): entry is PostEntry & { data: PostEntry['data'] & { pubDate: Date } } =>
            !entry.data.isDraft && entry.data.pubDate instanceof Date,
        )
        .filter((entry) => {
            if (tag) return entry.data.tags?.includes(tag) ?? false;
            if (category) return entry.data.categories?.includes(category) ?? false;
            return true;
        })
        .map((entry) => ({
            id: entry.id,
            url: `/posts/${entry.id}/`,
            title: entry.data.title,
            description: entry.data.description,
            tags: entry.data.tags,
            categories: entry.data.categories,
            pubDate: entry.data.pubDate,
            lastModified: entry.data.lastModified,
            isDraft: entry.data.isDraft,
        }))
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    const byYear = new Map<string, PostListItem[]>();
    for (const post of filteredPosts) {
        const year = String(post.pubDate.getFullYear());
        const posts = byYear.get(year) ?? [];
        posts.push(post);
        byYear.set(year, posts);
    }

    const posts = [...byYear.entries()]
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, list]) => ({ year, list }));

    const tags = new Set(filteredPosts.flatMap((post) => post.tags ?? []));
    return { posts, tags };
};
