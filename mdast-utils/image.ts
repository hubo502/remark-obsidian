import { Image } from "mdast";
import { RemarkObsidianOptions } from "..";
import { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { sync } from "probe-image-size";
import fs from "fs-extra";

export function handleImage(node: Image, options: RemarkObsidianOptions): MdxJsxFlowElement {
  const { imageMaxWidth: max_width, publicRoot } = options;
  const { url, title, alt } = node;
  const target = `${publicRoot}${url}`;

  const dimensions = sync(fs.readFileSync(target));

  let ratio = 1,
    width = 100,
    height = 100;

  if (dimensions) {
    ratio = dimensions.width > max_width ? max_width / dimensions.width : 1;
    width = parseInt((dimensions ? dimensions.width : 100 * ratio).toString());
    height = parseInt((dimensions ? dimensions.height : 100 * ratio).toString());
  }

  return {
    type: "mdxJsxFlowElement",
    name: "Image",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "src",
        value: url,
      },
      {
        type: "mdxJsxAttribute",
        name: "width",
        value: width,
      },
      {
        type: "mdxJsxAttribute",
        name: "height",
        value: height,
      },
      {
        type: "mdxJsxAttribute",
        name: "alt",
        value: alt || "",
      },
      {
        type: "mdxJsxAttribute",
        name: "title",
        value: title || "",
      },
    ],
  } as MdxJsxFlowElement;
}
