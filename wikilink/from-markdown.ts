export function wikiLinkFromMarkdown() {
  let node: any;
  function enterWikiLink(this: any, token: any) {
    node = {
      type: "wikilink",
      embed: token.embed ?? false,
    };
    this.enter(node, token);
  }

  function top(stack: any) {
    return stack[stack.length - 1];
  }

  function exitWikiLink(this: any, token: any) {
    this.exit(token);
  }

  function exitWikiLinkTarget(this: any, token: any) {
    const target = this.sliceSerialize(token);
    const current = top(this.stack);
    current.url = target;
  }
  function exitWikiLinkAlias(this: any, token: any) {
    const alias = this.sliceSerialize(token);
    const current = top(this.stack);
    current.title = alias;
  }

  return {
    enter: {
      wikiLink: enterWikiLink,
    },
    exit: {
      wikiLinkTarget: exitWikiLinkTarget,
      wikiLinkAlias: exitWikiLinkAlias,
      wikiLink: exitWikiLink,
    },
  };
}
