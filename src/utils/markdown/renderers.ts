import { getCollection, getEntry } from 'astro:content';
import { getLocale, getLocaleUrl } from 'astro-i18n-aut';
import { projects, stacks } from '../../data/whois';
import { momentLoader, momentsLoader } from '../../loaders/moments';
import { placesLoader } from '../../loaders/places';
import { reviewsLoader } from '../../loaders/reviews';
import { getAllPosts, getPostsCollectionName } from '../content';
import {
    bullet,
    entryToMarkdown,
    findEntry,
    formatDate,
    markdownLink,
} from './content';
import { markdownError, markdownResponse } from './response';
import type {
    MarkdownDocument,
    MarkdownRenderer,
    MarkdownRendererContext,
} from './types';

type RouteMatch = Record<string, string | undefined>;

interface MarkdownRoute {
    match: (pathname: string) => RouteMatch | null;
    render: MarkdownRenderer;
}

const normalizedPath = (pathname: string): string => {
    const value = pathname.replace(/\/+$/, '');
    return value || '/';
};

const localPath = (url: URL, locale: string): string => {
    const pathname = normalizedPath(url.pathname);
    if (locale === 'en' && (pathname === '/en' || pathname.startsWith('/en/'))) {
        return normalizedPath(pathname.slice('/en'.length));
    }
    return pathname;
};

const localizedUrl = (path: string, locale: string): string =>
    getLocaleUrl(path.endsWith('/') ? path : `${path}/`, locale);

const postListMarkdown = (
    posts: Array<{ year: string; list: Array<Record<string, unknown>> }>,
    tags: Set<string>,
    locale: string,
    title: string,
    filter?: string,
): string => {
    const output: string[] = [`# ${title}`, ''];

    if (filter) output.push(`> Filter: ${filter}`, '');

    for (const year of posts) {
        output.push(`## ${year.year}`, '');
        for (const post of year.list) {
            const postTitle = post.title ?? post['title-en'] ?? post.url ?? 'Untitled';
            const url = localizedUrl(String(post.url), locale);
            output.push(`- ${formatDate(post.pubDate)} — ${markdownLink(postTitle, url)}`);
        }
        output.push('');
    }

    if (tags.size > 0) {
        output.push('## Tags', '');
        output.push(
            [...tags]
                .sort()
                .map((tag) => markdownLink(`#${tag}`, localizedUrl(`/tags/${tag.replace(/\s/g, '-')}`, locale)))
                .join(' · '),
            '',
        );
    }

    return output.join('\n').trimEnd() + '\n';
};

const renderPostCollection = async (
    context: MarkdownRendererContext,
    tag = '',
    category = '',
    title = '',
): Promise<MarkdownDocument> => {
    const result = await getAllPosts(context.locale, tag, category);
    const pageTitle = title || (context.locale === 'en' ? 'Posts' : '随笔');
    return {
        title: pageTitle,
        body: postListMarkdown(result.posts, result.tags, context.locale, pageTitle, tag || category),
        canonicalUrl: context.url.toString(),
    };
};

const renderPost = async (context: MarkdownRendererContext): Promise<MarkdownDocument | null> => {
    const slug = (context.params.slug ?? '').replace(/\.(md|mdx)$/, '');
    const collection = await getCollection(getPostsCollectionName(context.locale));
    const entry = findEntry(collection, slug);
    if (!entry) return null;

    return {
        title: String(entry.data.title ?? slug),
        body: entryToMarkdown(entry),
        canonicalUrl: localizedUrl(`/posts/${slug}`, context.locale),
    };
};

const renderHome = (context: MarkdownRendererContext) =>
    renderPostCollection(context);

const renderCategory = (context: MarkdownRendererContext) => {
    const category = decodeURIComponent(context.params.category ?? '');
    return renderPostCollection(context, '', category, `Category: ${category}`);
};

const renderTag = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const requestedTag = decodeURIComponent(context.params.tag ?? '').replace(/-/g, ' ');
    const collection = await getCollection(getPostsCollectionName(context.locale));
    const actualTag = collection
        .flatMap((entry) => entry.data.tags ?? [])
        .find((tag) => tag.replace(/\s/g, '-').toLowerCase() === (context.params.tag ?? '').toLowerCase())
        ?? requestedTag;

    return renderPostCollection(context, actualTag, '', `Tag: ${actualTag}`);
};

const renderDoc = async (context: MarkdownRendererContext): Promise<MarkdownDocument | null> => {
    const slug = context.params.slug ?? '';
    const entry = await getEntry('docs', slug);
    if (!entry) return null;

    return {
        title: String(entry.data.title ?? slug),
        body: entryToMarkdown(entry),
        canonicalUrl: localizedUrl(`/docs/${slug}`, context.locale),
    };
};

const renderDocsHome = async (context: MarkdownRendererContext): Promise<MarkdownDocument | null> => {
    const home = await getEntry('docs', 'home');
    if (!home) return null;

    const navigation = [
        ['折腾笔记', '/tech/'],
        ['阅读印象', '/read/'],
        ['潦草生活', '/life/'],
        ['不懂艺术', '/have-fun/'],
    ] as const;
    const body = [
        entryToMarkdown(home),
        '',
        '## Navigation',
        '',
        ...navigation.map(([label, path]) => `- ${markdownLink(label, localizedUrl(`/docs${path}`, context.locale))}`),
        '',
    ].join('\n');

    return { title: String(home.data.title ?? 'Docs'), body };
};

const renderWhois = async (context: MarkdownRendererContext): Promise<MarkdownDocument | null> => {
    const entries = await getCollection('whois');
    const preferredLang = context.locale === 'en' ? 'en' : 'zh';
    const entry = entries.find((item) => item.data?.lang === preferredLang)
        ?? entries.find((item) => item.data?.lang === 'zh')
        ?? entries[0];
    if (!entry) return null;

    const body = [
        entryToMarkdown(entry),
        '',
        '## Projects',
        '',
        ...projects.map((item) => `- **${item.name}** — ${item.description} ([Open](${item.href}))`),
        '',
        '## Stacks',
        '',
        ...stacks.map((item) => `- **${item.name}** — ${item.description} ([Open](${item.href}))`),
        '',
    ].join('\n');

    return { title: context.locale === 'en' ? 'Whois' : '个人', body };
};

const value = (item: Record<string, unknown>, key: string): unknown => item[key];

const momentMarkdown = (moment: Record<string, unknown>, locale: string): string => {
    const id = value(moment, 'id');
    const title = value(moment, locale === 'en' ? 'title_en' : 'title')
        ?? value(moment, locale === 'en' ? 'name_en' : 'name');
    const lines = [
        `### ${markdownLink(`#${id}`, localizedUrl(`/moments/${id}`, locale))}${title ? ` — ${title}` : ''}`,
        '',
        bullet('Date', value(moment, 'created_at')),
        bullet('Location', value(moment, 'location')),
        bullet('Tags', value(moment, 'tags')),
        bullet('Image', value(moment, 'image')),
        bullet('IMDB', value(moment, 'imdb_id') ? `https://www.imdb.com/title/${value(moment, 'imdb_id')}` : ''),
        '',
        String(value(moment, 'body') ?? ''),
        '',
    ];
    return lines.filter((line) => line !== '').join('\n');
};

const renderMoments = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const page = Number(context.params.page ?? 1);
    const result = await momentsLoader(page).load();
    const moments = (result?.moments ?? []) as Array<Record<string, unknown>>;
    const body = [
        `# ${context.locale === 'en' ? 'Moments' : '闲话'}`,
        '',
        ...moments.map((moment) => momentMarkdown(moment, context.locale)),
        '',
        result?.prev ? `- [Previous](${localizedUrl(result.prev === 1 ? '/moments' : `/moments/p/${result.prev}`, context.locale)})` : '',
        result?.next ? `- [Next](${localizedUrl(`/moments/p/${result.next}`, context.locale)})` : '',
        '',
    ].filter(Boolean).join('\n');
    return { title: context.locale === 'en' ? 'Moments' : '闲话', body };
};

const renderMoment = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const moment = await momentLoader(context.params.id ?? '').load();
    return {
        title: `${context.locale === 'en' ? 'Moment' : '闲话'} #${context.params.id}`,
        body: `# ${context.locale === 'en' ? 'Moment' : '闲话'} #${context.params.id}\n\n${momentMarkdown(moment, context.locale)}\n`,
    };
};

const reviewMarkdown = (review: Record<string, unknown>, locale: string): string => {
    const title = value(review, locale === 'en' ? 'title_en' : 'title') ?? 'Untitled';
    const imdbId = value(review, 'imdb_id');
    const lines = [
        `### ${title}`,
        '',
        bullet('Rating', value(review, 'rating')),
        bullet('Date', formatDate(value(review, 'rated_date'))),
        imdbId ? `- **IMDB**: ${markdownLink('Open', `https://www.imdb.com/title/${imdbId}`)}` : '',
        value(review, 'moments_id') ? `- **Moment**: ${markdownLink(`#${value(review, 'moments_id')}`, localizedUrl(`/moments/${value(review, 'moments_id')}`, locale))}` : '',
        '',
    ];
    return lines.filter(Boolean).join('\n');
};

const renderReviews = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const page = Number(context.params.page ?? 1);
    const result = await reviewsLoader(page, '').load();
    const reviews = (result?.reviews ?? []) as Array<Record<string, unknown>>;
    const body = [
        `# ${context.locale === 'en' ? 'Reviews' : '评论'}`,
        '',
        ...reviews.map((review) => reviewMarkdown(review, context.locale)),
        '',
        result?.prev ? `- [Previous](${localizedUrl(result.prev === 1 ? '/reviews' : `/reviews/p/${result.prev}`, context.locale)})` : '',
        result?.next ? `- [Next](${localizedUrl(`/reviews/p/${result.next}`, context.locale)})` : '',
        '',
    ].filter(Boolean).join('\n');
    return { title: context.locale === 'en' ? 'Reviews' : '评论', body };
};

const typeNames: Record<string, string> = {
    restaurant: '餐厅',
    attraction: '景点',
    hotel: '酒店',
    cafe: '咖啡',
    shop: '商场',
};

const placeMarkdown = (place: Record<string, unknown>, locale: string): string => {
    const momentsId = value(place, 'moments_id');
    return [
        `### ${value(place, locale === 'en' ? 'name_en' : 'name') ?? value(place, 'name') ?? 'Unnamed place'}`,
        '',
        bullet('Type', typeNames[String(value(place, 'type'))] ?? value(place, 'type')),
        bullet('Location', value(place, 'location')),
        bullet('Rating', value(place, 'rating')),
        bullet('Visit date', value(place, 'visit_date')),
        bullet('Description', value(place, 'description')),
        bullet('Coordinates', value(place, 'coordinates')),
        bullet('Photos', value(place, 'photos')),
        momentsId ? `- **Moment**: ${markdownLink(`#${momentsId}`, localizedUrl(`/moments/${momentsId}`, locale))}` : '',
        '',
    ].filter(Boolean).join('\n');
};

const renderPlaces = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const places = (await placesLoader().load()) as Array<Record<string, unknown>>;
    return {
        title: context.locale === 'en' ? 'Places' : '吃喝玩乐',
        body: [
            `# ${context.locale === 'en' ? 'Places' : '吃喝玩乐'}`,
            '',
            `Total: ${places.length}`,
            '',
            ...places.map((place) => placeMarkdown(place, context.locale)),
            '',
        ].join('\n'),
    };
};

const renderFootprint = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => ({
    title: context.locale === 'en' ? 'Footprint' : '足迹',
    body: `# ${context.locale === 'en' ? 'Footprint' : '足迹'}\n\nThis page currently contains an interactive globe.\n`,
});

const renderGallery = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => ({
    title: context.locale === 'en' ? 'Gallery' : '随拍',
    body: `# ${context.locale === 'en' ? 'Gallery' : '随拍'}\n\nNo gallery items are available yet.\n`,
});

const prefixMatch = (prefix: string, pathname: string): RouteMatch | null => {
    if (!pathname.startsWith(`${prefix}/`)) return null;
    return { slug: decodeURIComponent(pathname.slice(prefix.length + 1)) };
};

const routes: MarkdownRoute[] = [
    { match: (pathname) => (pathname === '/' ? {} : null), render: renderHome },
    { match: (pathname) => prefixMatch('/posts', pathname), render: renderPost },
    { match: (pathname) => (pathname === '/docs' ? {} : null), render: renderDocsHome },
    { match: (pathname) => prefixMatch('/docs', pathname), render: renderDoc },
    { match: (pathname) => (pathname === '/whois' ? {} : null), render: renderWhois },
    { match: (pathname) => prefixMatch('/categories', pathname) ? { category: prefixMatch('/categories', pathname)?.slug } : null, render: renderCategory },
    { match: (pathname) => prefixMatch('/tags', pathname) ? { tag: prefixMatch('/tags', pathname)?.slug } : null, render: renderTag },
    { match: (pathname) => (pathname === '/moments' ? {} : null), render: renderMoments },
    { match: (pathname) => prefixMatch('/moments/p', pathname) ? { page: prefixMatch('/moments/p', pathname)?.slug } : null, render: renderMoments },
    { match: (pathname) => prefixMatch('/moments', pathname) ? { id: prefixMatch('/moments', pathname)?.slug } : null, render: renderMoment },
    { match: (pathname) => (pathname === '/reviews' ? {} : null), render: renderReviews },
    { match: (pathname) => prefixMatch('/reviews/p', pathname) ? { page: prefixMatch('/reviews/p', pathname)?.slug } : null, render: renderReviews },
    { match: (pathname) => (pathname === '/places' ? {} : null), render: renderPlaces },
    { match: (pathname) => (pathname === '/footprint' ? {} : null), render: renderFootprint },
    { match: (pathname) => (pathname === '/gallery' ? {} : null), render: renderGallery },
];

export async function renderMarkdownRequest(request: Request, url: URL): Promise<Response | null> {
    const locale = getLocale(url) || 'zh';
    const pathname = localPath(url, locale);
    const route = routes.find((candidate) => candidate.match(pathname));
    if (!route) return null;

    const params = route.match(pathname) ?? {};
    try {
        const document = await route.render({ request, url, locale, params });
        if (!document) return markdownError('The requested resource was not found.', 404);
        return markdownResponse(document);
    } catch (error) {
        console.error(`[markdown] Failed to render ${url.pathname}:`, error);
        return markdownError('The requested resource is temporarily unavailable.', 503);
    }
}
