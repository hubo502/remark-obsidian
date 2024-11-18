import { DocumentType } from "contentlayer2/source-files";
import path from "path";
import chalk from "chalk";
import { globSync } from "glob";
import fs from "fs-extra";
import matter from "gray-matter";

export type ResolvePermalinkOptions = {
  cwd: string;
  documentTypes: DocumentType<string>[];
  contentDirInclude?: string[];
  contentDirPath: string;
};
export default function resolvePermalinks(options: ResolvePermalinkOptions): Record<string, string> {
  const { documentTypes } = options;

  let permalinks: Record<string, string> = {};

  documentTypes.forEach((documentType) => resolvePermalinksByDocumentType(documentType, permalinks, options));

  return permalinks;
}

function resolveFilename(root: string, file: string): string {
  const relative = path.relative(root, file);

  const _path = path.parse(relative);
  return _path ? path.join(_path.dir, _path.name).split(path.sep).join("/") : "";
}

function resolvePermalinksByDocumentType(documentType: DocumentType<string>, permalinks: Record<string, string>, options: ResolvePermalinkOptions): void {
  const def = documentType.def();
  const { cwd, contentDirPath } = options;
  const dirRoot = path.join(cwd, contentDirPath);

  const files = globSync(`/${def.filePathPattern!}`, { cwd, root: contentDirPath });

  files.forEach((file) => {
    const markdown = fs.readFileSync(file, "utf-8");
    const meta = matter(markdown);
    const filename = resolveFilename(dirRoot, file);

    if (!permalinks[filename]) {
      const url = def.computedFields!.url.resolve(meta.data as any);
      console.log(chalk.green(`[permalink::${def.name}] ${filename} -> ${url}`));
      permalinks[filename] = url;
    }
  });
}
