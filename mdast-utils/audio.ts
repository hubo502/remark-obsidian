import { RemarkObsidianOptions } from "..";
import { Audio } from "../types";

export interface MdastAudio extends Node {
  type: "audio";
  data: {
    hName: "audio";
    hProperties: {
      src?: string;
      controls?: boolean;
    };
  };
}

export function handleAudio(node: Audio, options?: RemarkObsidianOptions): MdastAudio {
  const { url } = node;
  return {
    type: "audio",
    data: {
      hName: "audio",
      hProperties: {
        src: url,
        controls: true,
      },
    },
  } as MdastAudio;
}
