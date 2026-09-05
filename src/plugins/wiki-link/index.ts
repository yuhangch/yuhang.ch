import {toMarkdown} from "mdast-util-wiki-link";
import {syntax, type SyntaxOptions} from "./syntax.ts";
import {fromMarkdown, type FromMarkdownOptions} from "./fromMarkdown.ts";

let warningIssued = false;

type RemarkWikiLinkOptions = FromMarkdownOptions & SyntaxOptions;

function remarkWikiLink(this: any, opts: RemarkWikiLinkOptions = {}) {
    const data = this.data(); // this is a reference to the processor

    function add(field: string, value: any) {
        if (data[field]) data[field].push(value);
        else data[field] = [value];
    }

    if (
        !warningIssued &&
        ((this.Parser &&
                this.Parser.prototype &&
                this.Parser.prototype.blockTokenizers) ||
            (this.Compiler &&
                this.Compiler.prototype &&
                this.Compiler.prototype.visitors))
    ) {
        warningIssued = true;
        console.warn(
            "[remark-wiki-link] Warning: please upgrade to remark 13 to use this plugin"
        );
    }

    // add extensions to packages used by remark-parse
    // micromark extensions
    add("micromarkExtensions", syntax(opts));
    // mdast-util-from-markdown extensions
    add("fromMarkdownExtensions", fromMarkdown(opts));
    // mdast-util-to-markdown extensions
    add("toMarkdownExtensions", toMarkdown(opts));
}

export default remarkWikiLink;
export {remarkWikiLink};
