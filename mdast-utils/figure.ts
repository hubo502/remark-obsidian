import { Node } from "unist";
import { RemarkObsidianOptions } from "..";

export interface MdastFigure extends Node {
  type: "figure";
  caption?: string;
  children: Node[];
}

export function handleFigure(node: MdastFigure, options?: RemarkObsidianOptions): any[] {
  return [...node.children, ...handleFigcaption(node.caption)];
}

function handleFigcaption(caption?: string): any[] {
  if (caption && caption.indexOf("©") >= 0) {
    const captions = caption.split("©");

    return [
      {
        data: { hName: "figcaption", hProperties: { className: "with-copyright" } },
        children: [
          { data: { hName: "span" }, children: [{ type: "text", value: captions[0] }] },
          { data: { hName: "span", hProperties: { className: "copyright" } }, children: [{ type: "text", value: `©  ${captions[1]}` }] },
        ],
      },
    ];
  } else {
    return [{ data: { hName: "figcaption" }, children: [{ type: "text", value: caption }] }];
  }
  return [""];
}
