# Yuhang Chen’s Personal Blog (yuhang.ch)

This is **Yuhang Chen’s personal blog and digital garden**, built with Astro and deployed on Vercel.
It is a personal-use project where I publish long-form posts, notes, and a few small experiments.

For a more detailed overview of the stack and architecture,
see the internal doc at `src/content/docs/overview/tech-stack.md`.

## Tech stack (short version)

- **Framework**: Astro 7.3.1 (server output, deployed on Vercel)
- **Content**: Collections under `src/content` (`posts`, `posts-en`, `docs`, `whois`, etc.)
- **Markdown**: Explicit Unified pipeline via `@astrojs/markdown-remark`, with the project's remark plugins
- **Styling**: UnoCSS, Expressive Code, custom typography / prose styles
- **i18n**: Astro official i18n with manual routing (`/` is Chinese and `/en/` is English)
- **Live data**: Typed API services and Live Collections for Moments, Reviews, and Places
- **Mutations**: Astro Actions with Zod validation, Studio authentication, and explicit `ActionError`s
- **Runtime**: Node 22.x + `@astrojs/vercel` adapter

## Development

> This project currently targets Node **22.22.0** (see `.node-version`).
> Use `fnm` / `nvm` to switch to the correct version if needed.

Using `pnpm` (recommended):

```bash
pnpm install
pnpm dev
pnpm astro check
pnpm build
```

Copy `.env.example` to `.env` and fill in the server secrets before using Studio or live API pages.

`API_SECRET`, `STUDIO_SECRET`, and `AMAP_KEY` are server-only secrets. `MAPBOX_TOKEN` is intentionally a public client variable because it is used by the browser map.


## License

- All **code in this repository** (unless otherwise noted) is licensed under the [MIT License](./LICENSE).
- All **written content** (blog posts, essays, notes, etc.) is licensed under  
  **Creative Commons Attribution‑NonCommercial‑NoDerivatives 4.0 International (CC BY‑NC‑ND 4.0)**.  
  See <https://creativecommons.org/licenses/by-nc-nd/4.0/> for details; when quoting, please keep a link to `https://yuhang.ch`.
