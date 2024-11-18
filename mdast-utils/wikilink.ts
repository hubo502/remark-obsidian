import { RemarkObsidianOptions } from "..";
import { WikiLink } from "../types";
import { Link, Parent } from "mdast";
import { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

export interface BetterLink extends Link {
  data: {
    hProperties: {
      target?: "_blank" | "_self" | undefined;
      rel?: "nofollow" | undefined;
    };
  };
}

export const isAbsoluteUrl = (url: string): boolean => {
  const formatedUrl = url.toLowerCase();
  return formatedUrl.startsWith("http") || formatedUrl.startsWith("https");
};

export function handleWikiLink(node: WikiLink, options: RemarkObsidianOptions): MdxJsxFlowElement | BetterLink | Parent {
  const { useJSXLink, permalinks } = options;
  const { url, title } = node;
  const external = isAbsoluteUrl(url);

  let href: string;

  if (external) {
    href = url;
  } else {
    if (!permalinks[url]) {
      console.warn(`[page not found] ${url}`);
    }
    href = permalinks[url] ?? null;
  }

  function EmptyLink() {
    return {
      type: "empty-link",
      data: {
        hName: "span",
        hProperties: {
          class: "not-found",
        },
      },
      children: [{ type: "text", value: title ?? url }],
    } as Parent;
  }

  function JSXLink(): MdxJsxFlowElement {
    return {
      type: "mdxJsxFlowElement",
      name: "Link",
      attributes: [
        {
          type: "mdxJsxAttribute",
          name: "href",
          value: href,
        },
        {
          type: "mdxJsxAttribute",
          name: "children",
          value: title ?? url,
        },
      ],
    } as MdxJsxFlowElement;
  }

  function NormalLink(): BetterLink {
    return {
      type: "link",
      url: href,
      data: {
        hName: "a",
        hProperties: {
          target: external ? "_blank" : "_self",
          rel: external ? "nofollow" : undefined,
        },
      },
      children: [{ type: "text", value: title ?? href }],
    } as BetterLink;
  }

  if (!href) {
    return EmptyLink();
  }

  return useJSXLink ? JSXLink() : NormalLink();
}
