import { CompileContext, Token, Extension } from "mdast-util-from-markdown";

export function highlightFromMarkdown() {
  let node: any;

  function top(stack: any) {
    return stack[stack.length - 1];
  }

  function enterHighlight(this: CompileContext, token: Token) {
    node = {
      type: "highlight",
      data: {
        hName: "mark",
      },
      children: [],
    };
    this.enter(node, token);
    this.stack;
  }

  function exitHighlight(this: CompileContext, token: Token) {
    this.exit(token);
  }

  function exithighlightData(this: CompileContext, token: Token) {
    const data = this.sliceSerialize(token);
    const current = top(this.stack);
    current.children.push({ type: "text", value: data });
  }

  return {
    enter: {
      highlight: enterHighlight,
    },
    exit: {
      highlightData: exithighlightData,
      highlight: exitHighlight,
    },
  } as Extension;
}
