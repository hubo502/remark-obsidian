import { visit } from "unist-util-visit";
import { Parent, Node as TreeNode } from "unist";
import { fetchEmbedContent } from "./utils";
import { Code, Heading, Image, Table, ThematicBreak } from "mdast";
import { Audio, Video, WikiLink } from "./types";
import { wikiLinkFromMarkdown, wikiLinkSyntax } from "./wikilink";
import { handleAudio, handleImage, handleVideo, handleWikiLink, handleFigure, handleFAQ, handleAdmonition } from "./mdast-utils";
import { MdastFigure } from "./mdast-utils/figure";
import { highlightFromMarkdown, highlightSyntax } from "./highlight";

export type RemarkObsidianOptions = {
  markdownRoot: string;
  publicRoot: string;
  mediaFolder: string;
  imageMaxWidth: number;
  permalinks: Record<string, string>;
  useJSXLink: boolean;
};

export function handleObsidian(options: RemarkObsidianOptions) {
  return (tree: TreeNode) => {
    visit(tree, "table", (node: Table, index, parent: Parent) => {
      parent.children.splice(index, 1, { children: [node], data: { hName: "div", hProperties: { class: "table-wrapper" } } } as any);
      return;
    });

    visit(tree, "code", (node: Code, index, parent: Parent) => {
      if (node.lang?.toLowerCase() === "faq") {
        parent.children.splice(index, 1, handleFAQ(node.value, options));
        return;
      }

      if (node.lang && node.lang.indexOf("ad-") >= 0) {
        parent.children.splice(index, 1, handleAdmonition(node, options));
      }

      return;
    });

    visit(tree, "wikilink", (node: WikiLink, index, parent: Parent) => {
      const { embed, title, url } = node;
      if (embed) {
        const embedContent = fetchEmbedContent(url, options, title);

        if (embedContent) {
          if (Array.isArray(embedContent)) {
            parent.children.splice(index, 1, ...embedContent);
            parent.data = { hName: "div", hProperties: { class: "ref" } };
          } else {
            parent.children.splice(index, 1, embedContent);
          }
        }
      } else {
        const link = handleWikiLink(node, options);
        parent.children.splice(index, 1, link);
      }
    });

    visit(tree, "image", (node: Image, index, parent: Parent) => {
      parent.children.splice(index, 1, handleImage(node, options));
    });

    visit(tree, "audio", (node: Audio, index, parent: Parent) => {
      parent.children.splice(index, 1, handleAudio(node, options));
    });

    visit(tree, "video", (node: Video, index, parent: Parent) => {
      parent.children.splice(index, 1, handleVideo(node, options));
    });

    visit(tree, "figure", (node: MdastFigure, index, parent: Parent) => {
      parent.children = handleFigure(node, options);
      parent.data = { hName: "figure" };
    });

    visit(tree, "heading", (node: Heading, index, parent: Parent) => {
      if (node.depth === 2) {
        if (index === 0) return;
        if (["thematicBreak", "yaml"].includes(parent.children[index - 1].type)) return;
        parent.children.splice(index, 0, { type: "thematicBreak" } as ThematicBreak);
      }
    });
  };
}

function remarkObsidian(this: any, options: RemarkObsidianOptions) {
  const data = this ? this.data() : {};

  function add(field: any, value: any) {
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }

  add("micromarkExtensions", wikiLinkSyntax());
  add("micromarkExtensions", highlightSyntax());
  add("fromMarkdownExtensions", wikiLinkFromMarkdown());
  add("fromMarkdownExtensions", highlightFromMarkdown());

  return handleObsidian(options);
}

export default remarkObsidian;
