import { Video } from "../types";
import { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import mime from "mime";
import { RemarkObsidianOptions } from "..";

export function handleVideo(node: Video, options?: RemarkObsidianOptions): MdxJsxFlowElement {
  const { url } = node;
  const type = mime.getType(url);
  return {
    type: "mdxJsxFlowElement",
    name: "Video",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "src",
        value: url,
      },
      {
        type: "mdxJsxAttribute",
        name: "type",
        value: type,
      },
    ],
  } as MdxJsxFlowElement;
}
