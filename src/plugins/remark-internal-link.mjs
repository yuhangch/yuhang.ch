import {visit} from "unist-util-visit";

export function InternalLinkPlugin() {
    return (tree) => {
        visit(tree, (node) => {
            if (
                node.type === 'link'
            ) {
                if (node.attributes && node.attributes.class.includes('internal')) return;
                // if href start with /, it is internal link

                if (node.url.startsWith('/')) {
                    // add class
                    const data = node.data || (node.data = {})
                    data.hProperties = {
                        class: 'internal'
                    }
                }
            }
        })

    }
}