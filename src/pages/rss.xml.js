import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { getLocale, getLocaleUrl } from 'astro-i18n-aut'
import MarkdownIt from 'markdown-it'
import zh from '../locales/zh.yml'
import en from '../locales/en.yml'
export const prerender = true;

const parser = new MarkdownIt()

export async function GET(context) {
    // Determine locale from URL
    const locale = getLocale(context.url) || 'zh';
    const collectionName = locale === 'en' ? 'posts-en' : 'posts';
    const messages = locale === 'en' ? en : zh;
    
    const blog = await getCollection(collectionName, (i)=>i.data.title && !i.data.isDraft && i.data.pubDate)
    const posts = blog
        .sort((a, b) => (a.data.pubDate < b.data.pubDate ? 1 : -1))
        .map((post) => {
            const content = post.data.description || post.body
            const html = parser.render(content)
            return {
                ...post.data,
                link: getLocaleUrl(`/posts/${post.id}/`, locale),
                pubDate: post.data.pubDate,

                content: html
            }
        })
    return new Response(
        (
            await rss({
                title: messages.layout.title,
                description: messages.layout.description,
                site: 'https://yuhang.ch',
                items: posts,
            })
        ).body,
        {
            headers: {
                'content-type': 'application/xml'
            }
        }
    )
}
