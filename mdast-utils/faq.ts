import { Text } from "mdast";
import { RemarkObsidianOptions } from "..";
import { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { fromMarkdown } from "mdast-util-from-markdown";

function composeAttributes(markdown: string): MdxJsxAttribute[] {
  let children: any[] = [];
  let child: any = null;
  let title: string | undefined = undefined;
  const nodes = fromMarkdown(markdown);
  nodes.children.forEach((node) => {
    if (node.type === "heading" && node.children.length) {
      if (node.depth === 1) {
        title = (node.children[0] as Text).value;
      } else {
        if (child) children.push(child);

        child = {
          title: (node.children[0] as Text)?.value,
          content: [],
        };
      }
    } else if (node.type === "paragraph") {
      child.content.push(node.children.map((elm) => (elm as Text).value).join("\n"));
    }
  });

  const attributes: MdxJsxAttribute[] = title ? [{ type: "mdxJsxAttribute", name: "title", value: title }] : [];

  attributes.push({ type: "mdxJsxAttribute", name: "content", value: JSON.stringify(children) });

  return attributes;
}

export function handleFAQ(markdown: string, options?: RemarkObsidianOptions): MdxJsxFlowElement {
  const attributes = composeAttributes(markdown);

  return {
    type: "mdxJsxFlowElement",
    name: "FAQ",
    attributes,
  } as MdxJsxFlowElement;
}
