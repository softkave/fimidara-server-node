import assert from 'assert';
import {Dirent, Stats} from 'fs';
import {stat} from 'fs/promises';
import path from 'path';
import {FimidaraDiffExternalFile} from '../diff/types.js';

export async function nodeFileToExternalFile(props: {
  dirent?: Pick<Dirent, 'parentPath' | 'name'>;
  filepath?: string;
}): Promise<{externalFile?: FimidaraDiffExternalFile; stats: Stats}> {
  const {filepath, dirent: df} = props;
  if (!filepath || !df) {
    assert(false, 'nodeFileToExternalFile requires dirent or filepath');
  }

  const fp = filepath || path.join(df.parentPath, df.name);
  const stats = await stat(fp);
  return {
    stats,
    externalFile: stats.isFile()
      ? {name: df.name, lastModified: stats.mtimeMs}
      : undefined,
  };
}
