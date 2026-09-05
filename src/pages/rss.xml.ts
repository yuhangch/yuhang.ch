import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import MarkdownIt from 'markdown-it';
import zh from '../locales/zh.yml';
import en from '../locales/en.yml';
import { getLocalePath, type Locale } from '../utils/locale';

export const prerender = false;

const parser = new MarkdownIt();

export const GET: APIRoute = async ({ locals }) => {
    const locale: Locale = locals.locale;
    const collectionName = locale === 'en' ? 'posts-en' : 'posts';
    const messages = locale === 'en' ? en : zh;
    const blog = await getCollection(
        collectionName,
        (entry) => Boolean(entry.data.title && !entry.data.isDraft && entry.data.pubDate),
    );
    const posts = blog
        .sort((a, b) => Number(b.data.pubDate) - Number(a.data.pubDate))
        .map((post) => ({
            ...post.data,
            link: getLocalePath(locale, `/posts/${post.id}/`),
            pubDate: post.data.pubDate,
            content: parser.render(post.data.description ?? post.body ?? ''),
        }));

    return rss({
        title: messages.layout.title,
        description: messages.layout.description,
        site: 'https://yuhang.ch',
        items: posts,
    });
};
