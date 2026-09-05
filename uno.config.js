/**
 * UnoCSS Configuration
 * 
 * This file handles simple prose typography extensions via presetTypography.
 * 
 * Note: Complex prose styles (links with internal/external handling, blockquote containers,
 * callout components, and the shimmer keyframes) are handled in src/styles/content.css.
 * 
 * This config focuses on:
 * - Reusable prose typography and media styling
 * - Code block and inline code styling
 * - List, footnote, and blockquote paragraph styling
 * 
 * Do NOT add 'a' tag styles here - they are handled by content.css with complex selectors.
 */
import { defineConfig, presetMini, presetTypography, transformerDirectives } from 'unocss'

export default defineConfig({
    injectReset: false,
    mode: 'per-module',
    injectEntry: process.env['NODE_ENV'] === 'development',
    transformers: [transformerDirectives()],
    preflights: [
        {
            layer: 'default',
            getCSS: () => `
:root {
    --color-code-bg: #f5f5f5;
}

:root.dark {
    --color-code-bg: #1a202c;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.prose pre,
.prose code,
.prose kbd,
.prose samp {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
    font-variant-ligatures: none;
}

.prose pre,
.prose p code,
.prose li code,
.prose blockquote code,
.prose kbd,
.prose samp {
    border-radius: 0.2em;
    background-color: var(--color-code-bg);
}

.prose ol > li::marker {
    color: rgb(var(--color-primary-main));
    margin-right: 1rem;
    font-weight: 600;
}

.prose ul > li::marker {
    color: rgb(var(--color-primary-main));
    margin-right: 1rem;
    font-weight: 600;
}

.prose summary::marker {
    color: rgb(var(--color-primary-main));
    margin-right: 1rem;
    font-weight: 600;
}
`,
        },
    ],
    presets: [
        presetMini(),
        presetTypography({
            cssExtend: {
                // Paragraph and media typography
                'article > p': {
                    'text-align': 'justify',
                    'text-indent': '2rem',
                },
                'img': {
                    'max-width': '100%',
                    height: 'auto',
                },
                'figure': {
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    'justify-content': 'center',
                    margin: '1.5rem auto',
                    'text-align': 'center',
                },
                'figure img': {
                    'border-radius': '0.5rem',
                    'box-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    'max-width': '100%',
                    'max-height': '16rem',
                    width: 'auto',
                    height: '200px',
                    display: 'block',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    'background-size': '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    'object-fit': 'cover',
                },
                'figcaption': {
                    'margin-top': '0.5rem',
                    'font-size': '0.875rem',
                    'font-style': 'italic',
                    color: 'rgb(var(--color-text-heading))',
                },
                '[data-footnote-ref]::before': {
                    content: "' ['",
                },
                '[data-footnote-ref]::after': {
                    content: "'] '",
                },
                '[data-footnote-backref]': {
                    'text-decoration': 'none',
                },
                '[data-footnote-ref]': {
                    'font-weight': '400',
                    'text-decoration': 'none',
                },
                // List item word-break handling
                'li': {
                    'word-break': 'break-all',
                },
                // Code styling in lists
                'li code': {
                    'white-space': 'pre-wrap',
                    'word-break': 'break-word',
                    'margin': '0.2rem',
                    'padding': '0.15em 0.3em',
                },
                'li code::after': {
                    content: 'none'
                },
                'li code::before': {
                    content: 'none'
                },
                // General code block styling
                'pre,code,kbd,samp': {
                    'white-space': 'pre-wrap',
                    'word-break': 'break-word',
                    margin: '0.2rem',
                    padding: '0.15em 0.3em',
                },
                'p code::after': {
                    content: 'none'
                },
                'p code::before': {
                    content: 'none'
                },
                // Blockquote content styling (container styles are in content.css)
                'blockquote p': {
                    'word-break': 'break-all',
                    'margin': '0',
                    'font-size': '0.875rem',
                },
                'blockquote code': {
                    'white-space': 'pre-wrap',
                    'word-break': 'break-word',
                    'margin': '0.2rem',
                    'padding': '0.15em 0.3em',
                }
            }
        })
    ]
})
