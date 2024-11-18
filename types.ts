import { Parent, Node } from "unist";
import { Image, Paragraph } from "mdast";

export const IMAGE_TYPES = ["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"];
export const AUDIO_TYPES = ["flac", "m4a", "mp3", "ogg", "wav", "3gp"];
export const VIDEO_TYPES = ["mkv", "mov", "mp4", "ogv", "webm"];
export const PDF_TYPES = ["PDF"];

export type MediaType = "image" | "audio" | "video" | "pdf";

export interface WikiLink extends Node {
  type: "wikilink";
  url: string;
  title?: string;
  embed?: boolean;
}

export interface Video extends Node {
  type: "video";
  url: string;
  autoplay?: boolean;
  muted?: boolean;
}

export interface Audio extends Node {
  type: "audio";
  url: string;
}

export interface PDF extends Node {
  type: "pdf";
  url: string;
}

export class SourceFileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "source file not found";
  }
}

export class TargetFileExistWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = "target file exist";
  }
}
