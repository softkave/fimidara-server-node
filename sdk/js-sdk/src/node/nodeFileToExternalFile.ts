import assert from 'assert';
import {Dirent, Stats} from 'fs';
import {stat} from 'fs/promises';
import path from 'path-browserify';
import type {FimidaraDiffExternalFile} from '../diff/types.js';

export async function nodeFileToExternalFile(props: {
  dirent?: Pick<Dirent, 'parentPath' | 'name'>;
  filepath?: string;
}): Promise<{externalFile?: FimidaraDiffExternalFile; stats: Stats}> {
  const {filepath, dirent: df} = props;

  const fp = filepath
    ? filepath
    : df
    ? path.join(df.parentPath, df.name)
    : undefined;
  assert(fp, 'nodeFileToExternalFile requires dirent or filepath');

  const stats = await stat(fp);
  return {
    stats,
    externalFile: stats.isFile()
      ? {
          name: df?.name || path.basename(fp, path.extname(fp)),
          lastModified: stats.mtimeMs,
        }
      : undefined,
  };
}
