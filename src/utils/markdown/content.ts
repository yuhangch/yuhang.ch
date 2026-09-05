import { stringify } from 'yaml';

export function serializeFrontmatter(frontmatter: Record<string, unknown>): string {
    return stringify(frontmatter, { lineWidth: 0 }).trimEnd();
}

export function entryToMarkdown(entry: {
    body?: string;
    data: Record<string, unknown>;
}): string {
    const frontmatter = serializeFrontmatter(entry.data);
    const body = entry.body ?? '';

    return `---\n${frontmatter}\n---\n\n${body}`;
}

export function entryExtension(entry: { filePath?: string }): 'md' | 'mdx' {
    return entry.filePath?.toLowerCase().endsWith('.md') ? 'md' : 'mdx';
}

export function findEntry<T extends { id: string }>(entries: T[], slug: string): T | undefined {
    return entries.find((entry) => entry.id === slug || entry.id.endsWith(`/${slug}`));
}

export function formatDate(value: unknown): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
    return value == null ? '' : String(value);
}

export function markdownLink(label: unknown, href: string): string {
    return `[${String(label)}](${href})`;
}

export function bullet(label: string, value: unknown): string {
    if (value == null || value === '') return '';
    const rendered = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
    return `- **${label}**: ${rendered}`;
}
