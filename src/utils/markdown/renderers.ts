import { getCollection, getEntry } from 'astro:content';
import { projects, stacks } from '../../data/whois';
import {
    getMoment,
    getMomentsPage,
    getPlaces,
    getReviewsPage,
    type Moment,
    type Place,
    type Review,
} from '../../services/api';
import { getAllPosts } from '../content';
import { getLocalePath, type Locale } from '../locale';
import type { PostListItem } from '../content';
import { bullet, entryToMarkdown, formatDate, markdownLink } from './content';
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

const localizedUrl = (path: string, locale: MarkdownRendererContext['locale']): string =>
    getLocalePath(locale, path.endsWith('/') ? path : `${path}/`);

const postListMarkdown = (
    posts: Array<{ year: string; list: PostListItem[] }>,
    tags: Set<string>,
    locale: Locale,
    title: string,
    filter?: string,
): string => {
    const output: string[] = [`# ${title}`, ''];

    if (filter) output.push(`> Filter: ${filter}`, '');

    for (const year of posts) {
        output.push(`## ${year.year}`, '');
        for (const post of year.list) {
            const postTitle = post.title ?? post.url ?? 'Untitled';
            const url = localizedUrl(post.url, locale);
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
    const collection = context.locale === 'en'
        ? await getCollection('posts-en')
        : await getCollection('posts');
    const entry = collection.find((item) => item.id === slug || item.id.endsWith(`/${slug}`));
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
    const tags: string[] = context.locale === 'en'
        ? (await getCollection('posts-en')).flatMap((entry) => entry.data.tags ?? [])
        : (await getCollection('posts')).flatMap((entry) => entry.data.tags ?? []);
    const actualTag = tags
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

const momentMarkdown = (moment: Moment, locale: MarkdownRendererContext['locale']): string => {
    const title = (locale === 'en' ? moment.title_en : moment.title)
        ?? (locale === 'en' ? moment.name_en : moment.name);
    const lines = [
        `### ${markdownLink(`#${moment.id}`, localizedUrl(`/moments/${moment.id}`, locale))}${title ? ` — ${title}` : ''}`,
        '',
        bullet('Date', moment.created_at),
        bullet('Location', moment.location),
        bullet('Tags', moment.tags),
        bullet('Image', moment.image),
        bullet('IMDB', moment.imdb_id ? `https://www.imdb.com/title/${moment.imdb_id}` : ''),
        '',
        moment.body,
        '',
    ];
    return lines.filter((line) => line !== '').join('\n');
};

const renderMoments = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const page = Number(context.params.page ?? 1);
    const result = await getMomentsPage(page);
    const moments = result.items;
    const body = [
        `# ${context.locale === 'en' ? 'Moments' : '闲话'}`,
        '',
        ...moments.map((moment) => momentMarkdown(moment, context.locale)),
        '',
        result.prev ? `- [Previous](${localizedUrl(result.prev === 1 ? '/moments' : `/moments/p/${result.prev}`, context.locale)})` : '',
        result.next ? `- [Next](${localizedUrl(`/moments/p/${result.next}`, context.locale)})` : '',
        '',
    ].filter(Boolean).join('\n');
    return { title: context.locale === 'en' ? 'Moments' : '闲话', body };
};

const renderMoment = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const moment = await getMoment(context.params.id ?? '');
    if (!moment) return null;
    return {
        title: `${context.locale === 'en' ? 'Moment' : '闲话'} #${context.params.id}`,
        body: `# ${context.locale === 'en' ? 'Moment' : '闲话'} #${context.params.id}\n\n${momentMarkdown(moment, context.locale)}\n`,
    };
};

const reviewMarkdown = (review: Review, locale: MarkdownRendererContext['locale']): string => {
    const title = (locale === 'en' ? review.title_en : review.title) ?? 'Untitled';
    const imdbId = review.imdb_id;
    const lines = [
        `### ${title}`,
        '',
        bullet('Rating', review.rating),
        bullet('Date', formatDate(review.rated_date)),
        imdbId ? `- **IMDB**: ${markdownLink('Open', `https://www.imdb.com/title/${imdbId}`)}` : '',
        review.moments_id ? `- **Moment**: ${markdownLink(`#${review.moments_id}`, localizedUrl(`/moments/${review.moments_id}`, locale))}` : '',
        '',
    ];
    return lines.filter(Boolean).join('\n');
};

const renderReviews = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const page = Number(context.params.page ?? 1);
    const result = await getReviewsPage(page);
    const reviews = result.items;
    const body = [
        `# ${context.locale === 'en' ? 'Reviews' : '评论'}`,
        '',
        ...reviews.map((review) => reviewMarkdown(review, context.locale)),
        '',
        result.prev ? `- [Previous](${localizedUrl(result.prev === 1 ? '/reviews' : `/reviews/p/${result.prev}`, context.locale)})` : '',
        result.next ? `- [Next](${localizedUrl(`/reviews/p/${result.next}`, context.locale)})` : '',
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

const placeMarkdown = (place: Place, locale: MarkdownRendererContext['locale']): string => {
    const momentsId = place.moments_id;
    return [
        `### ${(locale === 'en' ? place.name_en : place.name) ?? place.name ?? 'Unnamed place'}`,
        '',
        bullet('Type', typeNames[String(place.type)] ?? place.type),
        bullet('Location', place.location),
        bullet('Rating', place.rating),
        bullet('Visit date', place.visit_date),
        bullet('Description', place.description),
        bullet('Coordinates', place.coordinates),
        bullet('Photos', place.photos),
        momentsId ? `- **Moment**: ${markdownLink(`#${momentsId}`, localizedUrl(`/moments/${momentsId}`, locale))}` : '',
        '',
    ].filter(Boolean).join('\n');
};

const renderPlaces = async (context: MarkdownRendererContext): Promise<MarkdownDocument> => {
    const places = await getPlaces();
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

export async function renderMarkdownRequest(
    request: Request,
    url: URL,
    locale: MarkdownRendererContext['locale'],
): Promise<Response | null> {
    const pathname = normalizedPath(url.pathname);
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
