import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import { zapIcon, listIcon, quoteIcon, bugIcon, infoIcon, xIcon, helpCircleIcon, alertTriangleIcon, pencilIcon, clipboardListIcon, checkCircleIcon, flameIcon, checkIcon, } from "./icons.js";
/**
 * Default configuration
 * @date 3/23/2023 - 5:16:26 PM
 *
 * @type {Config}
 */
const defaultConfig = {
    dataAttribute: "callout",
    blockquoteClass: undefined,
    titleClass: "callout-title",
    titleTextTagName: "div",
    titleTextClass: "callout-title-text",
    titleTextTransform: (title) => title.trim(),
    iconTagName: "div",
    iconClass: "callout-title-icon",
    contentClass: "callout-content",
    callouts: {
        note: pencilIcon,
        abstract: clipboardListIcon,
        summary: clipboardListIcon,
        tldr: clipboardListIcon,
        info: infoIcon,
        todo: checkCircleIcon,
        tip: flameIcon,
        hint: flameIcon,
        important: flameIcon,
        success: checkIcon,
        check: checkIcon,
        done: checkIcon,
        question: helpCircleIcon,
        help: helpCircleIcon,
        faq: helpCircleIcon,
        warning: alertTriangleIcon,
        attention: alertTriangleIcon,
        caution: alertTriangleIcon,
        failure: xIcon,
        missing: xIcon,
        fail: xIcon,
        danger: zapIcon,
        error: zapIcon,
        bug: bugIcon,
        example: listIcon,
        quote: quoteIcon,
        cite: quoteIcon,
    },
};
const REGEX = /^\[\!(\w+)\]([+-]?)/;
/**
 * Check if the str is a valid callout type
 * @date 3/23/2023 - 5:16:26 PM
 *
 * @param {Callout} obj
 * @param {string} str
 * @returns {boolean}
 */
const memoizedContainsKey = memoize((obj, str) => Object.keys(obj).includes(str.toLowerCase()));
function memoize(fn) {
    const cache = new Map();
    return ((...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    });
}
/**
 * This is a remark plugin that parses Obsidian's callout syntax, and adds custom data attributes and classes to the HTML elements for further customizations.
 * @date 3/23/2023 - 5:16:26 PM
 *
 * @param {?Partial<Config>} [customConfig]
 * @returns {(tree: Node) => void}
 */
const plugin = (customConfig) => {
    const mergedConfig = {
        ...defaultConfig,
        ...customConfig,
        callouts: {
            ...defaultConfig.callouts,
            ...customConfig?.callouts,
        },
    };
    const { dataAttribute, blockquoteClass, titleClass, iconTagName, iconClass, contentClass, callouts, titleTextClass, titleTextTagName, titleTextTransform, } = mergedConfig;
    return function (tree) {
        visit(tree, "blockquote", (node) => {
            if (!("children" in node) || node.children.length == 0)
                return;
            const firstChild = node.children[0];
            if (firstChild.type === "paragraph") {
                const value = toString(firstChild);
                const [firstLine, ...remainingLines] = value.split("\n");
                const remainingContent = remainingLines.join("\n");
                const matched = firstLine.match(REGEX);
                if (matched) {
                    const array = REGEX.exec(firstLine);
                    const calloutType = array?.at(1);
                    const expandCollapseSign = array?.at(2);
                    if (array && calloutType) {
                        let icon;
                        let validCalloutType;
                        if (memoizedContainsKey(callouts, calloutType)) {
                            icon = callouts[calloutType.toLowerCase()];
                            validCalloutType = calloutType.toLowerCase();
                        }
                        else {
                            console.warn(`Callout type ${calloutType} is not supported, using default icon for note instead.`);
                            icon = callouts.note;
                            validCalloutType = "note";
                        }
                        const title = array.input.slice(matched[0].length).trim();
                        const titleHtmlNode = {
                            type: "html",
                            data: {},
                            value: `
                <div class="${titleClass}">
                  <${iconTagName} class="${iconClass}">${icon}</${iconTagName}>
                  ${title &&
                                `<${titleTextTagName} class="${titleTextClass}">${titleTextTransform(title)}</${titleTextTagName}>`}
                </div>
                ${remainingContent && `<div class="${contentClass}">${remainingContent}</div>`}
              `,
                        };
                        node.children.splice(0, 1, titleHtmlNode);
                        const dataExpandable = Boolean(expandCollapseSign);
                        const dataExpanded = expandCollapseSign === "+";
                        node.data = {
                            hProperties: {
                                ...((node.data && node.data.hProperties) || {}),
                                className: blockquoteClass || `${dataAttribute}-${validCalloutType}`,
                                [`data-${dataAttribute}`]: validCalloutType,
                                "data-expandable": String(dataExpandable),
                                "data-expanded": String(dataExpanded),
                            },
                        };
                    }
                }
            }
        });
    };
};
export default plugin;
