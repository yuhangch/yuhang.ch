import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel'
import { fileURLToPath } from 'node:url'
import { unified } from '@astrojs/markdown-remark'

import UnoCSS from '@unocss/astro'
import remarkWikiLink from "./src/plugins/wiki-link/index.ts";
import { getPermalinks } from "./src/plugins/wiki-link/getPermalinks.ts";
import yaml from '@rollup/plugin-yaml'
import expressiveCode from 'astro-expressive-code'

// import nightOwlDark from './src/styles/expressive-code/night-owl-dark.json'
// import nightOwlLight from './src/styles/expressive-code/night-owl-light.json'

import { remarkModifiedTime } from './src/plugins/remark-modified-time.mjs'
import remarkDirective from 'remark-directive'
// rehype-figure
import { RDBilibiliPlugin } from "./src/plugins/remark-directive.mjs";
import { InternalLinkPlugin } from "./src/plugins/remark-internal-link.mjs";
import { remarkWikiLinkLocale } from "./src/plugins/remark-wiki-link-locale.mjs";
import remarkObsidianCallout from './src/plugins/callout/index.js'
import mdx from "@astrojs/mdx";
import remarkFigureCaption from "@microflash/remark-figure-caption";


// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [yaml()],
        resolve: {
            alias: {
                picomatch: fileURLToPath(new URL('./src/shims/picomatch.mjs', import.meta.url)),
            },
        },
    },
    compressHTML: false,
    env: {
        validateSecrets: true,
        schema: {
            API_URL: envField.string({ context: "server", access: "public" }),
            API_SECRET: envField.string({ context: "server", access: "secret" }),
            STUDIO_SECRET: envField.string({ context: "server", access: "secret" }),
            MAPBOX_TOKEN: envField.string({ context: "client", access: "public" }),
            AMAP_KEY: envField.string({ context: "server", access: "secret" }),
        }
    },
    i18n: {
        locales: ['zh', 'en'],
        defaultLocale: 'zh',
        routing: 'manual',
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: 'hover',
    },
    site: 'https://yuhang.ch',
    scopedStyleStrategy: 'where',
    trailingSlash: 'always',
    build: {
        format: 'directory',
        assets: 'assets',
    },
    markdown: {
        processor: unified({
            remarkRehype: {
                footnoteLabel: ' '
            },
            remarkPlugins: [
                remarkModifiedTime, // Run first to set lastModified before other plugins
                remarkDirective,
                remarkFigureCaption,
                // RDNotePlugin,
                [
                    remarkObsidianCallout,
                    {
                        blockquoteClass: 'callout',
                        titleTextTagName: "span",
                        iconTagName: "span",
                        // ...
                    },
                ],
                RDBilibiliPlugin,
                InternalLinkPlugin,
                [remarkWikiLink, {
                    permalinks: getPermalinks("src/content/"),
                    pathFormat: "obsidian-short",
                    hrefTemplate: (permalink) => {
                        const href = permalink.replaceAll("src/content/", "/") + '/';
                        if (!href.startsWith('/'))
                            return '/' + href;
                        return href;
                    }
                }],
                remarkWikiLinkLocale,
            ],
        }),
        syntaxHighlight: false,
    },

    integrations: [

        UnoCSS(),
        expressiveCode({
            themes: ['dracula-soft', 'snazzy-light'],
            themeCssSelector: (theme) => {
                return '.' + theme.type
            }
        }),
        mdx({
            extendMarkdownConfig: true, // Ensure MDX inherits markdown config including remark plugins
        }),
    ],
    output: 'server',
    adapter: vercel({
        // functionPerRoute: false
    })
});
