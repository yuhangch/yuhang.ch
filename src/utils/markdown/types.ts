export interface MarkdownDocument {
    title?: string;
    description?: string;
    body: string;
    canonicalUrl?: string;
}

export interface MarkdownRendererContext {
    request: Request;
    url: URL;
    locale: string;
    params: Record<string, string | undefined>;
}

export type MarkdownRenderer = (
    context: MarkdownRendererContext,
) => Promise<MarkdownDocument | null>;
