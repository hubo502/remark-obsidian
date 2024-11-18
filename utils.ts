import { handleObsidian, RemarkObsidianOptions } from ".";
import fs from "fs-extra";
import chalk from "chalk";
import path, { dirname } from "path";
import { Node, Parent } from "unist";
import { Audio, AUDIO_TYPES, IMAGE_TYPES, MediaType, PDF, PDF_TYPES, SourceFileNotFoundError, TargetFileExistWarning, Video, VIDEO_TYPES } from "./types";
import { Image, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { wikiLinkFromMarkdown, wikiLinkSyntax } from "./wikilink";
import { MdastFigure } from "./mdast-utils/figure";
import { highlightFromMarkdown, highlightSyntax } from "./highlight";
import crypto from "crypto";

/**
 *抓取内嵌的内容块（文本/媒体）
 *
 * @param url wikilink相对连接
 * @param options
 * @param title 显示的标题
 * @returns
 */
export const fetchEmbedContent = (url: string, options: RemarkObsidianOptions, title?: string): Node | Node[] | null => {
  const [fileName, refTitle] = url.split("#");
  const [, fileExtension] = fileName.split(".");

  return fileExtension ? fetchEmbedMedia(fileName, options, title) : fetchEmbedMarkdown(fileName, options, refTitle, title);
};

function getMediaType(filename: string): MediaType | undefined {
  const [, extension] = filename.split(".");
  if (IMAGE_TYPES.includes(extension)) return "image";
  if (AUDIO_TYPES.includes(extension)) return "audio";
  if (VIDEO_TYPES.includes(extension)) return "video";
  if (PDF_TYPES.includes(extension)) return "pdf";

  return undefined;
}

export function resolveMediaFromWikilink(wikilink: string): string | null {
  const options: RemarkObsidianOptions = {
    publicRoot: process.env.PUBLIC_ROOT!,
    markdownRoot: process.env.MARKDOWN_ROOT!,
    mediaFolder: process.env.PUBLIC_MEDIA_FOLDER!,
    useJSXLink: false,
    imageMaxWidth: 1920,
    permalinks: {},
  };

  const regex = /!\[\[(.*?)\]\]/;
  const match = wikilink.match(regex);
  return match ? resolveMedia(match[1], options) : null;
}

function getFileMD5(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("md5");
  return hash.update(fileBuffer).digest("hex");
}

function isSameFile(filePath1: string, filePath2: string): boolean {
  const md5Hash1 = getFileMD5(filePath1);
  const md5Hash2 = getFileMD5(filePath2);
  console.log(chalk.gray(`[compare file] ${filePath1}[${md5Hash1}] === ${filePath2}[${md5Hash2}]`), md5Hash1 === md5Hash2);
  return md5Hash1 === md5Hash2;
}

function resolveMedia(filename: string, options: RemarkObsidianOptions): string | null {
  const { markdownRoot, publicRoot, mediaFolder } = options;

  const source = `${markdownRoot}/${filename}`;
  const uri = `/${mediaFolder}/${filename}`;
  const target = `${publicRoot}${uri}`;

  try {
    if (!fs.existsSync(source)) throw new SourceFileNotFoundError(source);
    if (fs.existsSync(target) && isSameFile(source, target)) {
      throw new TargetFileExistWarning(target);
    }

    fs.ensureDirSync(dirname(target));
    fs.copyFileSync(source, target);

    return uri;
  } catch (error) {
    if (error instanceof SourceFileNotFoundError) {
      console.log(chalk.red(error));
    } else if (error instanceof TargetFileExistWarning) {
      console.log(chalk.gray(error));
      return uri;
    } else {
      console.warn(chalk.red(error));
    }
    return null;
  }
}

function handleImageNode(src: string, options: RemarkObsidianOptions, title?: string): Image {
  return {
    url: src,
    type: "image",
    title,
    alt: title,
  } as Image;
}
function handleAudioNode(src: string, options: RemarkObsidianOptions): Audio {
  return {
    url: src,
    type: "audio",
  } as Audio;
}
function handleVideoNode(src: string, options: RemarkObsidianOptions): Video {
  return {
    url: src,
    type: "video",
    autoplay: false,
    muted: false,
  } as Video;
}
function handlePDFNode(src: string, options: RemarkObsidianOptions): PDF {
  return {
    url: src,
    type: "pdf",
  } as PDF;
}

function fetchEmbedMedia(fileName: string, options: RemarkObsidianOptions, displayName?: string): Node | Parent | null {
  const type = getMediaType(fileName);
  const src = resolveMedia(fileName, options);

  if (!src) return null;
  let node = null;

  switch (type) {
    case "image":
      node = handleImageNode(src, options, displayName);
      break;
    case "audio":
      node = handleAudioNode(src, options);
      break;
    case "video":
      node = handleVideoNode(src, options);
      break;
    case "pdf":
      node = handlePDFNode(src, options);
      break;
    default:
      break;
  }

  if (displayName) {
    return {
      type: "figure",
      caption: displayName,
      children: [node],
    } as MdastFigure;
  }

  return node;
}

type FetchEmebedMarkdown = (filename: string, options: RemarkObsidianOptions, refTitle?: string, displayNmae?: string) => Node[] | null;

const fetchEmbedMarkdown: FetchEmebedMarkdown = (fileName, options, refTitle = undefined, displayName = undefined): Node[] | null => {
  try {
    const filePath = `${options.markdownRoot}/${fileName}.md`;
    console.log(chalk.greenBright(`[fetch embed markdown] ${filePath}`));

    if (!fs.existsSync(filePath)) {
      console.log(chalk.yellow("[fetch embed markdown] file not exist."));
      return null;
    }

    const markdown = fs.readFileSync(filePath, "utf8");
    let embedTree = fromMarkdown(markdown, {
      extensions: [
        highlightSyntax(),
        wikiLinkSyntax(), //
      ],
      mdastExtensions: [
        highlightFromMarkdown(), // to mark
        wikiLinkFromMarkdown(), //wikilink
      ],
    });

    if (refTitle) {
      //是否引用某个chapter
      embedTree = extractChapter(embedTree, refTitle, displayName);
    }

    handleObsidian(options)(embedTree);
    return embedTree.children;
  } catch (e) {
    console.error(e);
    return null;
  }
};

function extractChapter(tree: Root, refTitle?: string, displayName?: string): Root {
  if (refTitle) {
    let refDepth: number = 0;
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading") {
        const found = node.children.find((item: any) => item.value == refTitle);

        if (found) {
          refDepth = node.depth;
          if (displayName) (found as any).value = displayName;
          return true;
        }
        if (node.depth >= refDepth) {
          refDepth = 0;
        }
      }

      return refDepth;
    });
  }

  return tree;
}
